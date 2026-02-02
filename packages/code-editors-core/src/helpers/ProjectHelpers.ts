import type { Project } from "@quartal/code-editors-core";

/**
 * Helper class for project editor related operations.
 */
export class ProjectHelpers {

  /** Takes a Project object and returns a base64 encoded string. */
  public static projectToBase64(project: Project): string {
    return btoa(JSON.stringify(project));
  }

  /** Takes a base64 encoded string and returns a Project object. */
  public static base64ToProject(base64: string): Project {
    return JSON.parse(atob(base64));
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