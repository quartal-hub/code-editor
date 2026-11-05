import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import type { ExcalidrawSceneData } from "react-editors";
import { ExcalidrawEditor } from "react-editors";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

type ReactCodeEditor = "excalidraw";

interface CodeWrapperReactProps {
  /** Type of the editor to show. */
  editor: ReactCodeEditor;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === "") {
    return undefined;
  }
  const normalized = value.toLowerCase().trim();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
}

function parseSceneFromCode(code: string): ExcalidrawSceneData | null {
  if (!code) {
    return null;
  }
  try {
    return JSON.parse(code) as ExcalidrawSceneData;
  } catch {
    return null;
  }
}

function CodeWrapperReact({ editor }: CodeWrapperReactProps): JSX.Element {
  const [code, setCode] = useState<string>("");
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [scene, setScene] = useState<ExcalidrawSceneData | null>(null);

  const isUpdatingHashRef = useRef(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const readPropsFromLocation = useCallback(() => {
    if (isUpdatingHashRef.current) {
      isUpdatingHashRef.current = false;
      return;
    }
    const values = PageHelpers.getPropsFromLocation(editor);
    const nextCode = values.code ?? "";
    setCode(nextCode);
    setReadOnly(values.readOnly ?? false);
    if (editor === "excalidraw") {
      setScene(parseSceneFromCode(nextCode));
    }
  }, [editor]);

  const scheduleHashUpdate = useCallback(
    (nextCode: string) => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        isUpdatingHashRef.current = true;
        PageHelpers.updateToHash("code", nextCode);
      }, 250);
    },
    []
  );

  useEffect(() => {
    readPropsFromLocation();
    PageHelpers.addHashChangeListener(readPropsFromLocation);
    return () => {
      PageHelpers.removeHashChangeListener(readPropsFromLocation);
    };
  }, [readPropsFromLocation]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleExcalidrawChange = useCallback(
    (data: QEditorChangeEventData) => {
      if (!data.data || typeof data.data !== "object") {
        return;
      }
      const nextScene = data.data as ExcalidrawSceneData;
      setScene(nextScene);
      try {
        const serialized = JSON.stringify(nextScene);
        setCode(serialized);
        scheduleHashUpdate(serialized);
      } catch {
        // Ignore serialization errors
      }
    },
    [scheduleHashUpdate]
  );

  const handleExcalidrawLinkOpen = useCallback((element: { link?: string }, event: unknown) => {
    const link = typeof element?.link === "string" ? element.link : undefined;
    const detail = PageHelpers.getLinkOpenDetail(event);
    PageHelpers.sendOnLinkOpenMessage({ link, detail });
  }, []);

  const hasScene = useMemo(() => Boolean(scene), [scene]);

  if (editor === "excalidraw") {
    return hasScene ? (
      <ExcalidrawEditor
        codeModel={scene ?? undefined}
        readOnly={readOnly}
        onChange={handleExcalidrawChange}
        onLinkOpen={handleExcalidrawLinkOpen}
      />
    ) : (
      <div className="alert alert-secondary m-auto mt-5" style={{ width: "fit-content" }}>
        <h2>Waiting for scene data</h2>
        <div>Provide Excalidraw JSON in the hash to load a scene.</div>
      </div>
    );
  }

  return null;
}

export default CodeWrapperReact;
