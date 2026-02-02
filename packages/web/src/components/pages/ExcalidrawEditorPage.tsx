import { useEffect, useState } from "react";
import type { JSX } from "react";
import { ExcalidrawEditor } from "react-editors";
import type { ExcalidrawSceneData } from "react-editors";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { useQEditorPropsFromQuery } from "@/hooks";

function parseScene(value?: string | null): ExcalidrawSceneData | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as ExcalidrawSceneData;
  } catch {
    return null;
  }
}

function normalizeScene(value: unknown): ExcalidrawSceneData | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ExcalidrawSceneData;
}

/** Bridges the data flow from the parent window to the Excalidraw editor (react version) and back. */
function ExcalidrawEditorPage(): JSX.Element {
  const { code: hashCode, mode, readOnly, data, updateHash } = useQEditorPropsFromQuery("excalidraw");
  const [isReadOnly, setIsReadOnly] = useState<boolean>(Boolean(readOnly));
  const [scene, setScene] = useState<ExcalidrawSceneData | null>(() => normalizeScene(data) ?? parseScene(hashCode));

  useEffect(() => {
    setIsReadOnly(Boolean(readOnly));
  }, [mode, readOnly]);

  useEffect(() => {
    const fromData = normalizeScene(data);
    setScene(fromData ?? parseScene(hashCode));
  }, [data, hashCode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.type !== "set-data") {
        return;
      }
      if (event.data.data !== undefined) {
        setScene(normalizeScene(event.data.data));
        return;
      }
      if (typeof event.data.code === "string") {
        setScene(parseScene(event.data.code));
        return;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleCodeChange = (eventData: QEditorChangeEventData) => {
    const nextScene = normalizeScene(eventData.data);
    if (!nextScene) {
      return;
    }
    setScene(nextScene);
    if (mode === "code") {
      updateHash(JSON.stringify(nextScene));
    }

    if (window.self !== window.top && !isReadOnly) {
      try {
        window.parent.postMessage(
          {
            type: "on-change",
            data: nextScene,
          },
          "*"
        );
      } catch (error) {
        console.warn("Could not send Excalidraw update to parent window:", error);
      }
    }
  };

  useEffect(() => {
    if (window.self !== window.top && mode === "events") {
      window.parent.postMessage({ type: "editor-ready" }, "*");
    }
  }, [mode]);

  return (
    <ExcalidrawEditor codeModel={scene ?? undefined} readOnly={isReadOnly} onChange={handleCodeChange} />
  );
}

export default ExcalidrawEditorPage;
