import { useState, useEffect, JSX } from "react";
import { MonacoEditor } from "@/components/editors";
import { useMonacoSetup, useQEditorPropsFromQuery } from "@/hooks";

function MonacoEditorPage(): JSX.Element {
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();
  const { code: hashCode, lang, mode, url, updateHash } = useQEditorPropsFromQuery("monaco");
  const [loading, setLoading] = useState<boolean>(false);
  const [readOnly, setReadOnly] = useState<boolean>(mode === "read-only");
  const [code, setCode] = useState<string>(hashCode ?? "");
  
  async function fetchCodeFromUrl(url: string) {
    setLoading(true);
    try {
      const response = await fetch(url);
      const text = await response.text();
      setCode(text);
    } catch (error) {
      console.error("Error fetching code from URL:", error);
    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    if (url) {
      setReadOnly(true);
      fetchCodeFromUrl(url);
    } else {
      setReadOnly(mode === "read-only");
    }
  }, [url, mode]);

  // Setup compiler options and libraries
  useEffect(() => {
    setCompilerOptions();

    // TODO: Make this configurable from the parent page.
    setLibraries([
    {
      type: "module",
      name: "@salaxy/core",
      url: "/libs/core/salaxy-lib-core.d.ts",
    },
    {
      type: "context",
      code: `
      import { HelpersRoot, CompanyAccountSettings, Employment, Calculation, UserDefinedRow } from "@salaxy/core";

      // Enums used by sxy helper functions:
      import { CalculationRowType } from "@salaxy/core";

      declare global {
        /** The sxy helper functions. */
        declare var sxy: HelpersRoot;
        /** The company account settings. */
        declare var settings: CompanyAccountSettings;
        /** The employment. */
        declare var employment: Employment;
        /** The calculation. */
        declare var calculation: Calculation;
        /** The user defined row. */
        declare var row: UserDefinedRow;
      }
      `
    }
    ]);
  }, [setCompilerOptions, setLibraries]);

  // Update local code when hash changes
  useEffect(() => {
    setCode(hashCode ?? "");
  }, [hashCode]);

  // Listen for messages from parent (for external code updates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.code !== undefined) {
        setCode(event.data.code);
        
        // Restore cursor position if provided (would need editor ref for this)
        // For now, just update the code
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Handle code changes: update hash and send to parent
  const handleCodeChange = (newCode: string, cursorPosition?: { lineNumber: number; column: number } | null) => {
    setCode(newCode);
    updateHash(newCode);
    
    // Send to parent window (for QEditor's onChange callback)
    if (window.self !== window.top) {
      try {
        window.parent.postMessage(
          {
            code: newCode,
            cursorPosition: cursorPosition,
          },
          "*"
        );
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
    <>
      {loading ? <div className="text-center">Loading from {url}...</div> : (
        <MonacoEditor
          code={code}
          lang={lang}
          readOnly={readOnly}
          onCodeChange={handleCodeChange}
          onMonacoMount={initialize}
        />
      )}
    </>
  );
}

export default MonacoEditorPage;
