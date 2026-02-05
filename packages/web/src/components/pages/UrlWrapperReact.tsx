import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { ExcalidrawEditor, MonacoEditor, ProjectEditor } from "react-editors";
import type { Project } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";
import { useQEditorPropsFromQuery } from "@/hooks";

type ReactUrlEditor = "monaco-react" | "excalidraw" | "project";

interface UrlWrapperReactProps {
  /** Type of the editor to show. */
  editor: ReactUrlEditor;
}

function parseProjectFromCode(code: string): Project {
  const parsed = JSON.parse(code) as Project;
  if (!parsed || typeof parsed !== "object" || !("files" in parsed)) {
    throw new Error("Invalid project data.");
  }
  return parsed;
}

function UrlWrapperReact({ editor }: UrlWrapperReactProps): JSX.Element {
  const { url, readOnly, lang } = useQEditorPropsFromQuery(editor);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);

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
        if (editor === "project") {
          setProject(parseProjectFromCode(nextCode));
        } else {
          setProject(null);
        }
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

  if (editor === "excalidraw") {
    return <ExcalidrawEditor code={code} readOnly={isReadOnly} onLinkOpen={handleExcalidrawLinkOpen} />;
  }

  if (editor === "project") {
    return project ? <ProjectEditor project={project} /> : <div>No project data.</div>;
  }

  return <MonacoEditor code={code} lang={lang} readOnly={isReadOnly} />;
}

export default UrlWrapperReact;
