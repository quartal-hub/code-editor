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

      // Layer the parsed tsconfig on top of the Monaco defaults so that
      // important options (esModuleInterop, allowNonTsExtensions, etc.) survive
      // when the project's tsconfig omits them.
      const overrides: Record<string, unknown> = {};
      const moduleResolution = this.getModuleResolutionKind(monacoInstance, compilerOptions.moduleResolution);
      if (moduleResolution !== undefined) overrides.moduleResolution = moduleResolution;
      const moduleKind = this.getModuleKind(monacoInstance, compilerOptions.module);
      if (moduleKind !== undefined) overrides.module = moduleKind;
      const target = this.getScriptTarget(monacoInstance, compilerOptions.target);
      if (target !== undefined) overrides.target = target;
      const jsx = this.getJsxEmit(monacoInstance, compilerOptions.jsx);
      if (jsx !== undefined) overrides.jsx = jsx;
      if (compilerOptions.allowNonTsExtensions !== undefined) overrides.allowNonTsExtensions = compilerOptions.allowNonTsExtensions;
      if (compilerOptions.allowImportingTsExtensions !== undefined) overrides.allowImportingTsExtensions = compilerOptions.allowImportingTsExtensions;
      if (compilerOptions.resolveJsonModule !== undefined) overrides.resolveJsonModule = compilerOptions.resolveJsonModule;
      if (compilerOptions.isolatedModules !== undefined) overrides.isolatedModules = compilerOptions.isolatedModules;
      if (compilerOptions.noEmit !== undefined) overrides.noEmit = compilerOptions.noEmit;
      if (compilerOptions.baseUrl !== undefined) overrides.baseUrl = this.resolveBaseUrl(compilerOptions.baseUrl);
      if (compilerOptions.paths !== undefined) overrides.paths = compilerOptions.paths;
      if (compilerOptions.lib !== undefined) overrides.lib = this.normalizeLib(compilerOptions.lib);
      if (compilerOptions.types !== undefined) overrides.types = compilerOptions.types;

      const sharedOptions = {
        ...this.getDefaultCompilerOptions(monacoInstance),
        ...overrides,
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

  /**
   * Maps tsconfig `lib` aliases (e.g. `"es6"`, `"dom"`) to the file names that
   * Monaco's TypeScript worker resolves at runtime (e.g. `"lib.es2015.d.ts"`,
   * `"lib.dom.d.ts"`). Monaco only performs this translation when parsing a
   * tsconfig from disk via the CLI; calling `setCompilerOptions` directly with
   * bare aliases makes the worker fail to load the lib (so e.g. `console`
   * disappears). Unknown values are passed through unchanged.
   */
  private static normalizeLib(libs: string[] | undefined): string[] | undefined {
    if (!libs) {
      return undefined;
    }
    return libs.map((lib) => MonacoHelper.LIB_ALIAS_TO_FILE[lib.toLowerCase()] ?? lib);
  }

  private static readonly LIB_ALIAS_TO_FILE: Record<string, string> = {
    es5: "lib.es5.d.ts",
    es6: "lib.es2015.d.ts",
    es7: "lib.es2016.d.ts",
    es2015: "lib.es2015.d.ts",
    es2016: "lib.es2016.d.ts",
    es2017: "lib.es2017.d.ts",
    es2018: "lib.es2018.d.ts",
    es2019: "lib.es2019.d.ts",
    es2020: "lib.es2020.d.ts",
    es2021: "lib.es2021.d.ts",
    es2022: "lib.es2022.d.ts",
    es2023: "lib.es2023.d.ts",
    es2024: "lib.es2024.d.ts",
    esnext: "lib.esnext.d.ts",
    dom: "lib.dom.d.ts",
    "dom.iterable": "lib.dom.iterable.d.ts",
    "dom.asynciterable": "lib.dom.asynciterable.d.ts",
    webworker: "lib.webworker.d.ts",
    "webworker.iterable": "lib.webworker.iterable.d.ts",
    "webworker.asynciterable": "lib.webworker.asynciterable.d.ts",
    "webworker.importscripts": "lib.webworker.importscripts.d.ts",
    scripthost: "lib.scripthost.d.ts",
    decorators: "lib.decorators.d.ts",
    "decorators.legacy": "lib.decorators.legacy.d.ts",
  };

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