/** A file open in the multi-file editor. The address is the file's identity: `/{drive}/{path}`. */
export interface WorkspaceFile {
  /** Address of the file, e.g. `/data/reports/2026.md`. Also its Monaco model URI path. */
  address: string;
  /** The text of the file. */
  text: string;
  /** Monaco language id. Left out, Monaco picks it from the file extension. */
  lang?: string;
  /** The file cannot be edited. */
  readOnly?: boolean;
  /** Opaque version token of the text, handed back in `file-change` so the parent can detect stale saves. */
  version?: string;
}

/** Extra project context for the language services: files and settings that are not open in a tab. */
export interface WorkspaceContext {
  /**
   * Files the editor does not show but the language services need (siblings, `.d.ts`), by address.
   * The list replaces the previous one: files not listed any more are forgotten.
   */
  files?: Record<string, string>;
  /** Text of the project's `tsconfig.json`; sets the TypeScript compiler options. */
  tsconfig?: string;
  /** Text of the project's `package.json`; its dependencies' type definitions are loaded. */
  packageJson?: string;
}

/** A position or range to reveal in a file. */
export interface WorkspaceSelection {
  /** First line, 1-based. */
  startLineNumber: number;
  /** First column, 1-based. */
  startColumn: number;
  /** Last line. Left out for a position. */
  endLineNumber?: number;
  /** Last column. Left out for a position. */
  endColumn?: number;
}

/** Messages from the parent window to the multi-file editor page (protocol 2). */
export type FilesEditorInMessage =
  | { type: "open-file"; file: WorkspaceFile; show?: boolean; selection?: WorkspaceSelection }
  | { type: "show-file"; address: string; selection?: WorkspaceSelection }
  | { type: "close-file"; address: string }
  | { type: "rename-file"; from: string; to: string }
  | { type: "update-file"; address: string; text: string; version?: string }
  | { type: "set-context"; context: WorkspaceContext }
  | { type: "set-options"; readOnly?: boolean; theme?: string }
  | { type: "set-data"; data: { files?: Record<string, string>; active?: string; context?: WorkspaceContext } };

/** Messages from the multi-file editor page to the parent window (protocol 2). */
export type FilesEditorOutMessage =
  | { type: "editor-ready"; protocol: 2 }
  | { type: "file-change"; address: string; text: string; version?: string }
  | { type: "file-command"; command: "save"; address: string }
  | { type: "file-request"; address: string; selection?: WorkspaceSelection }
  | { type: "file-focus"; address: string };
