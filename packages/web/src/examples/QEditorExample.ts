import type { QEditorProps } from "@quartal/code-editors-core";

/** Data structure for a QEditor examples */
export interface QEditorExample {
    /** Title of the example. */
    title: string;
    /** Description of the example. */
    descr: string;
    /** Properties that should be passed to the QEditor component. */
    props: QEditorProps;
}