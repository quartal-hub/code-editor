import type { EditorType } from "@quartal/code-editors-core";
import { getClassExamples } from "./getClassExamples";
import { getExpressionExamples } from "./getExpressionExamples";
import type { QEditorExample } from "./QEditorExample";
import { getTodoExamples } from "./getTodoExamples";
import { getFilesExamples } from "./getProjectExamples";
import { getMonacoExamples } from "./getMonacoExamples";
import { getExcalidrawExamples } from "./getExcalidrawExamples";
import { getMarkdownExamples } from "./getMarkdownExamples";

export function getExamples(editor: EditorType): QEditorExample[] {
  switch (editor) {
    case "class":
      return getClassExamples();
    case "excalidraw":
      return getExcalidrawExamples();
    case "expression":
      return getExpressionExamples();
    case "markdown":
    case "markdown-hybrid":
      return getMarkdownExamples(editor);
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
    case "files":
      return getFilesExamples();
    case "function":
    default:
      return getTodoExamples(editor);
  }
}
