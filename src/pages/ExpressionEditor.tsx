import { MonacoEditor } from "@/components/editors";
import { useQEditorPropsFromQuery } from "@/hooks";

function ExpressionEditor(): JSX.Element {
  const props = useQEditorPropsFromQuery("expression");
  const readOnly = props.mode === "read-only";
  const mode: "plain" | "excel" = props.mode == "plain" ? "plain" : "excel";

  const options = {
    // Make it feel like a formula / expression editor
    lineNumbers: "off",
    glyphMargin: false,
    folding: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    renderLineHighlight: "none",
    wordWrap: "on",
    contextmenu: false,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    tabSize: 2,
    padding: { top: 10, bottom: 10 },
  }

  return (
    mode === "plain" ? (
      <div className="h-100">
        <MonacoEditor
          code={props.code ?? ""}
          lang={props.lang ?? "javascript"}
          readOnly={readOnly}
          theme="vs-light"
          options={options}
        />
      </div>
    ) : (
      <div className="h-100 border rounded">
        <div className="p-2 d-flex align-items-start" style={{ backgroundColor: "var(--bs-gray-200)" }}>
          <div className="btn-group me-2 flex-shrink-0 flex-grow-0">
            <button className="btn btn-outline-primary p-2 pb-1" type="button"><span
              className="material-symbols-outlined text-success">check</span></button>
            <button className="btn btn-outline-primary p-2 pb-1" type="button"><span
              className="material-symbols-outlined text-danger">close</span></button>
            <button className="btn btn-outline-primary p-2 pb-1" type="button"><span
              className="material-symbols-outlined">function</span></button>
          </div>
          <div className="flex-shrink-1 flex-grow-1 border border-primary position-relative rounded p-1 ps-4 bg-white" style={{ height: "120px" }}>
            <span className="position-absolute badge text-primary"
              style={{ top: "2px", left: "-6px", fontSize: "1.5rem", fontWeight: "bold" }}>=</span>
            <div className="h-100">
              <MonacoEditor
                code={props.code ?? ""}
                lang={props.lang ?? "javascript"}
                readOnly={readOnly}
                theme="vs-light"
                options={options}
              />
            </div>
          </div>
        </div>
      </div>
    )
  )
};


export default ExpressionEditor;
