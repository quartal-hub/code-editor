import { useEffect, useState, useCallback } from "react";
import type { QEditorProps } from "@/publish/model";
import { PageHelpers } from "@/helpers";

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

  // Using state to observe query string changes
  const [props, setProps] = useState<QEditorProps>(PageHelpers.getPropsFromHash(type));

  // Function to update the hash with new code
  const updateHash = useCallback((code: string) => {
    const currentProps = PageHelpers.getPropsFromHash(type);
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
      setProps(PageHelpers.getPropsFromHash(type));
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
