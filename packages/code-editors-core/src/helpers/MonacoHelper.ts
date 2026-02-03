export type MonacoInstance = any;

export class MonacoHelper {

  public static applyCompilerOptions(monacoInstance: MonacoInstance, tsConfigCode?: string): boolean {
    if (!tsConfigCode) {
      this.applyDefaultCompilerOptions(monacoInstance);
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
        this.applyDefaultCompilerOptions(monacoInstance);
        return false;
      }

      const resolvedBaseUrl = this.resolveBaseUrl(compilerOptions.baseUrl);
      const sharedOptions = {
        moduleResolution: this.getModuleResolutionKind(monacoInstance, compilerOptions.moduleResolution),
        module: this.getModuleKind(monacoInstance, compilerOptions.module),
        target: this.getScriptTarget(monacoInstance, compilerOptions.target),
        jsx: this.getJsxEmit(monacoInstance, compilerOptions.jsx),
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

      monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions(sharedOptions);
      monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions(sharedOptions);
      return true;
    } catch {
      // Ignore invalid tsconfig content; Monaco will fall back to defaults.
      this.applyDefaultCompilerOptions(monacoInstance);
      return false;
    }
  }

  /**
   * Applies the default compiler options to the Monaco instance: Both TypeScript and JavaScript defaults.
   * @param monacoInstance The Monaco instance to apply the default compiler options to.
   * @returns The default compiler options.
   */
  public static applyDefaultCompilerOptions(monacoInstance: MonacoInstance): void {
    const sharedOptions = MonacoHelper.getDefaultCompilerOptions(monacoInstance);
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions(sharedOptions);
    monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions(sharedOptions);
  }

  /**
   * Returns the default compiler options for Monaco.
   * These should be pretty modern, usable in all our cases. Add overrides for specific cases if necessary.
   * @param monacoInstance The Monaco instance for fetching the actual enum values.
   * If not provided, fallback values are used.
   * @returns The default compiler options.
   */
  public static getDefaultCompilerOptions(monacoInstance?: MonacoInstance): any {
    if (!monacoInstance) {
      // Fallback values if Monaco not available
      return {
        target: 5, // ScriptTarget.ES2020
        allowNonTsExtensions: true,
        moduleResolution: 2, // ModuleResolutionKind.NodeJs
        module: 99, // ModuleKind.ESNext
        noEmit: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      };
    }

    // Actual Monaco enum values when Monaco is available
    return {
      target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monacoInstance.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,

      // Note these were added when debuging Sandpack => Not sure if they are really needed.
      jsx: monacoInstance.languages.typescript.JsxEmit.ReactJSX,
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      baseUrl: "/",
    };
  }

  // TODO: Not sure if all this parsing is really necessary => Is there really no simple way to apply tsconfig file in Monaco?
  
  private static getModuleResolutionKind(monacoInstance: MonacoInstance, value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized === "nodenext" && "NodeNext" in monacoInstance.languages.typescript.ModuleResolutionKind) {
      return monacoInstance.languages.typescript.ModuleResolutionKind.NodeNext;
    }
    if (normalized === "node16" && "Node16" in monacoInstance.languages.typescript.ModuleResolutionKind) {
      return monacoInstance.languages.typescript.ModuleResolutionKind.Node16;
    }
    if (normalized === "node") {
      return monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs;
    }
    return undefined;
  }

  private static getModuleKind(monacoInstance: MonacoInstance, value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized === "esnext") {
      return monacoInstance.languages.typescript.ModuleKind.ESNext;
    }
    if (normalized === "es2022") {
      return monacoInstance.languages.typescript.ModuleKind.ES2022;
    }
    if (normalized === "es2020") {
      return monacoInstance.languages.typescript.ModuleKind.ES2020;
    }
    if (normalized === "commonjs") {
      return monacoInstance.languages.typescript.ModuleKind.CommonJS;
    }
    return undefined;
  }

  private static getScriptTarget(monacoInstance: MonacoInstance, value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized === "esnext") {
      return monacoInstance.languages.typescript.ScriptTarget.ESNext;
    }
    if (normalized === "es2022") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2022;
    }
    if (normalized === "es2020") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2020;
    }
    if (normalized === "es2019") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2019;
    }
    if (normalized === "es2018") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2018;
    }
    if (normalized === "es2017") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2017;
    }
    if (normalized === "es2016") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2016;
    }
    if (normalized === "es2015") {
      return monacoInstance.languages.typescript.ScriptTarget.ES2015;
    }
    return undefined;
  }

  private static getJsxEmit(monacoInstance: MonacoInstance, value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.toLowerCase();
    if (normalized === "react-jsx") {
      return monacoInstance.languages.typescript.JsxEmit.ReactJSX;
    }
    if (normalized === "react") {
      return monacoInstance.languages.typescript.JsxEmit.React;
    }
    return undefined;
  }

  private static resolveBaseUrl(baseUrl: string | undefined): string | undefined {
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
  }
}