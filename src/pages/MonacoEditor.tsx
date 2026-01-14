import { MonacoEditor } from "@/components/editors";
import { useQEditorPropsFromQuery } from "@/hooks";

function MonacoEditorPage(): JSX.Element {
  const props = useQEditorPropsFromQuery("monaco");
  const readOnly = props.mode === "read-only";

  return (
    <MonacoEditor
      code={props.code}
      lang={props.lang}
      readOnly={readOnly}
    />
  );
}

export default MonacoEditorPage;
