import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import type { SandpackFiles, SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { useSandpack } from "@codesandbox/sandpack-react";
import { SandpackMonacoEditor } from "react-editors";
import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import type { Project } from "@quartal/code-editors-core";

interface ProjectEditorProps {
  project: Project;
  onProjectChange?: (project: Project) => void;
}

function SandpackProjectChangeListener({
  project,
  onProjectChange,
}: ProjectEditorProps): JSX.Element | null {
  const { sandpack } = useSandpack();
  const { files } = sandpack;

  const normalizedFiles = useMemo(() => normalizeSandpackFiles(files), [files]);

  useEffect(() => {
    if (!onProjectChange) {
      return;
    }
    if (areProjectFilesEqual(project.files, normalizedFiles)) {
      return;
    }
    onProjectChange({
      ...project,
      files: normalizedFiles,
    });
  }, [normalizedFiles, onProjectChange, project]);

  return null;
}

function ProjectEditor({ project, onProjectChange }: ProjectEditorProps): JSX.Element {

  const defaultSetup = {
    dependencies: {},
  };

  const visibleFiles = Object.keys(project.files || {}).filter(file => file.startsWith("/src/"));

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <SandpackProvider
        theme="dark"
        template={project.template as SandpackPredefinedTemplate}
        files={project.files || {}}
        customSetup={project.customSetup || defaultSetup}
        options={{
          activeFile: "/src/index.ts",
          visibleFiles: visibleFiles,
        }}
      >
        <SandpackProjectChangeListener project={project} onProjectChange={onProjectChange} />
        <SandpackLayout>
          <SandpackFileExplorer initialCollapsedFolder={["/node_modules/", "/@salaxy/"]} />
          <SandpackMonacoEditor />
          {/*
          <SandpackTranspiledCode />
          */} 
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

function areProjectFilesEqual(
  current: Project["files"] | undefined,
  next: Project["files"]
): boolean {
  if (!current) {
    return Object.keys(next).length === 0;
  }
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of currentKeys) {
    if (!(key in next)) {
      return false;
    }
    if (current[key]?.code !== next[key]?.code) {
      return false;
    }
  }
  return true;
}

export default ProjectEditor;
