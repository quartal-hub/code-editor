import type { Monaco } from "@monaco-editor/react";
import type { SandpackFile, SandpackFiles } from "@codesandbox/sandpack-react";
import { PackageCache } from "code-editors-core";

/** Used properties from project package.json file. */
interface PackageJsonFile {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Loads and registers package typings for Monaco based on package.json in Sandpack files.
 * TODO: Abstract applyPackageJsonToMonaco(file) and getPackage(sandpackFiles).
 *       Consider adding support for inline packages (e.g. `"@salaxy/core": "file:../core/salaxy-lib-core.d.ts"` in package.json).
 *       Move to `code-editors-core` package and make sure works on Monaco editor even without Sandpack.
 */
export class SandpackMonacoPackages {
  private readonly monaco: Monaco;
  private readonly loadedPackages = new Map<string, { dispose: () => void }>();
  private readonly packageCache: PackageCache;

  /**
   * Creates a new package sync helper for a Monaco instance.
   * @param monaco Monaco API instance for the active editor.
   */
  constructor(monaco: Monaco) {
    this.monaco = monaco;
    this.packageCache = new PackageCache();
  }

  /**
   * Synchronizes loaded package typings with the provided Sandpack files.
   * Reads the packages from package.json and loads the types for them to loadedPackages.
   * @param files Sandpack file map keyed by file path.
   */
  public sync(files: SandpackFiles): void {
    const packageNames = this.parsePackageNames(files);
    const nextPackages = new Set(packageNames);

    // Remove the packages that are no longer in package.json.
    this.loadedPackages.forEach((entry, packageName) => {
      if (!nextPackages.has(packageName)) {
        entry.dispose();
        this.loadedPackages.delete(packageName);
      }
    });

    // Load the new packages.
    packageNames.forEach((packageName) => {
      if (this.loadedPackages.has(packageName)) {
        return;
      }
      void this.loadPackageTypes(packageName);
    });
  }

  /**
   * Disposes all loaded package typings.
   */
  public dispose(): void {
    this.loadedPackages.forEach((entry) => entry.dispose());
    this.loadedPackages.clear();
  }

  /**
   * Loads the types for a package from the package cache.
   * @param packageName The name of the package to load the types for.
   */
  private async loadPackageTypes(packageName: string): Promise<void> {
    const fetchedTypes = await this.packageCache.getTypes(packageName);
    if (fetchedTypes) {
      this.registerPackageTypes(packageName, fetchedTypes);
    }
  }

  private registerPackageTypes(packageName: string, content: string): void {
    const uri = this.packageCache.getMonacoFileUri(packageName);
    const disposable = this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
      content,
      uri
    );
    this.monaco.languages.typescript.javascriptDefaults.addExtraLib(content, uri);
    this.loadedPackages.set(packageName, { dispose: () => disposable.dispose() });
  }

  /**
   * Parses the packages from package.json to be loaded for Sandpack / Monaco.
   * Note that at least currently, only dependencies are loaded, not devDependencies.
   */
  private parsePackageNames(files: SandpackFiles): string[] {
    const packageJsonCode = this.getPackageJsonCode(files);
    if (!packageJsonCode) {
      return [];
    }

    try {
      const parsed = JSON.parse(packageJsonCode) as PackageJsonFile;
      const names = new Set<string>();
      Object.keys(parsed.dependencies || {}).forEach((name) => names.add(name));
      // Object.keys(parsed.devDependencies || {}).forEach((name) => names.add(name));
      return Array.from(names);
    } catch {
      return [];
    }
  };

  private getFileCode(file: string | SandpackFile): string {
    return typeof file === "string" ? file : file.code;
  }

  private getPackageJsonCode(files: SandpackFiles): string | null {
    const match = Object.entries(files).find(([filePath]) =>
      filePath.toLowerCase() === "/package.json"
    );
    if (!match) {
      return null;
    }
    return this.getFileCode(match[1]);
  };

}
