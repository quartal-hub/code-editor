import { useEffect, useState } from "react";
import type { QEditorProps } from "@/publish/model";

/**
 * Parses the query string and returns an object with the QEditorProps interface.
 * @param type The type of editor to use.
 * @returns QEditorProps object parsed from URL query parameters
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]): QEditorProps {
  const getProps = (): QEditorProps => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") ?? "";
    const lang = params.get("lang") ?? undefined;
    const mode = params.get("mode") ?? undefined;
    let data: Record<string, unknown> | undefined = undefined;
    const dataStr = params.get("data");
    if (dataStr) {
      try {
        // Attempt base64 decode and JSON parse
        data = JSON.parse(atob(dataStr));
      } catch {
        data = undefined;
      }
    }
    return {
      code,
      lang,
      mode,
      data,
      type,
    };
  };

  // Using state to observe query string changes
  const [props, setProps] = useState<QEditorProps>(getProps);

  useEffect(() => {
    const handleQueryChange = () => {
      setProps(getProps());
    };
    window.addEventListener("popstate", handleQueryChange);
    window.addEventListener("pushstate", handleQueryChange);
    window.addEventListener("replacestate", handleQueryChange);

    // Listen for hashchange as a precaution
    window.addEventListener("hashchange", handleQueryChange);

    return () => {
      window.removeEventListener("popstate", handleQueryChange);
      window.removeEventListener("pushstate", handleQueryChange);
      window.removeEventListener("replacestate", handleQueryChange);
      window.removeEventListener("hashchange", handleQueryChange);
    };
  }, []);

  useEffect(() => {
    const handleManualQueryChange = () => {
      setProps(getProps());
    };
    // Listen for manual changes to the URL (e.g., search box of browser)
    window.addEventListener("search", handleManualQueryChange);
    return () => {
      window.removeEventListener("search", handleManualQueryChange);
    };
  }, []);

  return props;
}

export default useQEditorPropsFromQuery;
