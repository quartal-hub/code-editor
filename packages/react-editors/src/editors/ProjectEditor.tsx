import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackTranspiledCode,
} from "@codesandbox/sandpack-react";
import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";
import { SandpackMonacoEditor } from "react-editors";
import type { JSX } from "react";
import type { Project } from "../model";

function ProjectEditor(props: { project: Project }): JSX.Element {

  const defaultSetup = {
    dependencies: {},
  }

  const visibleFiles = Object.keys(props.project.files || {}).filter(file => file.startsWith("/src/"));

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <SandpackProvider
        theme="dark"
        template={props.project.template as SandpackPredefinedTemplate}
        files={props.project.files || {}}        
        customSetup={props.project.customSetup || defaultSetup}
        options={{
          activeFile: "/src/index.ts",
          visibleFiles: visibleFiles,
        }}
      >
        <SandpackLayout>
          <SandpackFileExplorer initialCollapsedFolder={["/node_modules/", "/@salaxy/"]} />
          <SandpackMonacoEditor />
          <SandpackTranspiledCode />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default ProjectEditor;
