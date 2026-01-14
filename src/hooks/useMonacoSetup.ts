import { useEffect, useRef, useCallback, useState } from "react";

export interface MonacoLibrary {
  type: "module";
  name: string;
  url: string;
}

export interface MonacoPackage {
  type: "package";
  name: string;
}

export interface MonacoContext {
  type: "context";
  code: string;
}

export interface MonacoDisposable {
  dispose: () => void;
}

export type MonacoLibraryConfig = MonacoLibrary | MonacoPackage | MonacoContext;

export interface UseMonacoSetupReturn {
  /** Initialize the hook with Monaco instance from onMount callback */
  initialize: (monaco: any) => void;
  setCompilerOptions: (options?: any) => void;
  setLibraries: (libraries: MonacoLibraryConfig[]) => Promise<void>;
  isReady: boolean;
}

// Default compiler options from MonacoEditor.tsx
// These will be set using the actual Monaco enum values when Monaco is available
const getDefaultCompilerOptions = (monaco: any): any => {
  if (!monaco) {
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

  return {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };
};

/**
 * Hook for setting up Monaco Editor compiler options and libraries.
 * Provides methods to configure Monaco that execute when the instance is ready.
 * Call initialize(monaco) from the onMount callback of Monaco Editor.
 */
export function useMonacoSetup(): UseMonacoSetupReturn {
  const monacoRef = useRef<any | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Track disposables for cleanup
  const disposablesRef = useRef<MonacoDisposable[]>([]);

  // Track pending operations
  const pendingCompilerOptionsRef = useRef<any | null>(null);
  const pendingLibrariesRef = useRef<MonacoLibraryConfig[] | null>(null);

  // Apply compiler options when Monaco is ready
  const applyCompilerOptions = useCallback((options: any) => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    const opts = !options || Object.keys(options).length === 0
      ? getDefaultCompilerOptions(monaco)
      : options;

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(opts);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(opts);
  }, []);

  // Fetch and process a module library
  const loadModuleLibrary = async (lib: MonacoLibrary): Promise<string> => {
    try {
      const response = await fetch(lib.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch library from ${lib.url}: ${response.statusText}`);
      }
      const code = await response.text();

      // Wrap in declare module
      return `declare module '${lib.name}' {\n${code}\n}`;
    } catch (error) {
      console.error(`Error loading module library ${lib.name}:`, error);
      throw error;
    }
  };

  // Fetch package.json and load types file
  const loadPackageLibrary = async (lib: MonacoPackage): Promise<string> => {
    try {
      // Fetch package.json from jsdelivr
      const packageUrl = `https://cdn.jsdelivr.net/npm/${lib.name}/package.json`;
      const response = await fetch(packageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch package.json for ${lib.name}: ${response.statusText}`);
      }

      const packageJson = await response.json();
      const typesFile = packageJson.types || packageJson.typings || packageJson.main;

      if (!typesFile) {
        throw new Error(`No types file found in package.json for ${lib.name}`);
      }

      // Construct URL for types file
      const baseUrl = `https://cdn.jsdelivr.net/npm/${lib.name}`;
      // Handle relative paths (e.g., "./dist/index.d.ts" or "dist/index.d.ts")
      const typesPath = typesFile.startsWith('./') ? typesFile.slice(2) : typesFile;
      const typesUrl = `${baseUrl}/${typesPath}`;

      // Fetch the types file
      const typesResponse = await fetch(typesUrl);
      if (!typesResponse.ok) {
        throw new Error(`Failed to fetch types file from ${typesUrl}: ${typesResponse.statusText}`);
      }

      const code = await typesResponse.text();

      // Wrap in declare module
      return `declare module '${lib.name}' {\n${code}\n}`;
    } catch (error) {
      console.error(`Error loading package library ${lib.name}:`, error);
      throw error;
    }
  };

  // Process context library (no wrapping needed)
  const processContextLibrary = (lib: MonacoContext): string => {
    return lib.code;
  };

  // Apply libraries when Monaco is ready
  const applyLibraries = useCallback(async (libraries: MonacoLibraryConfig[]) => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    // Dispose old libraries first
    disposablesRef.current.forEach(disposable => disposable.dispose());
    disposablesRef.current = [];

    // Process each library
    for (const lib of libraries) {
      try {
        let code: string;
        let filePath: string;

        if (lib.type === "module") {
          code = await loadModuleLibrary(lib);
          // Keep @scope/name format for file path
          filePath = `file:///node_modules/${lib.name}/index.d.ts`;
        } else if (lib.type === "package") {
          code = await loadPackageLibrary(lib);
          // Keep @scope/name format for file path
          filePath = `file:///node_modules/${lib.name}/index.d.ts`;
        } else {
          // context
          code = processContextLibrary(lib);
          filePath = `file:///context/${Date.now()}.d.ts`;
        }

        // Add to both JavaScript and TypeScript defaults
        // TODO: Check if we should add to both or just one based on language
        // For now, add to both as requested
        const jsDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(code, filePath);
        const tsDisposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(code, filePath);

        disposablesRef.current.push(jsDisposable, tsDisposable);
      } catch (error) {
        console.error(`Error processing library:`, lib, error);
        // Continue with other libraries even if one fails
      }
    }
  }, []);

  // Initialize method - call this from onMount with Monaco instance
  const initialize = useCallback((monaco: any) => {
    monacoRef.current = monaco;
    setIsReady(true);

    // Apply pending compiler options
    if (pendingCompilerOptionsRef.current !== null) {
      applyCompilerOptions(pendingCompilerOptionsRef.current);
      pendingCompilerOptionsRef.current = null;
    } else {
      // Apply default compiler options if nothing pending
      applyCompilerOptions({});
    }

    // Apply pending libraries
    if (pendingLibrariesRef.current !== null) {
      applyLibraries(pendingLibrariesRef.current).then(() => {
        pendingLibrariesRef.current = null;
      });
    }
  }, [applyCompilerOptions, applyLibraries]);

  // Set compiler options method
  const setCompilerOptions = useCallback((options?: any) => {
    const monaco = monacoRef.current;
    if (monaco) {
      applyCompilerOptions(options);
    } else {
      pendingCompilerOptionsRef.current = options;
    }
  }, [applyCompilerOptions]);

  // Set libraries method
  const setLibraries = useCallback(async (libraries: MonacoLibraryConfig[]) => {
    const monaco = monacoRef.current;
    if (monaco) {
      await applyLibraries(libraries);
    } else {
      pendingLibrariesRef.current = libraries;
    }
  }, [applyLibraries]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach(disposable => disposable.dispose());
      disposablesRef.current = [];
    };
  }, []);

  return {
    initialize,
    setCompilerOptions,
    setLibraries,
    isReady,
  };
}
