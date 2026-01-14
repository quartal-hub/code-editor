import { useEffect } from "react";
import { ExpressionEditor as ExpressionEditorPanel } from "@/components/editors";
import { useMonacoSetup, useQEditorPropsFromQuery } from "@/hooks";

function ExpressionEditor(): JSX.Element {
  const { code, lang, mode: modeProp, updateHash } = useQEditorPropsFromQuery("expression");
  const readOnly = modeProp === "read-only";
  const mode: "plain" | "excel" = modeProp == "plain" ? "plain" : "excel";
  
  const { initialize, setCompilerOptions, setLibraries } = useMonacoSetup();

  //Setup compiler options and libraries
  // TODO: Make this configurable from the parent page.
  useEffect(() => {
    setCompilerOptions();
    setLibraries([
      {
        type: "module",
        name: "@salaxy/core",
        url: "/libs/core/salaxy-lib-core.d.ts",
      },
      {
        type: "context",
        code: `
        import { HelpersRoot, UserDefinedRow, RowContext } from "@salaxy/core";
        declare global {
          /** The row that is being process as part of calculation. */
          declare var row: UserDefinedRow;
          /** The calculation context: Calculation, Employment, Company settings, etc. */
          declare var ctx: RowContext;
          /** The sxy helper functions. */
          declare var sxy: HelpersRoot;
        }
        `
      }
    ]);
  }, [setCompilerOptions, setLibraries]);

  return (
    <ExpressionEditorPanel
      code={code ?? ""}
      lang={lang ?? "javascript"}
      mode={mode}
      readOnly={readOnly}
      onCodeChange={(newCode) => {
        if (mode === "plain") {
          updateHash(newCode);
        }
      }}
      onCommit={(newCode) => {
        if (mode === "excel") {
          updateHash(newCode);
        }
      }}
      onMonacoMount={initialize}
    />
  );
}

export default ExpressionEditor;
