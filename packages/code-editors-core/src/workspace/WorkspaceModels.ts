import { MonacoHelper, type MonacoInstance } from "../helpers/MonacoHelper";
import type { WorkspaceContext, WorkspaceFile, WorkspaceSelection } from "./WorkspaceFile";

/** Callbacks of {@link WorkspaceModels}. */
export interface WorkspaceModelsHandlers {
  /** The user changed the text of an open file. Not called for changes made by {@link WorkspaceModels.update}. */
  onChange?: (address: string, text: string, version?: string) => void;
  /** The user asked for a file that is not shown (go to definition): the parent should open it. */
  onOpenRequest?: (address: string, selection?: WorkspaceSelection) => void;
  /** The shown file changed (the user clicked into another model, or a close made another one current). */
  onShown?: (address: string | undefined) => void;
}

interface OpenFile {
  model: any;
  readOnly: boolean;
  version?: string;
  viewState?: unknown;
  listener: { dispose: () => void };
}

/** True if `address` is `under` or lies below it. */
function isUnder(address: string, under: string): boolean {
  return address === under || address.startsWith(`${under}/`);
}

/**
 * One Monaco editor, one **model per file**: the files open in the host's tabs, plus background
 * files the language services need. Switching files keeps each file's cursor, scroll and undo history;
 * TypeScript sees all the models, so completion and go to definition work across files.
 *
 * Framework-free: it takes the Monaco API and an editor instance (`@monaco-editor/loader` or the
 * `monaco-editor` package) and nothing else.
 */
export class WorkspaceModels {
  private readonly monaco: MonacoInstance;
  private readonly editor: any;
  private readonly handlers: WorkspaceModelsHandlers;
  private readonly opened = new Map<string, OpenFile>();
  private readonly background = new Map<string, any>();
  private context: WorkspaceContext = {};
  private current?: string;
  private applyingRemote = false;
  private pendingReveal = new Map<string, WorkspaceSelection>();
  private disposables: { dispose: () => void }[] = [];

  /**
   * @param monaco The Monaco API.
   * @param editor The editor instance whose model is switched.
   * @param handlers What to tell the host.
   */
  constructor(monaco: MonacoInstance, editor: any, handlers: WorkspaceModelsHandlers = {}) {
    this.monaco = monaco;
    this.editor = editor;
    this.handlers = handlers;
    monaco.languages?.typescript?.typescriptDefaults?.setEagerModelSync?.(true);
    monaco.languages?.typescript?.javascriptDefaults?.setEagerModelSync?.(true);
    const opener = monaco.editor.registerEditorOpener?.({
      openCodeEditor: (_source: unknown, resource: { path: string }, selection?: WorkspaceSelection) => {
        if (resource.path === this.current) {
          if (selection) this.reveal(selection);
          return true;
        }
        if (this.opened.has(resource.path)) {
          this.show(resource.path, selection);
          this.handlers.onShown?.(resource.path);
          return true;
        }
        this.handlers.onOpenRequest?.(resource.path, selection);
        return true;
      },
    });
    if (opener) this.disposables.push(opener);
  }

  /** The addresses of the open files, in the order they were opened. */
  public get openAddresses(): string[] {
    return [...this.opened.keys()];
  }

  /** The address of the file the editor shows, if any. */
  public get shown(): string | undefined {
    return this.current;
  }

  /** The text of an open or background file. */
  public getText(address: string): string | undefined {
    return (this.opened.get(address)?.model ?? this.background.get(address))?.getValue();
  }

  private uriOf(address: string): any {
    return this.monaco.Uri.from({ scheme: "file", path: address });
  }

  private createModel(file: WorkspaceFile): any {
    return this.monaco.editor.createModel(file.text, file.lang, this.uriOf(file.address));
  }

  private track(address: string, model: any, file?: Pick<WorkspaceFile, "readOnly" | "version">): OpenFile {
    const entry: OpenFile = {
      model,
      readOnly: file?.readOnly ?? false,
      version: file?.version,
      listener: model.onDidChangeContent(() => {
        if (this.applyingRemote) return;
        this.handlers.onChange?.(address, model.getValue(), this.opened.get(address)?.version);
      }),
    };
    this.opened.set(address, entry);
    return entry;
  }

  /**
   * Opens a file: makes its model, from the text given. An open file's text is replaced only when
   * it differs (use {@link update} for a change made elsewhere).
   * @param file The file.
   * @param show Show it in the editor (default true).
   */
  public open(file: WorkspaceFile, show = true, selection?: WorkspaceSelection): void {
    const existing = this.opened.get(file.address);
    if (existing) {
      existing.readOnly = file.readOnly ?? existing.readOnly;
      existing.version = file.version ?? existing.version;
    } else {
      const background = this.background.get(file.address);
      let model = background;
      if (model) {
        this.background.delete(file.address);
        if (model.getValue() !== file.text) this.setText(model, file.text);
        if (file.lang) this.monaco.editor.setModelLanguage(model, file.lang);
      } else {
        model = this.createModel(file);
      }
      this.track(file.address, model, file);
    }
    if (show) this.show(file.address, selection);
  }

  /** Shows an open file, saving the view state of the one it replaces. */
  public show(address: string, selection?: WorkspaceSelection): void {
    const next = this.opened.get(address);
    if (!next) return;
    if (this.current && this.current !== address) {
      const previous = this.opened.get(this.current);
      if (previous) previous.viewState = this.editor.saveViewState();
    }
    if (this.current !== address) {
      this.editor.setModel(next.model);
      this.current = address;
      if (next.viewState) this.editor.restoreViewState(next.viewState);
    }
    this.editor.updateOptions({ readOnly: next.readOnly });
    if (selection) this.pendingReveal.set(address, selection);
    const reveal = this.pendingReveal.get(address);
    if (reveal) {
      this.pendingReveal.delete(address);
      this.reveal(reveal);
    }
  }

  private reveal(selection: WorkspaceSelection): void {
    const range = {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn,
      endLineNumber: selection.endLineNumber ?? selection.startLineNumber,
      endColumn: selection.endColumn ?? selection.startColumn,
    };
    this.editor.setSelection(range);
    this.editor.revealRangeInCenterIfOutsideViewport(range);
  }

  /** Closes a file. If it was shown, the editor shows the last open file, or nothing. */
  public close(address: string): void {
    const entry = this.opened.get(address);
    if (!entry) return;
    const wasShown = this.current === address;
    this.opened.delete(address);
    entry.listener.dispose();
    if (wasShown) {
      this.current = undefined;
      const next = [...this.opened.keys()].pop();
      if (next) this.show(next);
      else this.editor.setModel(null);
      this.handlers.onShown?.(this.current);
    }
    const contextText = this.context.files?.[address];
    if (contextText !== undefined) {
      // Still part of the project context: keep a background model with the text it had.
      this.background.set(address, entry.model);
    } else {
      entry.model.dispose();
    }
  }

  /** Follows a rename or move of a file or folder: the models, their view states and the shown file. */
  public rename(from: string, to: string): void {
    const move = (address: string): string => to + address.slice(from.length);
    for (const [address, entry] of [...this.opened]) {
      if (!isUnder(address, from)) continue;
      const wasShown = this.current === address;
      const text = entry.model.getValue();
      const lang = entry.model.getLanguageId?.();
      entry.listener.dispose();
      this.opened.delete(address);
      if (wasShown) this.current = undefined;
      const model = this.monaco.editor.createModel(text, lang, this.uriOf(move(address)));
      const created = this.track(move(address), model, entry);
      created.viewState = entry.viewState;
      if (wasShown) {
        this.editor.setModel(model);
        this.current = move(address);
        if (created.viewState) this.editor.restoreViewState(created.viewState);
      }
      entry.model.dispose();
    }
    for (const [address, model] of [...this.background]) {
      if (!isUnder(address, from)) continue;
      const created = this.monaco.editor.createModel(model.getValue(), undefined, this.uriOf(move(address)));
      this.background.delete(address);
      this.background.set(move(address), created);
      model.dispose();
    }
    if (this.context.files) {
      this.context = {
        ...this.context,
        files: Object.fromEntries(Object.entries(this.context.files).map(([a, t]) => [isUnder(a, from) ? move(a) : a, t])),
      };
    }
  }

  /**
   * Replaces the text of an open or background file with a change made elsewhere (another client, a
   * reload). Done as an edit, so undo still works. Does not raise `onChange`.
   */
  public update(address: string, text: string, version?: string): void {
    const entry = this.opened.get(address);
    const model = entry?.model ?? this.background.get(address);
    if (!model) return;
    if (entry && version !== undefined) entry.version = version;
    if (model.getValue() !== text) this.setText(model, text);
  }

  private setText(model: any, text: string): void {
    this.applyingRemote = true;
    try {
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text }], () => null);
    } finally {
      this.applyingRemote = false;
    }
  }

  /**
   * Sets the project context: background files, the TypeScript options from `tsconfig`.
   * `packageJson` is for the caller (type definitions are fetched, see `MonacoPackages`).
   */
  public setContext(context: WorkspaceContext): void {
    if (context.files) {
      const wanted = new Set(Object.keys(context.files));
      for (const [address, model] of [...this.background]) {
        if (!wanted.has(address)) {
          model.dispose();
          this.background.delete(address);
        }
      }
      for (const [address, text] of Object.entries(context.files)) {
        const open = this.opened.get(address);
        if (open) continue; // The tab's own text wins.
        const existing = this.background.get(address);
        if (existing) {
          if (existing.getValue() !== text) this.setText(existing, text);
        } else {
          this.background.set(address, this.monaco.editor.createModel(text, undefined, this.uriOf(address)));
        }
      }
    }
    this.context = { ...this.context, ...context };
    if (context.tsconfig !== undefined && this.monaco.languages?.typescript) {
      MonacoHelper.applyCompilerOptions(this.monaco, context.tsconfig);
    }
  }

  /** Sets whether the shown file may be edited. A file's own `readOnly` still applies when shown. */
  public setReadOnly(readOnly: boolean): void {
    this.editor.updateOptions({ readOnly: readOnly || (this.current ? this.opened.get(this.current)?.readOnly === true : false) });
  }

  /** Disposes every model and listener. The editor itself is the caller's. */
  public dispose(): void {
    for (const entry of this.opened.values()) {
      entry.listener.dispose();
      entry.model.dispose();
    }
    for (const model of this.background.values()) model.dispose();
    this.opened.clear();
    this.background.clear();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.current = undefined;
  }
}
