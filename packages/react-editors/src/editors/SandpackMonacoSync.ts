import type { Monaco } from "@monaco-editor/react";
import type { SandpackFile, SandpackFiles } from "@codesandbox/sandpack-react";

const languageByExtension = (filePath: string): string | undefined => {
  const extension = filePath.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
    case "htm":
      return "html";
    case "md":
      return "markdown";
    default:
      return undefined;
  }
};

const getFileCode = (file: string | SandpackFile): string =>
  typeof file === "string" ? file : file.code;

const resolveBaseUrl = (baseUrl?: string): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }

  if (baseUrl.startsWith("/")) {
    return baseUrl;
  }

  if (baseUrl.startsWith("./")) {
    return `/${baseUrl.slice(2)}`;
  }

  return `/${baseUrl}`;
};

const getTsConfigCode = (files: SandpackFiles): string | null => {
  const match = Object.entries(files).find(([filePath]) =>
    filePath.toLowerCase().endsWith("tsconfig.json")
  );

  if (!match) {
    return null;
  }

  return getFileCode(match[1]);
};

const getModuleResolutionKind = (monaco: Monaco, value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === "nodenext" && "NodeNext" in monaco.languages.typescript.ModuleResolutionKind) {
    return monaco.languages.typescript.ModuleResolutionKind.NodeNext;
  }
  if (normalized === "node16" && "Node16" in monaco.languages.typescript.ModuleResolutionKind) {
    return monaco.languages.typescript.ModuleResolutionKind.Node16;
  }
  if (normalized === "node") {
    return monaco.languages.typescript.ModuleResolutionKind.NodeJs;
  }

  return undefined;
};

const getModuleKind = (monaco: Monaco, value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === "esnext") {
    return monaco.languages.typescript.ModuleKind.ESNext;
  }
  if (normalized === "es2022") {
    return monaco.languages.typescript.ModuleKind.ES2022;
  }
  if (normalized === "es2020") {
    return monaco.languages.typescript.ModuleKind.ES2020;
  }
  if (normalized === "commonjs") {
    return monaco.languages.typescript.ModuleKind.CommonJS;
  }

  return undefined;
};

const getScriptTarget = (monaco: Monaco, value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === "esnext") {
    return monaco.languages.typescript.ScriptTarget.ESNext;
  }
  if (normalized === "es2022") {
    return monaco.languages.typescript.ScriptTarget.ES2022;
  }
  if (normalized === "es2020") {
    return monaco.languages.typescript.ScriptTarget.ES2020;
  }
  if (normalized === "es2019") {
    return monaco.languages.typescript.ScriptTarget.ES2019;
  }
  if (normalized === "es2018") {
    return monaco.languages.typescript.ScriptTarget.ES2018;
  }
  if (normalized === "es2017") {
    return monaco.languages.typescript.ScriptTarget.ES2017;
  }
  if (normalized === "es2016") {
    return monaco.languages.typescript.ScriptTarget.ES2016;
  }
  if (normalized === "es2015") {
    return monaco.languages.typescript.ScriptTarget.ES2015;
  }

  return undefined;
};

const getJsxEmit = (monaco: Monaco, value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === "react-jsx") {
    return monaco.languages.typescript.JsxEmit.ReactJSX;
  }
  if (normalized === "react") {
    return monaco.languages.typescript.JsxEmit.React;
  }

  return undefined;
};

const applyDefaultCompilerOptions = (monaco: Monaco): void => {
  const moduleResolution =
    "NodeNext" in monaco.languages.typescript.ModuleResolutionKind
      ? monaco.languages.typescript.ModuleResolutionKind.NodeNext
      : monaco.languages.typescript.ModuleResolutionKind.NodeJs;

  const sharedOptions = {
    moduleResolution,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowNonTsExtensions: true,
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    baseUrl: "/",
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(sharedOptions);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(sharedOptions);
};

const applyCompilerOptionsFromTsConfig = (monaco: Monaco, files: SandpackFiles): boolean => {
  const tsConfigCode = getTsConfigCode(files);
  if (!tsConfigCode) {
    applyDefaultCompilerOptions(monaco);
    return false;
  }

  try {
    const parsed = JSON.parse(tsConfigCode) as {
      compilerOptions?: {
        target?: string;
        module?: string;
        moduleResolution?: string;
        jsx?: string;
        baseUrl?: string;
        lib?: string[];
        paths?: Record<string, string[]>;
        allowNonTsExtensions?: boolean;
        allowImportingTsExtensions?: boolean;
        resolveJsonModule?: boolean;
        isolatedModules?: boolean;
        noEmit?: boolean;
        types?: string[];
      };
    };

    const compilerOptions = parsed.compilerOptions;
    if (!compilerOptions) {
      applyDefaultCompilerOptions(monaco);
      return false;
    }

    const resolvedBaseUrl = resolveBaseUrl(compilerOptions.baseUrl);
    const sharedOptions = {
      moduleResolution: getModuleResolutionKind(monaco, compilerOptions.moduleResolution),
      module: getModuleKind(monaco, compilerOptions.module),
      target: getScriptTarget(monaco, compilerOptions.target),
      jsx: getJsxEmit(monaco, compilerOptions.jsx),
      allowNonTsExtensions: compilerOptions.allowNonTsExtensions,
      allowImportingTsExtensions: compilerOptions.allowImportingTsExtensions,
      resolveJsonModule: compilerOptions.resolveJsonModule,
      isolatedModules: compilerOptions.isolatedModules,
      noEmit: compilerOptions.noEmit,
      baseUrl: resolvedBaseUrl,
      paths: compilerOptions.paths,
      lib: compilerOptions.lib,
      types: compilerOptions.types,
    };

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(sharedOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(sharedOptions);
    return true;
  } catch {
    // Ignore invalid tsconfig content; Monaco will fall back to defaults.
    applyDefaultCompilerOptions(monaco);
    return false;
  }
};

const refreshTypeScriptServices = (monaco: Monaco, files: SandpackFiles): void => {
  applyCompilerOptionsFromTsConfig(monaco, files);
  // Re-apply on next tick to force the TS worker to re-scan new models.
  window.setTimeout(() => {
    applyCompilerOptionsFromTsConfig(monaco, files);
  }, 0);
};

const refreshTypeScriptDiagnostics = (monaco: Monaco): void => {
  const models = monaco.editor.getModels();
  const tsLikeModels = models.filter((model: Monaco["editor"]["ITextModel"]) => {
    const language = model.getLanguageId();
    return language === "typescript" || language === "javascript";
  });

  if (tsLikeModels.length === 0) {
    return;
  }

  void monaco.languages.typescript.getTypeScriptWorker().then(
    (getWorker: (uri: Monaco["Uri"]) => Promise<any>) => {
      tsLikeModels.forEach((model: Monaco["editor"]["ITextModel"]) => {
        void getWorker(model.uri).then((worker: any) => {
          void worker.getSemanticDiagnostics(model.uri.toString());
          void worker.getSyntacticDiagnostics(model.uri.toString());
        });
      });
    }
  );
};

export const toFileUri = (filePath: string): string => {
  const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `file://${normalized}`;
};

export default class SandpackMonacoSync {
  private readonly monaco: Monaco;
  private readonly trackedModels = new Set<string>();
  private refreshTimeouts: number[] = [];

  constructor(monaco: Monaco) {
    this.monaco = monaco;
  }

  public configureDefaults(): void {
    this.monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    this.monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  public ensureModels(files: SandpackFiles): void {
    const nextModels = new Set<string>();

    Object.entries(files).forEach(([filePath, file]) => {
      const uri = this.monaco.Uri.parse(toFileUri(filePath));
      const codeValue = getFileCode(file);
      const language = languageByExtension(filePath);
      let model = this.monaco.editor.getModel(uri);

      if (!model) {
        model = this.monaco.editor.createModel(codeValue, language, uri);
      } else if (model.getValue() !== codeValue) {
        model.setValue(codeValue);
      }

      if (language && model.getLanguageId() !== language) {
        this.monaco.editor.setModelLanguage(model, language);
      }

      nextModels.add(filePath);
    });

    this.trackedModels.forEach((filePath) => {
      if (!nextModels.has(filePath)) {
        const uri = this.monaco.Uri.parse(toFileUri(filePath));
        const model = this.monaco.editor.getModel(uri);
        if (model) {
          model.dispose();
        }
      }
    });

    this.trackedModels.clear();
    nextModels.forEach((filePath) => this.trackedModels.add(filePath));
  }

  public scheduleRefresh(files: SandpackFiles): void {
    this.refreshTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.refreshTimeouts = [];

    refreshTypeScriptServices(this.monaco, files);
    refreshTypeScriptDiagnostics(this.monaco);

    [50, 250].forEach((delayMs) => {
      const timeoutId = window.setTimeout(() => {
        refreshTypeScriptServices(this.monaco, files);
        refreshTypeScriptDiagnostics(this.monaco);
      }, delayMs);
      this.refreshTimeouts.push(timeoutId);
    });
  }

  public dispose(): void {
    this.refreshTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.refreshTimeouts = [];
  }
}
