import { useMemo } from "react";
import { QEditorProps } from "./model";

const typeToRoute: Record<QEditorProps["type"], string> = {
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
  lang,
  data,
  onChange,
}: QEditorProps): JSX.Element {
  const iframeSrc = useMemo(() => {
    const baseRoute = typeToRoute[type] || "/monaco";
    const base64Data = data ? btoa(JSON.stringify(data || {})) : "";
    return `${baseRoute}?code=${encodeURIComponent(code || "")}&lang=${encodeURIComponent(lang || "")}&mode=${encodeURIComponent(mode || "")}&data=${encodeURIComponent(base64Data)}`;
  }, [type, code, lang, mode, data]);

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
