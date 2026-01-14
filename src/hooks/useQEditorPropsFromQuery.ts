import { useEffect, useState, useCallback } from "react";
import type { QEditorProps } from "@/publish/model";

/**
 * Parses the URL hash and returns an object with the QEditorProps interface.
 * Uses hash parameters instead of query parameters to avoid iframe reloads.
 * Also provides a function to update the hash when code changes.
 * @param type The type of editor to use.
 * @returns Object with props and updateHash function
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]): QEditorProps & {
  updateHash: (code: string) => void;
} {
  const getProps = (): QEditorProps => {
    // Read from hash instead of query parameters
    const hash = window.location.hash.substring(1); // Remove the '#' character
    const params = new URLSearchParams(hash);
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

  // Function to update the hash with new code
  const updateHash = useCallback((code: string) => {
    const currentProps = getProps();
    const base64Data = currentProps.data ? btoa(JSON.stringify(currentProps.data || {})) : "";
    const hashParams = new URLSearchParams();
    hashParams.set("code", code);
    if (currentProps.lang) hashParams.set("lang", currentProps.lang);
    if (currentProps.mode) hashParams.set("mode", currentProps.mode);
    if (base64Data) hashParams.set("data", base64Data);
    const hash = hashParams.toString();
    
    // Update this window's hash (the iframe's hash)
    window.location.hash = hash ? `#${hash}` : "";
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setProps(getProps());
    };
    
    // Primary event for hash changes
    window.addEventListener("hashchange", handleHashChange);
    
    // Also listen to popstate for browser back/forward
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  return { ...props, updateHash };
}

export default useQEditorPropsFromQuery;
