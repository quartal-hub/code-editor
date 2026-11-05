import { PackageCache } from "../code/PackageCache";
import type { MonacoInstance } from "../helpers/MonacoHelper";

/**
 * Loads the type definitions of a project's `package.json` dependencies and registers them with
 * Monaco's TypeScript and JavaScript services (`addExtraLib`), so imports of those packages complete.
 * Only `dependencies` are read.
 */
export class MonacoPackages {
  private readonly monaco: MonacoInstance;
  private readonly loaded = new Map<string, { dispose: () => void }>();
  private readonly cache: PackageCache;

  /**
   * @param monaco The Monaco API.
   * @param cache Where the type files come from. Default: the web server's `/packages` folder.
   */
  constructor(monaco: MonacoInstance, cache: PackageCache = new PackageCache()) {
    this.monaco = monaco;
    this.cache = cache;
  }

  /** The names of the packages in the `dependencies` of a `package.json` text; empty if it is not valid. */
  public static parseDependencies(packageJson: string | undefined): string[] {
    if (!packageJson) {
      return [];
    }
    try {
      const parsed = JSON.parse(packageJson) as { dependencies?: Record<string, string> };
      return Object.keys(parsed.dependencies ?? {});
    } catch {
      return [];
    }
  }

  /** Makes the loaded type definitions match the dependencies: loads new ones, forgets removed ones. */
  public sync(packageJson: string | undefined): void {
    const names = MonacoPackages.parseDependencies(packageJson);
    const wanted = new Set(names);
    for (const [name, registration] of [...this.loaded]) {
      if (!wanted.has(name)) {
        registration.dispose();
        this.loaded.delete(name);
      }
    }
    for (const name of names) {
      if (!this.loaded.has(name)) {
        void this.load(name);
      }
    }
  }

  /** Forgets every loaded type definition. */
  public dispose(): void {
    this.loaded.forEach((r) => r.dispose());
    this.loaded.clear();
  }

  private async load(name: string): Promise<void> {
    // Mark as loading, so a second sync does not start another fetch.
    this.loaded.set(name, { dispose: () => undefined });
    const types = await this.cache.getTypes(name);
    if (!this.loaded.has(name)) {
      return; // Removed while loading.
    }
    if (!types) {
      return;
    }
    const uri = this.cache.getMonacoFileUri(name);
    const ts = this.monaco.languages.typescript;
    const typescript = ts.typescriptDefaults.addExtraLib(types, uri);
    const javascript = ts.javascriptDefaults.addExtraLib(types, uri);
    this.loaded.set(name, { dispose: () => { typescript.dispose(); javascript.dispose(); } });
  }
}
