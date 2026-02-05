import { useEffect, useState, useCallback } from "react";
import type { QEditorProps } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

/**
 * Parses the URL hash and returns an object with the QEditorProps interface.
 * Uses hash parameters instead of query parameters to avoid iframe reloads.
 * @param type The type of editor to use.
 * @returns Object with props
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]): QEditorProps {

  // Using state to observe query string changes
  const [props, setProps] = useState<QEditorProps>(PageHelpers.getPropsFromLocation(type));

  useEffect(() => {
    const handleHashChange = () => {
      setProps(PageHelpers.getPropsFromLocation(type));
    };
    PageHelpers.addHashChangeListener(handleHashChange);
    return () => {
      PageHelpers.removeHashChangeListener(handleHashChange);
    };
  }, []);

  return props;
}

export default useQEditorPropsFromQuery;
