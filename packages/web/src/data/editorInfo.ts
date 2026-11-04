import type { EditorType } from "@quartal/code-editors-core";

/** Information about an editor, how it can be used etc. */
export type EditorInfo = {
  /** Title of the editor. */
  title: string;
  /** Platform: Either Vue or React. */
  platform: "vue" | "react";
  /** Description of the editor, shown on demo page */
  description: string;
  /** If true supports fetching code from a URL. */
  fetch: boolean;

  /**
   * Type of suppoort for file system access (currently bowser, may later be some other FS API).
   * - "file": Single file
   * - "folder": Folder
   * - "none": No file system access
   */
  fs: "file" | "folder" | "none";
};

export const editorInfo: Record<EditorType, EditorInfo> = {
  class: {
    title: "Class Editor",
    platform: "vue",
    description:
      "Class editor for Quartal Hub scripts. Select a sample to load it into the editor.",
    fetch: true,
    fs: "file",
  },
  expression: {
    title: "Expression Editor",
    platform: "vue",
    description:
      "JavaScript expression editor (think Excel formula editor, but JS). Write the expression only — no return statement.",
    fetch: true,
    fs: "file",
  },
  function: {
    title: "Function Editor",
    platform: "vue",
    description: "Editor for a single function within a class",
    fetch: false,
    fs: "none",
  },
  monaco: {
    title: "Monaco Editor",
    platform: "vue",
    description:
      "This is the basic Monaco code editor for editing miscellaneous single code files, typically JSON for data, CSS / skins, JS/TS or HTML.",
    fetch: true,
    fs: "file",
  },
  "monaco-react": {
    title: "Monaco Editor (React)",
    platform: "react",
    description:
      "This is the basic Monaco code editor for editing miscellaneous single code files, typically JSON for data, CSS / skins, JS/TS or HTML.",
    fetch: true,
    fs: "file",
  },
  project: {
    title: "Project Editor",
    platform: "react",
    description:
      "Project editor for Quartal Hub business logic tools and Quartal Hub UXs",
    fetch: true,
    fs: "folder",
  },
  markdown: {
    title: "Markdown Editor",
    platform: "vue",
    description:
      "WYSIWYG Markdown editor (Milkdown Crepe) for editing Markdown documents as rendered text.",
    fetch: true,
    fs: "file",
  },
  "markdown-hybrid": {
    title: "Markdown Editor (hybrid)",
    platform: "vue",
    description:
      "Obsidian-like hybrid Markdown editor (@vscode/markdown-editor): the text is rendered, but the Markdown markers are shown in the block that is being edited. Test / evaluation purposes only: use the main Markdown editor (/markdown) instead.",
    fetch: true,
    fs: "file",
  },
  excalidraw: {
    title: "Excalidraw Editor",
    platform: "react",
    description:
      "This is the Excalidraw editor for editing and displaying drawings and diagrams. See https://excalidraw.com/ for more information.",
    fetch: true,
    fs: "file",
  },
};

export const editorList = Object.keys(editorInfo);
