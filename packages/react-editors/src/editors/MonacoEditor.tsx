import type { JSX } from "react";
import { useEffect, useRef, useCallback } from "react";
import type { Monaco, OnMount, OnChange } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  /** The language of the code to show in the editor. */
  lang?: string;
  /**
   * The path of the file to show in the editor.
   * If you leave lang empty, the language will be inferred from the path.
   */
  path?: string;
  /** If true, the editor is read only. */
  readOnly?: boolean;
  /** The code to show in the editor. */
  code?: string;

  /** Extra Monaco editor options to merge into the editor options. */
  options?: Record<string, unknown>;

  /**
   * The theme of the editor.
   * Default is "vs-dark", typically the other value would be "vs-light", but it can be any valid Monaco theme.
   */
  theme?: string;

  /**
   * Callback when code changes (for local tracking, e.g., hash updates).
   */
  onCodeChange?: (code: string, cursorPosition?: { lineNumber: number; column: number } | null) => void;

  /**
   * Callback when Monaco instance is mounted (for setup hooks like useMonacoSetup).
   */
  onMonacoMount?: (monaco: Monaco) => void;

  /**
   * Ref to expose editor instance methods.
   */
  editorRef?: React.MutableRefObject<{
    getValue: () => string;
    triggerSuggest: () => void;
  } | null>;
}

function MonacoEditor({
  lang,
  path,
  readOnly = false,
  code: editorCode = "",
  options,
  theme = "vs-dark",
  onCodeChange,
  onMonacoMount,
  editorRef: externalEditorRef,
}: MonacoEditorProps): JSX.Element {
  const editorRef = useRef<ReturnType<Monaco["editor"]["create"]> | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounce function for code updates
  const debounce = useCallback((func: () => void, wait: number) => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(func, wait);
    };
  }, []);

  // Handle editor mount
  const handleEditorDidMount: OnMount = async (editorInstance, monacoInstance: Monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    // Expose editor methods via external ref if provided
    if (externalEditorRef) {
      externalEditorRef.current = {
        getValue: () => editorInstance.getValue(),
        triggerSuggest: () => {
          // Trigger autocomplete (Ctrl+Space equivalent)
          editorInstance.trigger("keyboard", "editor.action.triggerSuggest", null);
        },
      };
    }

    // Configure TypeScript/JavaScript diagnostics and compiler options
    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Call onMonacoMount callback if provided (for setup hooks)
    if (onMonacoMount) {
      onMonacoMount(monacoInstance);
    }
  };

  // Handle code changes with debounce
  const handleEditorChange: OnChange = () => {
    if (!editorRef.current) {
      return;
    }

    const newCode = editorRef.current.getValue() || "";

    // Call onCodeChange callback if provided (for local tracking, e.g., hash updates)
    if (onCodeChange) {
      debounce(() => onCodeChange(newCode, editorRef.current.getPosition()), 250)();
    }
  };

  // Update editor when props change
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Update language
    if (lang && editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, lang);
      }
    }
  }, [lang]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Update readOnly
    editorRef.current.updateOptions({ readOnly, ...(options || {}) });
  }, [readOnly, options]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Update code value
    const currentValue = editorRef.current.getValue();
    if (currentValue !== editorCode) {
      editorRef.current.setValue(editorCode || "");
    }
  }, [editorCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        language={lang}
        path={path}
        theme={theme || "vs-dark"}
        value={editorCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          automaticLayout: true,
          ...(options || {}),
        }}
      />
    </div>
  );
}

export default MonacoEditor;
