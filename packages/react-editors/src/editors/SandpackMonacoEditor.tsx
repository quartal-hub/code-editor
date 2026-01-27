import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import {
  useActiveCode,
  SandpackStack,
  FileTabs,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { JSX } from "react";
import { SandpackMonacoSync } from "./SandpackMonacoSync";
import { useEffect, useRef } from "react";

function SandpackMonacoEditor(): JSX.Element {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const monacoRef = useRef<Monaco | null>(null);
  const syncRef = useRef<SandpackMonacoSync | null>(null);

  const handleEditorDidMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;
    syncRef.current = new SandpackMonacoSync(monaco);
    syncRef.current.configureDefaults();
    syncRef.current.ensureModels(sandpack.files);
    syncRef.current.scheduleRefresh(sandpack.files);
  };

  useEffect(() => {
    if (!monacoRef.current || !syncRef.current) {
      return;
    }

    syncRef.current.ensureModels(sandpack.files);
    syncRef.current.scheduleRefresh(sandpack.files);
  }, [sandpack.files]);

  useEffect(() => {
    return () => {
      syncRef.current?.dispose();
    };
  }, []);

  return (
    <SandpackStack style={{ height: "100vh", margin: 0 }}>
      <FileTabs closableTabs={true} activeFileUniqueId={sandpack.activeFile} />
      <div style={{ flex: 1, paddingTop: 8, background: "#1e1e1e" }}>
        <Editor
          width="100%"
          height="100%"
          path={SandpackMonacoSync.filePathToUri(sandpack.activeFile) ?? ""}
          theme="vs-dark"
          value={code}
          onChange={(value) => updateCode(value || "")}
          onMount={handleEditorDidMount}
        />
      </div>
    </SandpackStack>
  );
}

export default SandpackMonacoEditor;
