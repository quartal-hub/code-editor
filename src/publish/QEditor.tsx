import { useMemo, useRef, useEffect } from "react";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const baseRoute = typeToRoute[type] || "/monaco";

  // Initial iframe src with hash
  const initialSrc = useMemo(() => {
    const base64Data = data ? btoa(JSON.stringify(data || {})) : "";
    const hashParams = new URLSearchParams();
    if (code) hashParams.set("code", code);
    if (lang) hashParams.set("lang", lang);
    if (mode) hashParams.set("mode", mode);
    if (base64Data) hashParams.set("data", base64Data);
    const hash = hashParams.toString();
    return `${baseRoute}${hash ? `#${hash}` : ""}`;
  }, [baseRoute]);

  // Update iframe hash when props change (without reloading)
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    const base64Data = data ? btoa(JSON.stringify(data || {})) : "";
    const hashParams = new URLSearchParams();
    if (code) hashParams.set("code", code);
    if (lang) hashParams.set("lang", lang);
    if (mode) hashParams.set("mode", mode);
    if (base64Data) hashParams.set("data", base64Data);
    const hash = hashParams.toString();

    try {
      // Update hash in iframe without reloading
      iframeRef.current.contentWindow.location.hash = hash ? `#${hash}` : "";
    } catch (error) {
      // If cross-origin or other error, fall back to updating src
      // This will cause a reload but is a fallback
      console.warn("Could not update iframe hash directly:", error);
    }
  }, [code, lang, mode, data, baseRoute]);

  // Listen for messages from iframe (for onChange and hash updates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message is from our iframe
      if (iframeRef.current?.contentWindow !== event.source) {
        return;
      }

      // Handle code changes - just call onChange callback
      // The editor pages will update their own hash
      if (event.data?.code !== undefined && onChange) {
        onChange(event.data.code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onChange, lang, mode, data]);

  return (
    <iframe
      ref={iframeRef}
      src={initialSrc}
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
