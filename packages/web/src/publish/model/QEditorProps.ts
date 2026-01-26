/** Properties for the QEditor component. */
export interface QEditorProps {

    /** Type of the editor to show. */
    type: "monaco" | "monaco-react" | "expression" | "function" | "class" | "project";
    /**
     * Type specific set of modes for the editor.
     * Typically at least "default", "read-only".
     */
    mode?: string;
    /** Code to show in the editor. Used in simple single-file usecases. */
    code?: string;
    /**
     * URL of the code to show in the editor. Alternative to code. 
     * URL must support anonymous access.
     */
    url?: string;
    /** Language of the code to show in the editor. Used together with code in single-file usecases. */
    lang?: string;
    /**
     * Full data to pass to the editor. Used in complex usecases.
     * Each editor type defines its own data structure as an interface.
     */
    data?: Record<string, unknown>;
    /** Event that is triggered when the code changes. */
    onChange?: (value: unknown) => void;
  }