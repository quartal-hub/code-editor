import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import type { Monaco } from "@monaco-editor/react";

export interface ExpressionEditorProps {
  code?: string;
  lang?: string;
  mode?: "plain" | "excel";
  readOnly?: boolean;
  /** Called on each change in plain mode. */
  onCodeChange?: (code: string) => void;
  /** Called on each change in excel mode. */
  onDraftChange?: (code: string) => void;
  /** Called when user applies changes in excel mode. */
  onCommit?: (code: string) => void;
  /** Monaco setup callback (e.g., useMonacoSetup.initialize). */
  onMonacoMount?: (monaco: Monaco) => void;
}

/**
 * This is a temporary hack for demo purposes: Need to think through the final solution for this.
 * 
 * - Remove leading and trailing whitespace from the code.
 * - If the code starts with "return ", remove the "return " and the whitespace after it.
 * 
 */
function tempTrimCode(code: string | undefined): string {
  let trimmedCode = code?.trim() ?? "";
  if (!code) return "";
  if (trimmedCode.startsWith("return ")) {
    trimmedCode = trimmedCode.slice(6).trim();
  }
  return trimmedCode;
}

function ExpressionEditor({
  code = "",
  lang = "javascript",
  mode = "excel",
  readOnly = false,
  onCodeChange,
  onDraftChange,
  onCommit,
  onMonacoMount,
}: ExpressionEditorProps): JSX.Element {
  const [originalCode, setOriginalCode] = useState<string>(tempTrimCode(code));
  const [currentCode, setCurrentCode] = useState<string>(tempTrimCode(code));
  const editorRef = useRef<{ getValue: () => string; triggerSuggest: () => void } | null>(null);

  // Update original code when prop changes
  useEffect(() => {
    const newCode = tempTrimCode(code);
    setOriginalCode(newCode);
    if (mode === "excel") {
      if (currentCode === originalCode) {
        setCurrentCode(newCode);
      }
    } else {
      setCurrentCode(newCode);
    }
  }, [code, mode, currentCode, originalCode]);

  const options = {
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

  const handlePlainModeChange = (newCode: string) => {
    setCurrentCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleCheck = () => {
    if (!editorRef.current) return;
    const newCode = editorRef.current.getValue();
    setOriginalCode(newCode);
    setCurrentCode(newCode);
    onCommit?.(newCode);
  };

  const handleClose = () => {
    setCurrentCode(originalCode);
  };

  const handleFunction = () => {
    if (!editorRef.current) return;
    editorRef.current.triggerSuggest();
  };

  const handleExcelModeChange = (newCode: string) => {
    setCurrentCode(newCode);
    onDraftChange?.(newCode);
  };

  return (
    mode === "plain" ? (
      <div className="h-100">
        <MonacoEditor
          code={currentCode}
          lang={lang}
          readOnly={readOnly}
          theme="vs-light"
          options={options}
          onCodeChange={handlePlainModeChange}
          onMonacoMount={onMonacoMount}
        />
      </div>
    ) : (
      <div className="h-100">
        <div className="p-2 d-flex align-items-start" style={{ backgroundColor: "var(--bs-gray-200)" }}>
          <div className="btn-group me-2 flex-shrink-0 flex-grow-0">
            <button
              className="btn btn-outline-primary p-2 pb-1"
              type="button"
              onClick={handleCheck}
              title="Apply changes"
              disabled={readOnly}
            >
              <span className="material-symbols-outlined text-success">check</span>
            </button>
            <button
              className="btn btn-outline-primary p-2 pb-1"
              type="button"
              onClick={handleClose}
              title="Reset to original"
              disabled={readOnly}
            >
              <span className="material-symbols-outlined text-danger">close</span>
            </button>
            <button
              className="btn btn-outline-primary p-2 pb-1"
              type="button"
              onClick={handleFunction}
              title="Show autocomplete"
              disabled={readOnly}
            >
              <span className="material-symbols-outlined">function</span>
            </button>
          </div>
          <div className="flex-shrink-1 flex-grow-1 border border-primary position-relative rounded p-1 ps-4 bg-white" style={{ height: "120px" }}>
            <span
              className="position-absolute badge text-primary"
              style={{ top: "2px", left: "-6px", fontSize: "1.5rem", fontWeight: "bold" }}
            >=</span>
            <div className="h-100">
              <MonacoEditor
                code={currentCode}
                lang={lang}
                readOnly={readOnly}
                theme="vs-light"
                options={options}
                onCodeChange={handleExcelModeChange}
                onMonacoMount={onMonacoMount}
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
