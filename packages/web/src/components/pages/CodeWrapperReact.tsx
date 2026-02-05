import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import type { Project } from "@quartal/code-editors-core";
import type { ExcalidrawSceneData } from "react-editors";
import { ExcalidrawEditor, MonacoEditor, ProjectEditor } from "react-editors";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

type ReactCodeEditor = "monaco-react" | "excalidraw" | "project";

interface CodeWrapperReactProps {
  /** Type of the editor to show. */
  editor: ReactCodeEditor;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === "") {
    return undefined;
  }
  const normalized = value.toLowerCase().trim();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
}

function parseProjectFromCode(code: string): Project | null {
  if (!code) {
    return null;
  }
  try {
    const parsed = JSON.parse(code) as Project;
    if (!parsed || typeof parsed !== "object" || !("files" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseSceneFromCode(code: string): ExcalidrawSceneData | null {
  if (!code) {
    return null;
  }
  try {
    return JSON.parse(code) as ExcalidrawSceneData;
  } catch {
    return null;
  }
}

function CodeWrapperReact({ editor }: CodeWrapperReactProps): JSX.Element {
  const [code, setCode] = useState<string>("");
  const [lang, setLang] = useState<string | undefined>(undefined);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [project, setProject] = useState<Project | null>(null);
  const [scene, setScene] = useState<ExcalidrawSceneData | null>(null);

  const isUpdatingHashRef = useRef(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const readPropsFromLocation = useCallback(() => {
    if (isUpdatingHashRef.current) {
      isUpdatingHashRef.current = false;
      return;
    }
    const values = PageHelpers.getPropsFromLocation(editor);
    const nextCode = values.code ?? "";
    setCode(nextCode);
    setLang(values.lang ?? undefined);
    setReadOnly(values.readOnly ?? false);
    if (editor === "project") {
      setProject(parseProjectFromCode(nextCode));
    }
    if (editor === "excalidraw") {
      setScene(parseSceneFromCode(nextCode));
    }
  }, [editor]);

  const scheduleHashUpdate = useCallback(
    (nextCode: string) => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        isUpdatingHashRef.current = true;
        PageHelpers.updateToHash("code", nextCode);
      }, 250);
    },
    []
  );

  useEffect(() => {
    readPropsFromLocation();
    PageHelpers.addHashChangeListener(readPropsFromLocation);
    return () => {
      PageHelpers.removeHashChangeListener(readPropsFromLocation);
    };
  }, [readPropsFromLocation]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleMonacoChange = useCallback(
    (data: QEditorChangeEventData) => {
      const nextCode = data.code ?? "";
      setCode(nextCode);
      scheduleHashUpdate(nextCode);
    },
    [scheduleHashUpdate]
  );

  const handleProjectChange = useCallback(
    (nextProject: Project) => {
      setProject(nextProject);
      try {
        const serialized = JSON.stringify(nextProject);
        setCode(serialized);
        scheduleHashUpdate(serialized);
      } catch {
        // Ignore serialization errors
      }
    },
    [scheduleHashUpdate]
  );

  const handleExcalidrawChange = useCallback(
    (data: QEditorChangeEventData) => {
      if (!data.data || typeof data.data !== "object") {
        return;
      }
      const nextScene = data.data as ExcalidrawSceneData;
      setScene(nextScene);
      try {
        const serialized = JSON.stringify(nextScene);
        setCode(serialized);
        scheduleHashUpdate(serialized);
      } catch {
        // Ignore serialization errors
      }
    },
    [scheduleHashUpdate]
  );

  const hasProject = useMemo(() => Boolean(project), [project]);
  const hasScene = useMemo(() => Boolean(scene), [scene]);

  if (editor === "project") {
    return hasProject ? (
      <ProjectEditor project={project as Project} onProjectChange={handleProjectChange} />
    ) : (
      <div className="alert alert-secondary m-auto mt-5" style={{ width: "fit-content" }}>
        <h2>Waiting for project data</h2>
        <div>Provide project JSON in the hash to load a project.</div>
      </div>
    );
  }

  if (editor === "excalidraw") {
    return hasScene ? (
      <ExcalidrawEditor codeModel={scene ?? undefined} readOnly={readOnly} onChange={handleExcalidrawChange} />
    ) : (
      <div className="alert alert-secondary m-auto mt-5" style={{ width: "fit-content" }}>
        <h2>Waiting for scene data</h2>
        <div>Provide Excalidraw JSON in the hash to load a scene.</div>
      </div>
    );
  }

  return <MonacoEditor code={code} lang={lang} readOnly={readOnly} onChange={handleMonacoChange} />;
}

export default CodeWrapperReact;
