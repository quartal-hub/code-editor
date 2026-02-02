import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectEditor } from "react-editors";
import type { Project } from "@quartal/code-editors-core";
import { ProjectHelpers } from "@quartal/code-editors-core";

function ProjectEditorPage(): JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const postMessageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { project?: Project } | null | undefined;
      if (!data || typeof data !== "object" || !data.project) {
        return;
      }
      setError(null);
      console.log("Received project:", data.project);
      setProject(data.project);
    };

    window.addEventListener("message", handleMessage);
    console.log("Started listening");
    return () => {
      window.removeEventListener("message", handleMessage);
      if (postMessageTimeoutRef.current !== null) {
        window.clearTimeout(postMessageTimeoutRef.current);
      }
    };
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
    if (postMessageTimeoutRef.current !== null) {
      window.clearTimeout(postMessageTimeoutRef.current);
    }
    postMessageTimeoutRef.current = window.setTimeout(() => {
      window.parent?.postMessage({ project: nextProject }, "*");
    }, 300);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error ? <div style={{ color: "#d33" }}>{error}</div> : null}
      {project ? (
        <ProjectEditor project={project} onProjectChange={handleProjectChange} />
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
