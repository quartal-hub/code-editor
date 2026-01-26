import type { Project } from "@/model/Project";

/**
 * Helper class for project editor related operations.
 */
export class ProjectHelpers {
  private static nodeModules: Partial<Record<"fs" | "path", any>> = {};

  /** Takes a Project object and returns a base64 encoded string. */
  public static projectToBase64(project: Project): string {
    return btoa(JSON.stringify(project));
  }

  /** Takes a base64 encoded string and returns a Project object. */
  public static base64ToProject(base64: string): Project {
    return JSON.parse(atob(base64));
  }

  /** Server-side helper method (mainly for testing and loading initial data) for reading a project from file system. */
  public static readProjectFolderNode(folderPath: string): Project {
    const fs = ProjectHelpers.getNodeModule("fs");
    const path = ProjectHelpers.getNodeModule("path");
    const project: Project = {
      files: {},
      customSetup: {
        dependencies: {},
        devDependencies: {},
      },
    };

    const readFolder = (currentPath: string): void => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true }) as Array<{
        name: string;
        isDirectory: () => boolean;
        isFile: () => boolean;
      }>;
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (ProjectHelpers.getExcludedFolders().has(entry.name)) {
            continue;
          }
          readFolder(path.join(currentPath, entry.name));
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        if (ProjectHelpers.getExcludedFiles().has(entry.name)) {
          continue;
        }
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(folderPath, fullPath).split(path.sep).join("/");
        const fileKey = `/${relativePath}`;
        const code = fs.readFileSync(fullPath, "utf8") as string;
        project.files[fileKey] = { code };

        if (entry.name === "package.json") {
          ProjectHelpers.applyPackageJson(project, code);
        }
      }
    };

    readFolder(folderPath);
    return project;
  }

  private static getExcludedFolders(): Set<string> {
    return new Set([
      "dist",
      "node_modules",
      ".git",
      ".vscode",
      ".idea",
      ".env",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local",
    ]);
  }

  private static getExcludedFiles(): Set<string> {
    return new Set([
      ".gitignore",
      "pnpm-lock.yaml",
      ".env",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local",
    ]);
  }

  /** Browser-side helper method for reading a project from file system using the File System Access API. */
  public static async readProjectFolderBrowser(): Promise<Project> {
    const picker = (globalThis as any).showDirectoryPicker as
      | (() => Promise<{ name: string; entries: () => AsyncIterable<[string, any]> }>)
      | undefined;
    if (!picker) {
      throw new Error("File System Access API is not available in this browser.");
    }

    const project: Project = {
      files: {},
      customSetup: {
        dependencies: {},
        devDependencies: {},
      },
    };

    const rootHandle = await picker() as { name: string; entries: () => AsyncIterable<[string, any]> };

    const readDirectory = async (dirHandle: { name: string; entries: () => AsyncIterable<[string, any]> }, basePath: string): Promise<void> => {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === "directory") {
          if (ProjectHelpers.getExcludedFolders().has(name)) {
            continue;
          }
          await readDirectory(handle, `${basePath}/${name}`);
          continue;
        }
        if (handle.kind !== "file") {
          continue;
        }
        if (ProjectHelpers.getExcludedFiles().has(name)) {
          continue;
        }
        const file = await handle.getFile();
        const code = await file.text();
        const fileKey = `${basePath}/${name}`;
        project.files[fileKey] = { code };

        if (name === "package.json") {
          ProjectHelpers.applyPackageJson(project, code);
        }
      }
    };

    await readDirectory(rootHandle, "");
    return project;
  }

  public static setNodeModules(modules: { fs?: any; path?: any }): void {
    if (modules.fs) {
      ProjectHelpers.nodeModules.fs = modules.fs;
    }
    if (modules.path) {
      ProjectHelpers.nodeModules.path = modules.path;
    }
  }

  private static getNodeModule(moduleName: "fs" | "path"): any {
    const globalAny = globalThis as any;
    if (ProjectHelpers.nodeModules[moduleName]) {
      return ProjectHelpers.nodeModules[moduleName];
    }
    if (moduleName === "fs" && globalAny.fs) {
      return globalAny.fs;
    }
    if (moduleName === "path" && globalAny.path) {
      return globalAny.path;
    }
    if (typeof globalAny.require === "function") {
      return globalAny.require(moduleName);
    }
    throw new Error(`Node module "${moduleName}" is not available in this environment.`);
  }

  private static applyPackageJson(project: Project, packageJsonContent: string): void {
    try {
      const parsed = JSON.parse(packageJsonContent) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      if (!project.customSetup) {
        project.customSetup = {};
      }
      if (!project.customSetup.dependencies) {
        project.customSetup.dependencies = {};
      }
      if (!project.customSetup.devDependencies) {
        project.customSetup.devDependencies = {};
      }
      if (parsed.dependencies) {
        Object.assign(project.customSetup.dependencies, parsed.dependencies);
      }
      if (parsed.devDependencies) {
        Object.assign(project.customSetup.devDependencies, parsed.devDependencies);
      }
    } catch {
      // Ignore invalid package.json files.
    }
  }
}