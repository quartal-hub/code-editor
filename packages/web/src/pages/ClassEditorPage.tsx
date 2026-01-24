import { JSX, useEffect, useState } from "react";
import { ClassEditor, useMonacoSetup } from "react-editors";
import { useQEditorPropsFromQuery } from "@/hooks";

function ClassEditorPage(): JSX.Element {
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();
  const { code: hashCode, mode, updateHash } = useQEditorPropsFromQuery("class");
  const readOnly = mode === "read-only";

  const [code, setCode] = useState<string>(hashCode ?? "");

  // Setup compiler options and libraries (so editor has intellisense for Quartal context)
  useEffect(() => {
    setCompilerOptions();
    setLibraries([
      {
        type: "module",
        name: "@salaxy/core",
        url: "/libs/core/salaxy-lib-core.d.ts",
      },
    ]);
  }, [setCompilerOptions, setLibraries]);

  // Update local code when hash changes
  useEffect(() => {
    setCode(hashCode ?? "");
  }, [hashCode]);

  // Listen for external messages that provide full source updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.code !== undefined) {
        setCode(String(event.data.code));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    updateHash(newCode);

    // Send to parent window (for QEditor's onChange callback)
    if (window.self !== window.top) {
      try {
        window.parent.postMessage({ code: newCode }, "*");
      } catch (error) {
        console.warn("Could not send code update to parent window:", error);
      }
    }
  };

  // Send loaded message to parent
  useEffect(() => {
    if (window.self !== window.top) {
      window.parent.postMessage({ loaded: true }, "*");
    }
  }, []);

  return (
    <div className="h-100" style={{ minHeight: 0 }}>
      <ClassEditor
        code={code}
        readOnly={readOnly}
        onCodeChange={handleCodeChange}
      />
    </div>
  );
}

export default ClassEditorPage;
