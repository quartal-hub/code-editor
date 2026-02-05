import type { QEditorProps } from "@quartal/code-editors-core";

/** Data structure for a QEditor examples */
export interface QEditorExample {
    /** Title of the example. */
    title: string;
    /** Description of the example. */
    descr: string;
    /** Mode of the example: Currently only "event" in use (TODO: Go through => make consistent) */
    mode?: "event";
    /** Properties that should be passed to the QEditor component. */
    props: QEditorProps;
}