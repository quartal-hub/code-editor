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
  const { code: hashCode, mode, url, data, updateHash } = useQEditorPropsFromQuery("excalidraw");
  const [loading, setLoading] = useState<boolean>(false);
  const [readOnly, setReadOnly] = useState<boolean>(mode === "read-only");
  const [scene, setScene] = useState<ExcalidrawSceneData | null>(() => normalizeScene(data) ?? parseScene(hashCode));

  async function fetchSceneFromUrl(targetUrl: string) {
    setLoading(true);
    try {
      const response = await fetch(targetUrl);
      const text = await response.text();
      setScene(parseScene(text));
    } catch (error) {
      console.error("Error fetching Excalidraw data from URL:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (url) {
      setReadOnly(true);
      fetchSceneFromUrl(url);
    } else {
      setReadOnly(mode === "read-only");
    }
  }, [url, mode]);

  useEffect(() => {
    const fromData = normalizeScene(data);
    setScene(fromData ?? parseScene(hashCode));
  }, [data, hashCode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.code === undefined) {
        return;
      }
      if (typeof event.data.code === "string") {
        setScene(parseScene(event.data.code));
        return;
      }
      setScene(normalizeScene(event.data.code));
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
    updateHash(JSON.stringify(nextScene));

    if (window.self !== window.top) {
      try {
        window.parent.postMessage(
          {
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
    if (window.self !== window.top) {
      window.parent.postMessage({ loaded: true }, "*");
    }
  }, []);

  return (
    <>
      {loading ? (
        <div className="text-center">Loading from {url}...</div>
      ) : (
        <ExcalidrawEditor codeModel={scene ?? undefined} readOnly={readOnly} onChange={handleCodeChange} />
      )}
    </>
  );
}

export default ExcalidrawEditorPage;
