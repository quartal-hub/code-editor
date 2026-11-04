import { beforeEach, describe, expect, it } from "vitest";
import { WorkspaceModels } from "./WorkspaceModels";

/** The part of Monaco that WorkspaceModels uses: models with an edit history, and an editor that shows one. */
class FakeModel {
  public disposed = false;
  public language: string | undefined;
  private text: string;
  private listeners: (() => void)[] = [];
  constructor(text: string, language: string | undefined, public uri: { path: string }) {
    this.text = text;
    this.language = language;
  }
  getValue() { return this.text; }
  getLanguageId() { return this.language ?? "plaintext"; }
  getFullModelRange() { return { full: true }; }
  pushEditOperations(_before: unknown[], edits: { text: string }[]) {
    this.text = edits[0]!.text;
    this.listeners.forEach((l) => l());
    return null;
  }
  /** What the user typing does. */
  type(text: string) {
    this.text = text;
    this.listeners.forEach((l) => l());
  }
  onDidChangeContent(cb: () => void) {
    this.listeners.push(cb);
    return { dispose: () => { this.listeners = this.listeners.filter((l) => l !== cb); } };
  }
  dispose() { this.disposed = true; }
}

function fakeMonaco() {
  const models = new Map<string, FakeModel>();
  let opener: { openCodeEditor: (source: unknown, resource: { path: string }, selection?: unknown) => boolean } | undefined;
  const monaco = {
    Uri: { from: ({ path }: { path: string }) => ({ path, toString: () => `file://${path}` }) },
    editor: {
      createModel: (text: string, lang: string | undefined, uri: { path: string }) => {
        const model = new FakeModel(text, lang, uri);
        models.set(uri.path, model);
        return model;
      },
      setModelLanguage: (model: FakeModel, lang: string) => { model.language = lang; },
      registerEditorOpener: (o: typeof opener) => { opener = o; return { dispose() { opener = undefined; } }; },
    },
  };
  const editor = {
    model: null as FakeModel | null,
    options: {} as Record<string, unknown>,
    selection: undefined as unknown,
    revealed: undefined as unknown,
    saved: 0,
    setModel(m: FakeModel | null) { this.model = m; },
    saveViewState() { return { of: this.model?.uri.path, n: ++this.saved }; },
    restoreViewState(state: unknown) { this.restored = state; },
    restored: undefined as unknown,
    updateOptions(o: Record<string, unknown>) { Object.assign(this.options, o); },
    setSelection(r: unknown) { this.selection = r; },
    revealRangeInCenterIfOutsideViewport(r: unknown) { this.revealed = r; },
  };
  return { monaco, editor, models, opener: () => opener };
}

let m: ReturnType<typeof fakeMonaco>;
let changes: [string, string, string | undefined][];
let requests: [string, unknown][];
let shown: (string | undefined)[];
let ws: WorkspaceModels;

beforeEach(() => {
  m = fakeMonaco();
  changes = [];
  requests = [];
  shown = [];
  ws = new WorkspaceModels(m.monaco, m.editor, {
    onChange: (a, t, v) => changes.push([a, t, v]),
    onOpenRequest: (a, s) => requests.push([a, s]),
    onShown: (a) => shown.push(a),
  });
});

describe("WorkspaceModels", () => {
  it("opens a file as a model under its address and shows it", () => {
    ws.open({ address: "/data/a.ts", text: "const a = 1;", lang: "typescript", version: "v1" });
    expect(m.models.get("/data/a.ts")?.getValue()).toBe("const a = 1;");
    expect(m.models.get("/data/a.ts")?.language).toBe("typescript");
    expect(m.editor.model).toBe(m.models.get("/data/a.ts"));
    expect(ws.shown).toBe("/data/a.ts");
    expect(ws.openAddresses).toEqual(["/data/a.ts"]);
  });

  it("opens without showing, and keeps the shown file", () => {
    ws.open({ address: "/a", text: "a" });
    ws.open({ address: "/b", text: "b" }, false);
    expect(ws.shown).toBe("/a");
    expect(ws.openAddresses).toEqual(["/a", "/b"]);
  });

  it("keeps each file's view state when switching, and restores it", () => {
    ws.open({ address: "/a", text: "a" });
    ws.open({ address: "/b", text: "b" });
    expect(m.editor.restored).toBeUndefined();
    ws.show("/a");
    expect(m.editor.restored).toEqual({ of: "/a", n: 1 });
    ws.show("/b");
    expect(m.editor.restored).toEqual({ of: "/b", n: 2 });
  });

  it("reports the user's edits with the file's version, and not the host's own updates", () => {
    ws.open({ address: "/a", text: "a", version: "v1" });
    m.models.get("/a")!.type("a!");
    expect(changes).toEqual([["/a", "a!", "v1"]]);
    ws.update("/a", "remote", "v2");
    expect(m.models.get("/a")!.getValue()).toBe("remote");
    expect(changes).toHaveLength(1);
    m.models.get("/a")!.type("remote+");
    expect(changes.at(-1)).toEqual(["/a", "remote+", "v2"]);
  });

  it("ignores an update that changes nothing, and one for an unknown file", () => {
    ws.open({ address: "/a", text: "a" });
    ws.update("/a", "a");
    ws.update("/zzz", "x");
    expect(changes).toEqual([]);
  });

  it("applies a file's read-only state when it is shown", () => {
    ws.open({ address: "/a", text: "a", readOnly: true });
    expect(m.editor.options.readOnly).toBe(true);
    ws.open({ address: "/b", text: "b" });
    expect(m.editor.options.readOnly).toBe(false);
    ws.setReadOnly(true);
    expect(m.editor.options.readOnly).toBe(true);
  });

  it("closes: shows the last open file, then nothing, and disposes the model", () => {
    ws.open({ address: "/a", text: "a" });
    ws.open({ address: "/b", text: "b" });
    ws.open({ address: "/c", text: "c" });
    ws.close("/c");
    expect(ws.shown).toBe("/b");
    expect(m.models.get("/c")!.disposed).toBe(true);
    ws.close("/a");
    expect(ws.shown).toBe("/b");
    ws.close("/b");
    expect(ws.shown).toBeUndefined();
    expect(m.editor.model).toBeNull();
    expect(shown).toEqual(["/b", undefined]);
    ws.close("/nope");
  });

  it("stops reporting edits of a closed file", () => {
    ws.open({ address: "/a", text: "a" });
    const model = m.models.get("/a")!;
    ws.close("/a");
    model.type("late");
    expect(changes).toEqual([]);
  });

  it("renames a file: same text, same view state, still shown", () => {
    ws.open({ address: "/d/a.md", text: "text" });
    ws.open({ address: "/d/b.md", text: "b" });
    ws.show("/d/a.md");
    const old = m.models.get("/d/a.md")!;
    ws.rename("/d/a.md", "/d/z.md");
    expect(ws.openAddresses).toEqual(["/d/b.md", "/d/z.md"]);
    expect(ws.shown).toBe("/d/z.md");
    expect(m.models.get("/d/z.md")!.getValue()).toBe("text");
    expect(old.disposed).toBe(true);
    m.models.get("/d/z.md")!.type("text2");
    expect(changes).toEqual([["/d/z.md", "text2", undefined]]);
  });

  it("renames a folder: everything under it, but not a look-alike", () => {
    ws.open({ address: "/d/dir/a.ts", text: "a" });
    ws.open({ address: "/d/dir/sub/b.ts", text: "b" });
    ws.open({ address: "/d/dir2/c.ts", text: "c" });
    ws.setContext({ files: { "/d/dir/lib.d.ts": "lib" } });
    ws.rename("/d/dir", "/d/folder");
    expect(ws.openAddresses.sort()).toEqual(["/d/dir2/c.ts", "/d/folder/a.ts", "/d/folder/sub/b.ts"]);
    expect(ws.getText("/d/folder/lib.d.ts")).toBe("lib");
  });

  it("keeps background context files for the language services, and forgets removed ones", () => {
    ws.open({ address: "/p/main.ts", text: "import './lib'" });
    ws.setContext({ files: { "/p/lib.ts": "export {}", "/p/types.d.ts": "declare const x: 1;" } });
    expect(m.models.get("/p/lib.ts")?.getValue()).toBe("export {}");
    expect(ws.openAddresses).toEqual(["/p/main.ts"]);
    ws.setContext({ files: { "/p/lib.ts": "export const y = 1;" } });
    expect(m.models.get("/p/lib.ts")!.getValue()).toBe("export const y = 1;");
    expect(m.models.get("/p/types.d.ts")!.disposed).toBe(true);
    expect(changes).toEqual([]);
  });

  it("opens a background file with the model it already has, and the tab's text wins over the context", () => {
    ws.setContext({ files: { "/p/lib.ts": "from context" } });
    const background = m.models.get("/p/lib.ts")!;
    ws.open({ address: "/p/lib.ts", text: "from host" });
    expect(m.editor.model).toBe(background);
    expect(background.getValue()).toBe("from host");
    ws.setContext({ files: { "/p/lib.ts": "context again" } });
    expect(background.getValue()).toBe("from host");
    // Closing it returns it to the context, as the context says.
    ws.close("/p/lib.ts");
    expect(background.disposed).toBe(false);
    expect(ws.getText("/p/lib.ts")).toBe("from host");
  });

  it("asks the host to open a file the user navigates to, and shows one that is already open", () => {
    ws.open({ address: "/a", text: "a" });
    ws.open({ address: "/b", text: "b" }, false);
    const opener = m.opener()!;
    expect(opener.openCodeEditor(null, { path: "/b" }, { startLineNumber: 3, startColumn: 1 })).toBe(true);
    expect(ws.shown).toBe("/b");
    expect(m.editor.selection).toEqual({ startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 1 });
    expect(shown.at(-1)).toBe("/b");
    expect(opener.openCodeEditor(null, { path: "/elsewhere.ts" }, { startLineNumber: 2, startColumn: 4 })).toBe(true);
    expect(requests).toEqual([["/elsewhere.ts", { startLineNumber: 2, startColumn: 4 }]]);
  });

  it("reveals a selection given when showing a file", () => {
    ws.open({ address: "/a", text: "a\nb\nc" }, true, { startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 2 });
    expect(m.editor.revealed).toEqual({ startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 2 });
  });

  it("disposes everything", () => {
    ws.open({ address: "/a", text: "a" });
    ws.setContext({ files: { "/b": "b" } });
    ws.dispose();
    expect(m.models.get("/a")!.disposed).toBe(true);
    expect(m.models.get("/b")!.disposed).toBe(true);
    expect(m.opener()).toBeUndefined();
    expect(ws.shown).toBeUndefined();
  });
});
