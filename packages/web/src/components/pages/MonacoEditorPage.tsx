import { useState, useEffect } from "react";
import type { JSX } from "react";
import { MonacoEditor, useMonacoSetup } from "react-editors";
import { useQEditorPropsFromQuery } from "@/hooks";

/** Bridges the data flow from the parent window to the Monaco editor (react version) and back. */
function MonacoEditorReact(): JSX.Element {
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();
  const { code: hashCode, lang, mode, url, updateHash } = useQEditorPropsFromQuery("monaco");
  const [loading, setLoading] = useState<boolean>(false);
  const [readOnly, setReadOnly] = useState<boolean>(mode === "read-only");
  const [code, setCode] = useState<string>(hashCode ?? "");

  async function fetchCodeFromUrl(targetUrl: string) {
    setLoading(true);
    try {
      const response = await fetch(targetUrl);
      const text = await response.text();
      setCode(text);
    } catch (error) {
      console.error("Error fetching code from URL:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (url) {
      setReadOnly(true);
      fetchCodeFromUrl(url);
    } else {
      setReadOnly(mode === "read-only");
    }
  }, [url, mode]);

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
      if (event?.data?.code !== undefined) {
        setCode(event.data.code);

        // Restore cursor position if provided (would need editor ref for this)
        // For now, just update the code
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Handle code changes: update hash and send to parent
  const handleCodeChange = (newCode: string, cursorPosition?: { lineNumber: number; column: number } | null) => {
    setCode(newCode);
    updateHash(newCode);

    // Send to parent window (for QEditor's onChange callback)
    if (window.self !== window.top) {
      try {
        window.parent.postMessage(
          {
            code: newCode,
            cursorPosition: cursorPosition,
          },
          "*"
        );
      } catch (error) {
        console.warn("Could not send code update to parent window:", error);
      }
    }
  };

  // Send loaded message to parent
  useEffect(() => {
    if (window.self !== window.top) {
      window.parent.postMessage({ loaded: true }, "*");
    }
  }, []);

  return (
    <>
      {loading ? (
        <div className="text-center">Loading from {url}...</div>
      ) : (
        <MonacoEditor
          code={code}
          lang={lang}
          readOnly={readOnly}
          onCodeChange={handleCodeChange}
          onMonacoMount={initialize}
        />
      )}
    </>
  );
}

export default MonacoEditorReact;
