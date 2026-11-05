/** Properties for the QEditor component. */
export interface QEditorProps {

    /** Type of the editor to show. */
    type: "monaco" | "expression" | "function" | "class" | "files" | "excalidraw" | "markdown" | "markdown-hybrid";
    /** Optional view style for editors (e.g. expression "plain" | "excel"). */
    view?: string;
    /**
     * If true, editor is read-only. False is editable.
     * Default (undefined) depends on the case, typically false.
     */
    readOnly?: boolean;
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
     * This is not designed to be used in url based UIs.
     */
    data?: Record<string, unknown>;
  }