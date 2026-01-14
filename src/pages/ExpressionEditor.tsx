import { useState, useRef, useEffect } from "react";
import { MonacoEditor } from "@/components/editors";
import { useMonacoSetup, useQEditorPropsFromQuery } from "@/hooks";

function ExpressionEditor(): JSX.Element {
  const { code, lang, mode: modeProp, updateHash } = useQEditorPropsFromQuery("expression");
  const readOnly = modeProp === "read-only";
  const mode: "plain" | "excel" = modeProp == "plain" ? "plain" : "excel";
  
  // For excel mode: track original code and current edited code
  const [originalCode, setOriginalCode] = useState<string>(code ?? "");
  const [currentCode, setCurrentCode] = useState<string>(code ?? "");
  const editorRef = useRef<{ getValue: () => string; triggerSuggest: () => void } | null>(null);

  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();

  //Setup compiler options and libraries
  // TODO: Make this configurable from the parent page.
  useEffect(() => {
    setCompilerOptions();
    setLibraries([
      {
        type: "module",
        name: "@salaxy/core",
        url: "/libs/core/salaxy-lib-core.d.ts",
      },
      {
        type: "context",
        code: `
        import { HelpersRoot, UserDefinedRow, RowContext } from "@salaxy/core";
        declare global {
          /** The row that is being process as part of calculation. */
          declare var row: UserDefinedRow;
          /** The calculation context: Calculation, Employment, Company settings, etc. */
          declare var ctx: RowContext;
          /** The sxy helper functions. */
          declare var sxy: HelpersRoot;
        }
        `
      }
    ]);
  }, [setCompilerOptions, setLibraries]);

  // Update original code when code changes from hash
  useEffect(() => {
    const newCode = code ?? "";
    setOriginalCode(newCode);
    if (mode === "excel") {
      // In excel mode, only update current code if it matches original (user hasn't edited)
      // This prevents overwriting user edits when hash updates
      if (currentCode === originalCode) {
        setCurrentCode(newCode);
      }
    } else {
      // In plain mode, always update
      setCurrentCode(newCode);
    }
  }, [code, mode, currentCode, originalCode]);

  // Handle code changes in plain mode and update hash immediately
  const handlePlainModeChange = (newCode: string) => {
    if (mode === "plain") {
      updateHash(newCode);
    }
  };

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
  };

  // Handle check button (apply changes)
  const handleCheck = () => {
    if (!editorRef.current) return;
    const newCode = editorRef.current.getValue();
    setOriginalCode(newCode);
    setCurrentCode(newCode);
    
    // Update this window's hash (the iframe's hash)
    updateHash(newCode);
  };

  // Handle close button (reset to original)
  const handleClose = () => {
    if (!editorRef.current) return;
    setCurrentCode(originalCode);
    // The editor will update via the code prop change
  };

  // Handle function button (trigger autocomplete)
  const handleFunction = () => {
    if (!editorRef.current) return;
    editorRef.current.triggerSuggest();
  };

  // Handle code changes in excel mode (don't update hash, just track locally)
  const handleExcelModeChange = (newCode: string) => {
    setCurrentCode(newCode);
    // Don't update hash - wait for check button
  };

  return (
    mode === "plain" ? (
      <div className="h-100">
        <MonacoEditor
          code={currentCode}
          lang={lang ?? "javascript"}
          readOnly={readOnly}
          theme="vs-light"
          options={options}
          onCodeChange={handlePlainModeChange}
          onMonacoMount={initialize}
        />
      </div>
    ) : (
      <div className="h-100 border rounded">
        <div className="p-2 d-flex align-items-start" style={{ backgroundColor: "var(--bs-gray-200)" }}>
          <div className="btn-group me-2 flex-shrink-0 flex-grow-0">
            <button 
              className="btn btn-outline-primary p-2 pb-1" 
              type="button"
              onClick={handleCheck}
              title="Apply changes"
            >
              <span className="material-symbols-outlined text-success">check</span>
            </button>
            <button 
              className="btn btn-outline-primary p-2 pb-1" 
              type="button"
              onClick={handleClose}
              title="Reset to original"
            >
              <span className="material-symbols-outlined text-danger">close</span>
            </button>
            <button 
              className="btn btn-outline-primary p-2 pb-1" 
              type="button"
              onClick={handleFunction}
              title="Show autocomplete"
            >
              <span className="material-symbols-outlined">function</span>
            </button>
          </div>
          <div className="flex-shrink-1 flex-grow-1 border border-primary position-relative rounded p-1 ps-4 bg-white" style={{ height: "120px" }}>
            <span className="position-absolute badge text-primary"
              style={{ top: "2px", left: "-6px", fontSize: "1.5rem", fontWeight: "bold" }}>=</span>
            <div className="h-100">
              <MonacoEditor
                code={currentCode}
                lang={lang ?? "javascript"}
                readOnly={readOnly}
                theme="vs-light"
                options={options}
                onCodeChange={handleExcelModeChange}
                onMonacoMount={initialize}
                editorRef={editorRef}
              />
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default ExpressionEditor;
