import { useCallback, useEffect, useMemo, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import ExpressionEditor from "./ExpressionEditor";
import { ClassParser, type ClassInfo, type ParsedMethod } from "@/helpers/classParser";
import { useMonacoSetup } from "@/hooks";

export interface ClassEditorProps {
  /** Full source file containing the class(es). */
  code: string;
  /** When true, disable editing and saving. */
  readOnly?: boolean;
  /** Called when full source changes (after save). */
  onCodeChange?: (newCode: string) => void;
}

function ClassEditor({ code, readOnly = false, onCodeChange }: ClassEditorProps): JSX.Element {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [methods, setMethods] = useState<ParsedMethod[]>([]);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedMethodIndex, setSelectedMethodIndex] = useState<number>(-1);
  const [editorContent, setEditorContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("class-editor");

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

  // Parse whenever full source changes from outside (hash/message)
  useEffect(() => {
    try {
      setErrorMsg("");
      const parsedMethods = ClassParser.parseMethods(code ?? "");
      const parsedClasses = ClassParser.parseClasses(code ?? "");
      setMethods(parsedMethods);
      setClasses(parsedClasses);

      const classNames = parsedClasses.map((item) => item.name);
      setSelectedClassName((prev) => {
        if (prev && classNames.includes(prev)) return prev;
        return classNames.length > 0 ? classNames[0] : null;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Syntax Error: ${msg}`);
      setClasses([]);
      setMethods([]);
      setSelectedClassName(null);
      setSelectedMethodIndex(-1);
      setEditorContent("");
    }
  }, [code]);

  const classList = useMemo(() => {
    return classes;
  }, [classes]);

  const methodsForSelectedClass = useMemo(() => {
    if (!selectedClassName) return [];
    return methods.filter(
      (method) => method.owner.kind === "class" && method.owner.name === selectedClassName
    );
  }, [methods, selectedClassName]);

  useEffect(() => {
    if (methodsForSelectedClass.length === 0) {
      setSelectedMethodIndex(-1);
    } else if (selectedMethodIndex < 0 || selectedMethodIndex >= methodsForSelectedClass.length) {
      setSelectedMethodIndex(0);
    }
  }, [methodsForSelectedClass, selectedMethodIndex]);

  const selectedMethod = useMemo(() => {
    if (selectedMethodIndex < 0 || selectedMethodIndex >= methodsForSelectedClass.length) return null;
    return methodsForSelectedClass[selectedMethodIndex];
  }, [methodsForSelectedClass, selectedMethodIndex]);

  // When selection changes or methods refresh, load body into editor buffer
  useEffect(() => {
    if (!selectedMethod) {
      setEditorContent("");
      return;
    }
    setEditorContent((selectedMethod.content ?? "").replace(/^\n/, ""));
  }, [selectedMethod]);

  const selectedMethodName = useMemo(() => {
    if (!selectedMethod) return "";
    return selectedMethod.name;
  }, [selectedMethod]);

  const saveMethod = useCallback((): void => {
    if (readOnly) return;
    if (!selectedMethod || !selectedMethod.editable) return;

    if (selectedMethod.start == null || selectedMethod.end == null) return;

    const before = code.slice(0, selectedMethod.start + 1); // includes '{'
    const after = code.slice(selectedMethod.end - 1); // includes '}'
    const newSource = `${before}\n${editorContent}\n${after}`;
    onCodeChange?.(newSource);
  }, [code, editorContent, onCodeChange, readOnly, selectedMethod]);

  const handleTabClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveTab((e.currentTarget as HTMLAnchorElement).href.split("#")[1] ?? "class-editor");
  }, [setActiveTab]);

  const handleAddClass = useCallback(() => {
    if (readOnly) return;
    const baseName = "NewClass";
    const existing = new Set(classList.map((item) => item.name));
    let nextIndex = 1;
    let newName = `${baseName}${nextIndex}`;
    while (existing.has(newName)) {
      nextIndex += 1;
      newName = `${baseName}${nextIndex}`;
    }

    const snippet = `\n\nexport class ${newName} {\n\n}\n`;
    const updated = `${code}${snippet}`;
    onCodeChange?.(updated);
    setSelectedClassName(newName);
  }, [classList, code, onCodeChange, readOnly]);

  const handleAddMethod = useCallback(() => {
    if (readOnly) return;
    if (!selectedClassName) return;
    const classInfo = classList.find((item) => item.name === selectedClassName);
    if (!classInfo) return;

    const existingNames = new Set(
      methodsForSelectedClass.map((method) => method.name)
    );
    let methodIndex = 1;
    let methodName = `newMethod${methodIndex}`;
    while (existingNames.has(methodName)) {
      methodIndex += 1;
      methodName = `newMethod${methodIndex}`;
    }

    const classIndent = getIndentAtIndex(code, classInfo.start);
    const methodIndent = `${classIndent}  `;
    const methodSnippet = `\n${methodIndent}public ${methodName}(): void {\n${methodIndent}  \n${methodIndent}}\n${classIndent}`;

    const insertionPoint = classInfo.bodyEnd - 1;
    const updated = `${code.slice(0, insertionPoint)}${methodSnippet}${code.slice(insertionPoint)}`;
    onCodeChange?.(updated);
  }, [classList, code, methodsForSelectedClass, onCodeChange, readOnly, selectedClassName]);

  return (
    <div className="d-flex flex-column" style={{ height: "calc(100vh - 200px)" }}>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a className={`nav-link ${(activeTab === "class-editor" || !activeTab) ? "active" : ""}`} href="#class-editor" onClick={handleTabClick}>Classes and functions</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${(activeTab === "vibe-coding" || !activeTab) ? "active" : ""}`} href="#vibe-coding" onClick={handleTabClick}>Vibe coding</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${(activeTab === "full-source-code" || !activeTab) ? "active" : ""}`} href="#full-source-code" onClick={handleTabClick}>Full source code</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${(activeTab === "tester" || !activeTab) ? "active" : ""}`} href="#tester" onClick={handleTabClick}>Tester</a>
        </li>
      </ul>


      {activeTab === "class-editor" && (
        <div className="h-100 d-flex flex-column" style={{ minHeight: 0 }}>
          {errorMsg ? (
            <div className="alert alert-danger py-1 px-2 m-3" role="alert">
              {errorMsg}
            </div>
          ) : null}
          <div className="flex-grow-0 flex-shrink-0" style={{ height: "140px" }}>
            <ExpressionEditor
              code={editorContent}
              lang="typescript"
              onMonacoMount={initialize}
            />
          </div>
          <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
            <div className="card flex-shrink-0" style={{ width: 260, overflowY: "auto" }}>
              <div className="card-body flex-grow-0 flex-shrink-0">
                <h3>Classes</h3>
                {classList.length === 0 ? (
                  <div className="text-muted small fst-italic mb-2">No classes found.</div>
                ) : null}
              </div>
              <div className="list-group list-group-flush">
                {classList.map((owner) => (
                  <button
                    key={owner.name}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex align-items-center ${owner.name === selectedClassName ? "active" : ""
                      }`}
                    onClick={() => setSelectedClassName(owner.name)}
                  >
                    <span className="text-truncate">{owner.name}</span>
                  </button>
                ))}
              </div>
              <div className="card-body flex-grow-1 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleAddClass}
                  disabled={readOnly}
                >
                  + Add class...
                </button>
              </div>


            </div>
            <div className="card flex-shrink-0 ms-2" style={{ width: 260, overflowY: "auto" }}>
              <div className="card-body flex-grow-0 flex-shrink-0">
                <h3>Functions</h3>
                {methodsForSelectedClass.length === 0 ? (
                  <div className="text-muted small fst-italic mb-2">
                    {selectedClassName ? "No methods found in class." : "Select a class to view methods."}
                  </div>
                ) : null}
              </div>
              <div className="list-group list-group-flush">
                {methodsForSelectedClass.map((m, i) => (
                  <button
                    key={`${m.name}-${i}`}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex align-items-center ${i === selectedMethodIndex ? "active" : ""
                      }`}
                    onClick={() => setSelectedMethodIndex(i)}
                  >
                    <strong className="me-2 text-muted">ƒ</strong>
                    <span className="text-truncate">{m.name}</span>
                  </button>
                ))}
              </div>
              <div className="card-body flex-grow-1 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleAddMethod}
                  disabled={!selectedClassName || readOnly}
                >
                  + Add function...
                </button>
              </div>
            </div>

            <div className="flex-grow-1 p-2 d-flex flex-column ms-2" style={{ minHeight: 0 }}>
              {selectedMethodIndex === -1 ? (
                <div className="text-muted fst-italic mt-3">Select a method on the left to edit its body.</div>
              ) : (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <div>
                      <h3>
                        {selectedMethodName}({selectedMethod?.doc.params.map((p) => p.name).join(", ")})
                        <small className="text-muted"> in {`${selectedMethod?.owner.kind} ${selectedMethod?.owner.name}`}</small>
                      </h3>
                      {selectedMethod && (
                        <>
                          {selectedMethod.doc.description && (
                            <p>{selectedMethod.doc.description}</p>
                          )}
                          <ul>
                            {selectedMethod.doc.params.map((p) => (
                              <li key={p.name}>{p.name}: {p.description}</li>
                            ))}
                          </ul>
                          {selectedMethod.doc.returns && (
                            <p>Returns: {selectedMethod.doc.returns}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <button className="btn btn-outline-success btn-sm" type="button" onClick={saveMethod}
                        disabled={readOnly || !selectedMethod?.editable}>TODO: Save Changes</button>
                    </div>
                  </div>
                  <div className="text-muted small mt-2">
                    {selectedMethod?.editable
                      ? "Only the function body is editable."
                      : "Interface methods are read-only."}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "full-source-code" && (
        <div className="h-100 border rounded" style={{ minHeight: 0 }}>
          <MonacoEditor
            code={code}
            lang="javascript"
            theme="vs-dark"
            readOnly={true}
            options={{
              minimap: { enabled: false },
              tabSize: 2,
              automaticLayout: true,
            }}
            onMonacoMount={initialize}
          />
        </div>
      )}
      {activeTab === "vibe-coding" && (
        <div className="h-100 border rounded" style={{ minHeight: 0 }}>
          <h3>Vibe coding</h3>
          <p>TODO: Add vibe coding here</p>
        </div>
      )}
      {activeTab === "tester" && (
        <div className="border-top p-2" style={{ height: 220, overflow: "auto" }}>
          <div className="border-bottom py-2">
            <div className="d-flex align-items-center justify-content-between">
              <h3>Tester</h3>
            </div>
          </div>
          TODO: Add tester here
        </div>
      )}
    </div>
  );
}

export default ClassEditor;

function getIndentAtIndex(source: string, index: number): string {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const line = source.slice(lineStart, index);
  const match = line.match(/^\s*/);
  return match ? match[0] : "";
}
