import { useState, useEffect } from "react";
import type { JSX } from "react";
import { MonacoEditor, useMonacoSetup } from "react-editors";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";
import { useQEditorPropsFromQuery } from "@/hooks";

/** Bridges the data flow from the parent window to the Monaco editor (react version) and back. */
function MonacoEditorReactPage(): JSX.Element {
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();
  const { code: hashCode, lang, mode, readOnly, updateHash } = useQEditorPropsFromQuery("monaco");
  const [isReadOnly, setIsReadOnly] = useState<boolean>(Boolean(readOnly));
  const [code, setCode] = useState<string>(hashCode ?? "");

  useEffect(() => {
    setIsReadOnly(Boolean(readOnly));
  }, [readOnly]);

  // Setup compiler options and libraries
  useEffect(() => {
    setCompilerOptions();
    // TODO: Make this configurable from the parent page.
    // TODO: Set the libraries using the same mechanisms as the Sandpack editor.
  }, [setCompilerOptions, setLibraries]);

  // Update local code when hash changes
  useEffect(() => {
    setCode(hashCode ?? "");
  }, [hashCode]);

  // Listen for messages from parent (for external code updates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.type !== "set-data") {
        return;
      }
      if (event.data.code !== undefined) {
        setCode(String(event.data.code));
      } else if (event.data.data !== undefined) {
        setCode(String(event.data.data));
      }

      // Restore cursor position if provided (would need editor ref for this)
      // For now, just update the code
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Handle code changes: update hash and send to parent
  const handleCodeChange = (data: QEditorChangeEventData) => {
    const nextCode = data.code ?? "";
    setCode(nextCode);
    if (mode === "code") {
      updateHash(nextCode);
    }

    // Send to parent window (for QEditor's onChange callback)
    if (window.self !== window.top && !isReadOnly) {
      try {
        window.parent.postMessage(
          {
            type: "on-change",
            code: data.code,
            cursorPosition: data.cursorPosition,
          },
          "*"
        );
      } catch (error) {
        console.warn("Could not send code update to parent window:", error);
      }
    }
  };

  // Send ready message to parent
  useEffect(() => {
    if (window.self !== window.top && mode === "events") {
      window.parent.postMessage({ type: "editor-ready" }, "*");
    }
  }, [mode]);

  return (
    <MonacoEditor
      code={code}
      lang={lang}
      readOnly={isReadOnly}
      onChange={handleCodeChange}
      onEditorMount={(eventData: QEditorMountEventData) => initialize(eventData.api)}
    />
  );
}

export default MonacoEditorReactPage;
