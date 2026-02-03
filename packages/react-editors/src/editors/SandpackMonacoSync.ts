import type { Monaco } from "@monaco-editor/react";
import type { SandpackFile, SandpackFiles } from "@codesandbox/sandpack-react";
import { SandpackMonacoPackages } from "./SandpackMonacoPackages";
import { MonacoHelper } from "@quartal/code-editors-core";

/**
 * Keeps Monaco models, TypeScript services, and package types in sync with Sandpack files.
 * Monaco is the editor for single files. Sandpack files cover the entire project being edited.
 * Also applies compiler options from tsconfig.json (or default values, if one does not exist) to the Monaco editor.
 * TODO: When creating this code (Vibe coding) there was an issue on refreshing of the services. 
 *       As such there may be excess refreshes / syncs / timers: Try to remove them and see if the autocomplete still works.
 */
export class SandpackMonacoSync {
  private readonly monaco: Monaco;
  private readonly trackedModels = new Set<string>();
  private refreshTimeouts: number[] = [];
  private readonly packagesSync: SandpackMonacoPackages;

  /**
   * Creates a new sync instance for a Monaco editor.
   * @param monaco Monaco API instance for the active editor.
   */
  constructor(monaco: Monaco) {
    this.monaco = monaco;
    this.packagesSync = new SandpackMonacoPackages(monaco);
  }

  /**
   * Converts a Sandpack file path into a Monaco file URI.
   * @param filePath Sandpack file path (absolute or relative).
   * @returns Monaco-compatible file URI for the path.
   */
  public static filePathToUri(filePath: string): string {
    const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
    return `file://${normalized}`;
  }

  /**
   * Applies Monaco defaults that improve TypeScript model sync behavior.
   */
  public configureDefaults(): void {
    this.monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    this.monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  /**
   * Ensures Monaco models exist and are updated for the provided Sandpack files.
   * @param files Sandpack file map keyed by file path.
   */
  public ensureModels(files: SandpackFiles): void {
    const nextModels = new Set<string>();

    Object.entries(files).forEach(([filePath, file]) => {
      const uri = this.monaco.Uri.parse(SandpackMonacoSync.filePathToUri(filePath));
      const codeValue = this.getFileCode(file);
      const language = this.getLanguageByExtension(filePath);
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
        const uri = this.monaco.Uri.parse(SandpackMonacoSync.filePathToUri(filePath));
        const model = this.monaco.editor.getModel(uri);
        if (model) {
          model.dispose();
        }
      }
    });

    this.trackedModels.clear();
    nextModels.forEach((filePath) => this.trackedModels.add(filePath));
  }

  /**
   * Refreshes TypeScript services and package typings based on the provided files.
   * HACK: Test through are these really needed or are they just part of a workaround to fix some other bug?
   * @param files Sandpack file map keyed by file path.
   */
  public scheduleRefresh(files: SandpackFiles): void {
    this.refreshTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.refreshTimeouts = [];

    this.refreshTypeScriptServices(files);
    this.refreshTypeScriptDiagnostics();
    this.packagesSync.sync(files);

    [50, 250].forEach((delayMs) => {
      const timeoutId = window.setTimeout(() => {
        this.refreshTypeScriptServices(files);
        this.refreshTypeScriptDiagnostics();
        this.packagesSync.sync(files);
      }, delayMs);
      this.refreshTimeouts.push(timeoutId);
    });
  }

  /**
   * Disposes internal timers and package type registrations.
   */
  public dispose(): void {
    this.refreshTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.refreshTimeouts = [];
    this.packagesSync.dispose();
  }

  private getLanguageByExtension(filePath: string): string | undefined {
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
  }

  private getFileCode(file: string | SandpackFile): string {
    return typeof file === "string" ? file : file.code;
  }

  private getTsConfigCode(files: SandpackFiles): string | undefined {
    const match = Object.entries(files).find(([filePath]) =>
      filePath.toLowerCase().endsWith("tsconfig.json")
    );
    if (!match) {
      return undefined;
    }
    return this.getFileCode(match[1]);
  }

  private applyCompilerOptionsFromTsConfig(files: SandpackFiles): boolean {
    const tsConfigCode = this.getTsConfigCode(files);
    return MonacoHelper.applyCompilerOptions(this.monaco, tsConfigCode);
  }

  private refreshTypeScriptServices(files: SandpackFiles): void {
    this.applyCompilerOptionsFromTsConfig(files);
    // Re-apply on next tick to force the TS worker to re-scan new models.
    window.setTimeout(() => {
      this.applyCompilerOptionsFromTsConfig(files);
    }, 0);
  }

  private refreshTypeScriptDiagnostics(): void {
    const models = this.monaco.editor.getModels();
    const tsLikeModels = models.filter((model: Monaco["editor"]["ITextModel"]) => {
      const language = model.getLanguageId();
      return language === "typescript" || language === "javascript";
    });

    if (tsLikeModels.length === 0) {
      return;
    }

    void this.monaco.languages.typescript.getTypeScriptWorker().then(
      (getWorker: (uri: Monaco["Uri"]) => Promise<any>) => {
        tsLikeModels.forEach((model: Monaco["editor"]["ITextModel"]) => {
          void getWorker(model.uri).then((worker: any) => {
            void worker.getSemanticDiagnostics(model.uri.toString());
            void worker.getSyntacticDiagnostics(model.uri.toString());
          });
        });
      }
    );
  }
}
