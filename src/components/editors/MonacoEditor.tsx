import { useEffect, useRef, useCallback } from "react";
import Editor, { OnMount, OnChange, type Monaco } from "@monaco-editor/react";

interface MonacoEditorProps {
  /** The language of the code to show in the editor. */
  lang?: string;
  /** If true, the editor is read only. */
  readOnly?: boolean;
  /** The code to show in the editor. */
  code?: string;
  /**
   * Extra Monaco editor options to merge in.
   */
  options?: Record<string, unknown>;

  /**
   * The theme of the editor.
   * Default is "vs-dark", typically the other value would be "vs-light", but it can be any valid Monaco theme.
   */
  theme?: string;
}

function MonacoEditor({
  lang = "javascript",
  readOnly = false,
  code: editorCode = "",
  options,
  theme = "vs-dark",
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
  const handleEditorDidMount: OnMount = (editorInstance, monacoInstance: Monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    // Configure TypeScript/JavaScript diagnostics and compiler options
    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
    });

    // Set up message handling
    const handleMessage = (event: MessageEvent) => {
      if (!editorRef.current) {
        return;
      }

      if (event?.data?.code !== undefined) {
        const currentValue = editorRef.current.getValue();
        // Only update if the code is different to avoid cursor position issues
        if (currentValue !== event.data.code) {
          editorRef.current.setValue(event.data.code || "");
          
          // Restore cursor position if provided
          if (event.data.cursorPosition) {
            editorRef.current.setPosition({
              lineNumber: event.data.cursorPosition.lineNumber,
              column: event.data.cursorPosition.column,
            });
            editorRef.current.revealPositionInCenter({
              lineNumber: event.data.cursorPosition.lineNumber,
              column: event.data.cursorPosition.column,
            });
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Send loaded message to parent
    if (window.self !== window.top) {
      window.parent.postMessage({ loaded: true }, "*");
    }

    // Handle window resize
    const handleResize = () => {
      editorRef.current?.layout();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", handleResize);
    };
  };

  // Handle code changes with debounce
  const handleEditorChange: OnChange = () => {
    if (!editorRef.current) {
      return;
    }

    const sendUpdate = () => {
      try {
        // Check if the code editor is running inside an iframe
        if (window.self === window.top) {
          console.warn("Code editor is not running inside an iframe");
          return;
        }

        const position = editorRef.current?.getPosition();
        window.parent.postMessage(
          {
            code: editorRef.current?.getValue() || "",
            cursorPosition: position
              ? {
                  lineNumber: position.lineNumber,
                  column: position.column,
                }
              : null,
          },
          "*"
        );
      } catch (error) {
        console.warn("Could not send code update to parent window:", error);
      }
    };

    debounce(sendUpdate, 250)();
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
        height="100%"
        language={lang}
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
