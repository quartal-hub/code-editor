/**
 * A code file is a single file in a project.
 * Compoatible with Sandpack's CodeFile interface.
 */
export interface CodeFile {
    /** The code of the file. */
    code: string;
    /** If true, the file is not shown in the editor. */
    hidden?: boolean;
    /** If true, the file is the active file in the editor. */
    active?: boolean;
    /** If true, the file is read only: Should not be editable in the editor. */
    readOnly?: boolean;
}