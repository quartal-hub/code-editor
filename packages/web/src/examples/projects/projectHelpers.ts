import type { Project } from "@/model/Project";

/**
 * Builds a Project from a flat map of `path -> file content`. Keeps example
 * declarations readable (one template literal per file) instead of nested
 * `{ code: ... }` objects everywhere.
 */
export function filesAsProject(
  files: Record<string, string>,
  options?: { customSetup?: Project["customSetup"]; template?: string },
): Project {
  const projectFiles: Project["files"] = {};
  for (const [path, code] of Object.entries(files)) {
    projectFiles[path] = { code };
  }
  return {
    files: projectFiles,
    customSetup: options?.customSetup,
    template: options?.template,
  };
}
