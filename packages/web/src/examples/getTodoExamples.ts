import type { QEditorProps } from "@quartal/code-editors-core";
import type { QEditorExample } from "./QEditorExample";

/** These examples have not been implemented yet. */
export function getTodoExamples(type: QEditorProps["type"]): QEditorExample[] {
    return [
      {
        title: "TODO: " + type,
        descr: "TODO: " + type,
        props: {
          type,
        },
      }
    ];
}