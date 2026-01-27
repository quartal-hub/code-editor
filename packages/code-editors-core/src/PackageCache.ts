/**
 * Loads and caches package type definitions (`.d.ts`) from local or CDN sources.
 * The default loading is from the web server's public folder, but you can override the path for specific packages.
 * Path in public folder is "/packages/{packageName}/index.d.ts".
 */
export class PackageCache {

  /**
   * The base location of the package type files.
   * Default is "/packages", which means the type files are loaded from "/packages/{packageName}/index.d.ts" in the web server's public folder.
   */
  public packageLocationBase: string = "/packages";

  private typePathOverrides: Record<string, string> = {
    "@salaxy/core": "/packages/@salaxy/core/salaxy-lib-core.d.ts",
    "@salaxy/expressions": "/packages/@salaxy/expressions/salaxy-lib-expressions.d.ts",
  };

  private readonly cache = new Map<string, Promise<string | null>>();

  /**
   * Create a cache with optional base paths and per-package overrides.
   * @param typePathOverrides Define special paths for packages.
   * Example: { "@salaxy/core": "https://some-cdn.com/@foo/faa/index.d.ts" }
   */
  constructor(typePathOverrides?: Record<string, string>) {
    this.typePathOverrides = { ...this.typePathOverrides, ...typePathOverrides };
  }

  /**
   * Gets the type file URL for a package: The type file can be loaded from here.
   * This is `${packageLocationBase}/${packageName}/index.d.ts` if no override is provided.
   * @param packageName - The name of the package.
   * @returns The URL of the type file for the package.
   */
  public getTypeFileUrl(packageName: string): string {
    if (this.typePathOverrides[packageName]) {
      return this.typePathOverrides[packageName];
    }
    return `${this.packageLocationBase}/${packageName}/index.d.ts`;
  }

  /**
   * Gets the Monaco file URI for a package: The type file can be loaded from here.
   * This is `file:///node_modules/{packageName}/index.d.ts`.
   * @param packageName - The name of the package.
   * @returns The Monaco file URI for the package.
   */
  public getMonacoFileUri(packageName: string): string {
    return `file:///node_modules/${packageName}/index.d.ts`;
  }

  /**
   * Fetch type definitions for a package.
   * Results are cached to avoid duplicate network requests.
   */
  public async getTypes(packageName: string): Promise<string | null> {
    const existing = this.cache.get(packageName);
    if (existing) {
      return existing;
    }
    const loader = this.loadTypes(packageName);
    this.cache.set(packageName, loader);
    return loader;
  }

  /** Clear cached types, or only the entry for a single package. */
  public clear(packageName?: string): void {
    if (packageName) {
      this.cache.delete(packageName);
      return;
    }
    this.cache.clear();
  }

  private async loadTypes(packageName: string): Promise<string | null> {
    const url = this.getTypeFileUrl(packageName);
    return await this.fetchTypes(url);
  }

  private async fetchTypes(path: string): Promise<string | null> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        return null;
      }
      return await response.text();
    } catch {
      return null;
    }
  }
}