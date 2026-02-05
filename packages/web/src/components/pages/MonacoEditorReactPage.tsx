import { useState, useEffect } from "react";
import type { JSX } from "react";
import { MonacoEditor, useMonacoSetup } from "react-editors";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";
import { useQEditorPropsFromQuery } from "@/hooks";
import { PageHelpers } from "@/helpers";

/** Bridges the data flow from the parent window to the Monaco editor (react version) and back. */
function MonacoEditorReactPage(): JSX.Element {
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();
  const { code: hashCode, lang, readOnly } = useQEditorPropsFromQuery("monaco");
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

    if (!PageHelpers.isInIframe()) {
      return;
    }

    const handleMessageFromParent = (event: MessageEvent) => {
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

    PageHelpers.addParentListener(handleMessageFromParent);
    return () => {
      PageHelpers.removeParentListener(handleMessageFromParent);
    };
  }, []);

  // Handle code changes: update hash and send to parent
  const handleCodeChange = (data: QEditorChangeEventData) => {
    const nextCode = data.code ?? "";
    setCode(nextCode);
    PageHelpers.sendOnChangeMessage(data);
  };

  useEffect(() => {
    PageHelpers.sendIframeReadyMessage();
  }, []);

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
