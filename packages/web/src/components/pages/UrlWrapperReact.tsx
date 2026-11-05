import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { ExcalidrawEditor } from "react-editors";
import { PageHelpers } from "@/helpers";
import { useQEditorPropsFromQuery } from "@/hooks";

type ReactUrlEditor = "excalidraw";

interface UrlWrapperReactProps {
  /** Type of the editor to show. */
  editor: ReactUrlEditor;
}

function UrlWrapperReact({ editor }: UrlWrapperReactProps): JSX.Element {
  const { url, readOnly } = useQEditorPropsFromQuery(editor);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const isReadOnly = useMemo(() => readOnly !== false, [readOnly]);

  const handleExcalidrawLinkOpen = useCallback((element: { link?: string }, event: unknown) => {
    const link = typeof element?.link === "string" ? element.link : undefined;
    const detail = PageHelpers.getLinkOpenDetail(event);
    PageHelpers.sendOnLinkOpenMessage({ link, detail });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchCodeFromUrl = async () => {
      setIsLoading(true);
      setError("");
      try {
        const nextCode = await PageHelpers.fetchCodeFromUrl(url);
        if (isCancelled) {
          return;
        }
        setCode(nextCode);
      } catch (ex) {
        if (isCancelled) {
          return;
        }
        setError((ex as Error).message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCodeFromUrl();

    return () => {
      isCancelled = true;
    };
  }, [editor, url]);

  if (isLoading) {
    return (
      <div>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-auto w-50 mt-5">
        <strong>Error loading content from URL: {url}</strong>
        <br /> {error}
      </div>
    );
  }

  return <ExcalidrawEditor code={code} readOnly={isReadOnly} onLinkOpen={handleExcalidrawLinkOpen} />;
}

export default UrlWrapperReact;
