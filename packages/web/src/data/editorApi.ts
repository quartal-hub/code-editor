import type { EditorType } from "@quartal/code-editors-core";

/** The editors listed in the API table, in column order. */
export const apiEditors: { type: EditorType; label: string }[] = [
  { type: "monaco", label: "monaco" },
  { type: "markdown", label: "markdown" },
  { type: "markdown-hybrid", label: "markdown-hybrid" },
  { type: "expression", label: "expression" },
  { type: "class", label: "class" },
  { type: "excalidraw", label: "excalidraw" },
  { type: "files", label: "files" },
];

/** One attribute, method or event of the `qrtl-editor` element and the editors that support it. */
export interface ApiItem {
  /** Name as used in HTML or JavaScript. */
  name: string;
  /** What it does, in one sentence. */
  description: string;
  /** The editors that support it. */
  editors: EditorType[];
}

const all: EditorType[] = apiEditors.map((e) => e.type);
const text: EditorType[] = ["monaco", "markdown", "markdown-hybrid", "expression", "class", "excalidraw"];
const changing: EditorType[] = ["monaco", "markdown", "markdown-hybrid", "expression", "class", "excalidraw"];

/**
 * The attributes, methods and events of `<qrtl-editor>`, by editor. This is the source of the table on the About page:
 * when `public/qrtl-editor.js` or an editor page changes, change it here too.
 */
export const editorApi: { attributes: ApiItem[]; methods: ApiItem[]; events: ApiItem[] } = {
  attributes: [
    { name: "type", description: "The editor to show. Default monaco.", editors: all },
    { name: "read-only", description: "The editor refuses edits. Monaco and files take a change without reloading; the others reload.", editors: all },
    { name: "base-url", description: "Address of the Code UI site, when it is not the one that served qrtl-editor.js.", editors: all },
    { name: "code", description: "The text to edit. For excalidraw a JSON string.", editors: text },
    { name: "lang", description: "Language of the code, e.g. javascript.", editors: ["monaco", "expression"] },
    { name: "view", description: "Variant: plain or excel; single-class or multi-class.", editors: ["expression", "class"] },
    { name: "schema", description: "JSON schema options for JSON (a JSON string).", editors: ["monaco"] },
    { name: "data", description: "An object: the scene of excalidraw; { files, active?, context? } of files.", editors: ["excalidraw", "files"] },
  ],
  methods: [
    { name: "setData({ code?, data?, schema?, readOnly? })", description: "Changes what the editor shows without changing the attributes. Monaco takes all four; the others code or data.", editors: all },
    { name: "openFile(file, { show?, selection? })", description: "Opens a file: { address, text, lang?, readOnly?, version? }.", editors: ["files"] },
    { name: "showFile(address, selection?)", description: "Shows an open file.", editors: ["files"] },
    { name: "closeFile(address)", description: "Closes a file.", editors: ["files"] },
    { name: "renameFile(from, to)", description: "Follows a rename or move of a file or folder.", editors: ["files"] },
    { name: "updateFile(address, text, version?)", description: "Replaces the text with a change made elsewhere.", editors: ["files"] },
    { name: "setContext({ files?, tsconfig?, packageJson? })", description: "Gives the project around the open files, so imports resolve.", editors: ["files"] },
    { name: "setOptions({ readOnly?, theme? })", description: "Editor-wide options.", editors: ["files"] },
  ],
  events: [
    { name: "ready", description: "The editor is up; detail: { protocol }. Send files after it. Raised again if the editor reloads.", editors: all },
    { name: "change", description: "The user changed the content; detail: { code } or { data }, with cursorPosition for code editors.", editors: changing },
    { name: "link-open", description: "The user opened a link in the drawing; detail: { link, detail }.", editors: ["excalidraw"] },
    { name: "file-change", description: "The user edited a file; detail: { address, text, version? }.", editors: ["files"] },
    { name: "file-save", description: "The user pressed Ctrl+S; detail: { address }.", editors: ["files"] },
    { name: "file-request", description: "The user went to a file that is not open (go to definition); detail: { address, selection? }.", editors: ["files"] },
    { name: "file-focus", description: "The editor showed another open file; detail: { address }.", editors: ["files"] },
  ],
};
