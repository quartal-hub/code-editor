import type { EditorType } from "@quartal/code-editors-core";
import { getClassExamples } from "./getClassExamples";
import { getExpressionExamples } from "./getExpressionExamples";
import type { QEditorExample } from "./QEditorExample";
import { getTodoExamples } from "./getTodoExamples";
import { getProjectExamples } from "./getProjectExamples";
import { getMonacoExamples } from "./getMonacoExamples";
import { getExcalidrawExamples } from "./getExcalidrawExamples";

export function getExamples(editor: EditorType): QEditorExample[] {
  switch (editor) {
    case "class":
      return getClassExamples();
    case "excalidraw":
      return getExcalidrawExamples();
    case "expression":
      return getExpressionExamples();
    case "monaco":
      return getMonacoExamples();
    case "monaco-react": {
      const examples = getMonacoExamples();
      return examples.map((example) => ({
        ...example,
        props: {
          ...example.props,
          type: "monaco-react",
        },
      }));
    }
    case "project":
      return getProjectExamples();
    case "function":
    default:
      return getTodoExamples(editor);
  }
}
