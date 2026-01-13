import { useMemo } from "react";

export type EditorType = "monaco" | "skin" | "expression" | "function" | "class" | "project";

export type EditorMode = string; // Typically "default" | "preview", but editors may have other modes

export interface QEditorProps {
  type: EditorType;
  mode?: EditorMode;
  code?: string;
  language?: string;
  data?: Record<string, unknown>;
  onChange?: (value: unknown) => void;
}

const typeToRoute: Record<EditorType, string> = {
  monaco: "/monaco",
  skin: "/skin",
  expression: "/expression",
  function: "/function",
  class: "/class",
  project: "/project",
};

function QEditor({
  type,
  mode = "default",
  code,
  language,
  data,
  onChange,
}: QEditorProps): JSX.Element {
  const iframeSrc = useMemo(() => {
    const baseRoute = typeToRoute[type];
    // For now, just return the route. Later we'll add query parameters for code, language, mode, data
    return baseRoute;
  }, [type]);

  // onChange handler will be wired later when we implement communication with iframe
  useMemo(() => {
    if (onChange) {
      // Placeholder for future implementation
      // This will handle communication with the iframe content
    }
  }, [onChange]);

  return (
    <iframe
      src={iframeSrc}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
      }}
      title={`${type} Editor`}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}

export default QEditor;
