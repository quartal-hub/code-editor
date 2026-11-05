import type { WorkspaceContext } from "@quartal/code-editors-core";

/** A set of files for the multi-file editor: the data of a `set-data` message and of the demo examples. */
export interface FilesData {
  /** The text of the files by address, e.g. `/src/main.ts`. */
  files: Record<string, string>;
  /** The file to show first. Default: the first file. */
  active?: string;
  /** Extra context for the language services. The files above are always part of it. */
  context?: WorkspaceContext;
}
