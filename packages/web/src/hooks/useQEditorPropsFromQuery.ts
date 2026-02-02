import { useEffect, useState, useCallback } from "react";
import type { QEditorProps } from "@quartal/code-editors-core";
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
  const [props, setProps] = useState<QEditorProps>(PageHelpers.getPropsFromLocation(type));

  // Function to update the hash with new code
  const updateHash = useCallback((code: string) => {
    PageHelpers.updateHash(type, code);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setProps(PageHelpers.getPropsFromLocation(type));
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
