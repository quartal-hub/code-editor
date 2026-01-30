import type { ComponentType, JSX, MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";

export type ExcalidrawAppState = Record<string, unknown>;
export type ExcalidrawFiles = Record<string, unknown>;

export type ExcalidrawElement = {
  x: number;
  y: number;
  width: number;
  height: number;
  isDeleted?: boolean;
  [key: string]: unknown;
};

export type ExcalidrawSceneData = {
  elements?: readonly ExcalidrawElement[];
  appState?: Partial<ExcalidrawAppState>;
  files?: ExcalidrawFiles;
};

export type ExcalidrawImperativeAPI = {
  updateScene: (scene: ExcalidrawSceneData) => void;
  getSceneElements?: () => readonly ExcalidrawElement[];
  getAppState?: () => ExcalidrawAppState;
  [key: string]: unknown;
};

type ExcalidrawProps = {
  initialData?: ExcalidrawSceneData | null;
  excalidrawAPI?: (api: ExcalidrawImperativeAPI | null) => void;
  onChange?: (elements: readonly ExcalidrawElement[], appState: ExcalidrawAppState, files: ExcalidrawFiles) => void;
  onPointerUpdate?: (payload: { x: number; y: number }, button: "down" | "up", pointersMap: unknown) => void;
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
  [key: string]: unknown;
};

type PointerUpdateArgs = Parameters<NonNullable<ExcalidrawProps["onPointerUpdate"]>>;
type PointerUpdatePayload = PointerUpdateArgs[0];
type PointerUpdateButton = PointerUpdateArgs[1];
type PointerUpdateMap = PointerUpdateArgs[2];

export interface ExcalidrawEditorProps {
  /** The Excalidraw scene as JSON string. */
  code?: string;
  /** The Excalidraw scene as a parsed object. Takes precedence over code. */
  codeModel?: ExcalidrawSceneData;
  /** If true, the editor is read only (view + zen mode). */
  readOnly?: boolean;
  /** Extra Excalidraw options to merge into the editor props. */
  options?: Record<string, unknown>;
  /** Callback when the scene changes, returning the scene object. */
  onChange?: (data: QEditorChangeEventData) => void;
  /** Callback for pointer clicks with items under cursor. */
  onClick?: (payload: {
    pointer: PointerUpdatePayload;
    button: PointerUpdateButton;
    pointersMap: PointerUpdateMap;
    items: ExcalidrawElement[];
    appState: ExcalidrawAppState | null;
  }) => void;
  /** Ref to expose the Excalidraw API. */
  editorRef?: MutableRefObject<ExcalidrawImperativeAPI | null>;
  /** Callback when Excalidraw API is mounted. */
  onEditorMount?: (data: QEditorMountEventData) => void;
}

function parseSceneFromCode(code?: string): ExcalidrawSceneData | null {
  if (!code) {
    return null;
  }
  try {
    const parsed = JSON.parse(code) as ExcalidrawSceneData;
    return parsed ?? null;
  } catch {
    return null;
  }
}

function safeStringify(scene: ExcalidrawSceneData | null): string | null {
  if (!scene) {
    return null;
  }
  try {
    return JSON.stringify(scene);
  } catch {
    return null;
  }
}

function getElementsAtPoint(elements: readonly ExcalidrawElement[], x: number, y: number): ExcalidrawElement[] {
  return elements.filter((element) => {
    if ((element as { isDeleted?: boolean }).isDeleted) {
      return false;
    }
    const { x: elX, y: elY, width, height } = element as ExcalidrawElement & {
      width: number;
      height: number;
    };
    const minX = Math.min(elX, elX + width);
    const maxX = Math.max(elX, elX + width);
    const minY = Math.min(elY, elY + height);
    const maxY = Math.max(elY, elY + height);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  });
}

function ExcalidrawEditor({
  code,
  codeModel,
  readOnly = false,
  options,
  onChange,
  onClick,
  editorRef: externalEditorRef,
  onEditorMount,
}: ExcalidrawEditorProps): JSX.Element {
  const ExcalidrawComponent = Excalidraw as unknown as ComponentType<ExcalidrawProps>;
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const elementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const appStateRef = useRef<ExcalidrawAppState | null>(null);
  const lastAppliedSceneRef = useRef<string | null>(null);

  const sceneFromProps = useMemo(() => {
    if (codeModel) {
      return codeModel;
    }
    return parseSceneFromCode(code);
  }, [code, codeModel]);

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI | null) => {
      excalidrawApiRef.current = api;
      if (externalEditorRef) {
        externalEditorRef.current = api;
      }
      if (!api) {
        return;
      }
      setTimeout(() => {
        // HACK: Not sure how long this should be and 
        (api as any).scrollToContent(undefined, {
          fitToContent: true,
        });
      }, 100);
      if (onEditorMount) {
        onEditorMount({ editor: api, api });
      }
    },
    [externalEditorRef, onEditorMount]
  );

  const handleChange: ExcalidrawProps["onChange"] = (elements, appState, files) => {
    elementsRef.current = elements;
    appStateRef.current = appState;

    if (!onChange) {
      return;
    }

    const scene: ExcalidrawSceneData = {
      elements,
      appState,
      files,
    };

    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      onChange({ data: scene });
    }, 250);
  };

  const handlePointerUpdate: ExcalidrawProps["onPointerUpdate"] = (pointer, button, pointersMap) => {
    if (!onClick || button !== "up") {
      return;
    }
    const items = getElementsAtPoint(elementsRef.current, pointer.x, pointer.y);
    onClick({
      pointer,
      button,
      pointersMap,
      items,
      appState: appStateRef.current,
    });
  };

  useEffect(() => {
    if (!excalidrawApiRef.current || !sceneFromProps) {
      return;
    }

    const serialized = safeStringify(sceneFromProps);
    if (serialized && serialized === lastAppliedSceneRef.current) {
      return;
    }

    excalidrawApiRef.current.updateScene(sceneFromProps);
    lastAppliedSceneRef.current = serialized;
  }, [sceneFromProps]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const excalidrawOptions = (options ?? {}) as Partial<ExcalidrawProps>;
  const viewModeEnabled = readOnly || Boolean(excalidrawOptions.viewModeEnabled);
  const zenModeEnabled = readOnly || Boolean(excalidrawOptions.zenModeEnabled);

  // Add custom styles to hide Excalidraw UI elements (hamburger menu, controls, icons)
  const excalidrawStyle = `
    /* Hide the top-left Hamburger Menu */
    .excalidraw .App-menu_top {
      display: none !important;
    }
    /* Hide the bottom-left controls (Zoom, Undo, Redo) */
    .excalidraw .layer-ui__wrapper__footer-left {
      display: none !important;
    }
    /* Hide the bottom-right help/encrypt icons if they appear */
    .excalidraw .layer-ui__wrapper__footer-right {
      display: none !important;
    }
  `;
  useEffect(() => {
    const existingStyle = document.getElementById("excalidraw-readonly-style");
    if (readOnly) {
      if (!existingStyle) {
        const styleTag = document.createElement("style");
        styleTag.id = "excalidraw-readonly-style";
        styleTag.innerHTML = excalidrawStyle;
        document.head.appendChild(styleTag);
      }
    } else {
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }, [readOnly]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ExcalidrawComponent
        {...excalidrawOptions}
        initialData={sceneFromProps ?? undefined}
        excalidrawAPI={handleApi}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        viewModeEnabled={viewModeEnabled}
        zenModeEnabled={zenModeEnabled}
      ></ExcalidrawComponent>
    </div>
  );
}

export default ExcalidrawEditor;