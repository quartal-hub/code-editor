import type { CodeFile } from "./CodeFile";

/**
 * A set of code files in a project that may contain multiple files.
 * Compatible with Sandpack's CodeFiles interface.
 * The key is the path to the file, the value is the code or the CodeFile object.
 */
export type CodeFiles = Record<string, string | CodeFile>;