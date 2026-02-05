import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectEditor } from "react-editors";
import type { Project } from "@quartal/code-editors-core";
import { ProjectHelpers } from "@quartal/code-editors-core";
import { useQEditorPropsFromQuery } from "@/hooks";
import { PageHelpers } from "@/helpers";

function ProjectEditorPage(): JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const postMessageTimeoutRef = useRef<number | null>(null);
  const { data, readOnly } = useQEditorPropsFromQuery("project");

  const isProjectData = (value: unknown): value is Project => {
    return Boolean(value) && typeof value === "object" && "files" in (value as Record<string, unknown>);
  };

  useEffect(() => {
    const handleMessageFromParent = (event: MessageEvent) => {
      if (event?.data?.type !== "set-data") {
        return;
      }
      if (isProjectData(event.data.data)) {
        setError(null);
        setProject(event.data.data);
      }
    };

    PageHelpers.addParentListener(handleMessageFromParent);
    return () => {
      PageHelpers.removeParentListener(handleMessageFromParent);
      if (postMessageTimeoutRef.current !== null) {
        window.clearTimeout(postMessageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isProjectData(data)) {
      setProject(data);
    }
  }, [data]);

  useEffect(() => {
    PageHelpers.sendIframeReadyMessage();
  }, []);

  const handleSelectFolder = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const loadedProject = await ProjectHelpers.readProjectFolderBrowser();
      setProject(loadedProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read the project folder.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleProjectChange = useCallback((nextProject: Project) => {
    setProject(nextProject);
    if (readOnly || window.self === window.top) {
      return;
    }
    if (postMessageTimeoutRef.current !== null) {
      window.clearTimeout(postMessageTimeoutRef.current);
    }
    postMessageTimeoutRef.current = window.setTimeout(() => {
      window.parent?.postMessage({ type: "on-change", data: nextProject }, "*");
    }, 300);
  }, [readOnly]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error ? <div style={{ color: "#d33" }}>{error}</div> : null}
      {project ? (
        <ProjectEditor project={project} onProjectChange={handleProjectChange} />
      ) : PageHelpers.isInIframe() ? (
        <div className="alert alert-secondary m-auto mt-5" style={{ width: "fit-content"}}>
          <h2>Waiting for project data</h2>
          <div>Send a set-data event from the parent to load a project.</div>
        </div>
      ) : (
        <div className="alert alert-primary m-auto mt-5" style={{ width: "fit-content"}}>
          <h2>Select a project folder</h2>
          <div>Select a folder to load a project.</div>
          <button type="button" onClick={handleSelectFolder} disabled={isLoading}
            className="btn btn-default">
            {isLoading ? "Reading project..." : "Select project folder"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectEditorPage;
