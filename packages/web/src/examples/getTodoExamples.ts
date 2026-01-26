import type { QEditorProps } from "@/publish";
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