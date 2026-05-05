import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  useSandpack,
  type SandpackFiles,
  type SandpackPredefinedTemplate,
} from "@codesandbox/sandpack-react";
import { SandpackMonacoEditor } from "react-editors";
import type { JSX } from "react";
import type { Project } from "@quartal/code-editors-core";

interface ProjectEditorProps {
  project: Project;
  onProjectChange?: (project: Project) => void;
}

/**
 * Toolbar with a manual "Save" action.
 * Edits live inside Sandpack until the user explicitly pushes them up to the parent,
 * which avoids re-rendering the provider on every keystroke.
 */
function ProjectEditorToolbar({
  project,
  onProjectChange,
}: ProjectEditorProps): JSX.Element | null {
  const { sandpack } = useSandpack();

  if (!onProjectChange) {
    return null;
  }

  const handleSave = (): void => {
    onProjectChange({
      ...project,
      files: normalizeSandpackFiles(sandpack.files),
    });
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 8px", background: "#1e1e1e" }}>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={handleSave}>Save changes</button>
    </div>
  );
}

function ProjectEditor({ project, onProjectChange }: ProjectEditorProps): JSX.Element {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <SandpackProvider
        theme="dark"
        template={project.template as SandpackPredefinedTemplate}
        files={project.files || {}}
        customSetup={project.customSetup}
      >
        <ProjectEditorToolbar project={project} onProjectChange={onProjectChange} />
        <SandpackLayout>
          <SandpackFileExplorer initialCollapsedFolder={["/node_modules/", "/@salaxy/"]} style={{ height: "100vh" }} />
          <SandpackMonacoEditor />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

function normalizeSandpackFiles(files: SandpackFiles): Project["files"] {
  const normalized: Project["files"] = {};
  Object.entries(files).forEach(([filePath, file]) => {
    normalized[filePath] = {
      code: typeof file === "string" ? file : file.code,
    };
  });
  return normalized;
}

export default ProjectEditor;
