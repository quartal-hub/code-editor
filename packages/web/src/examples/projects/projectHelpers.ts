import type { FilesData } from "@/model/FilesData";

/**
 * Builds the data of the multi-file editor from a flat map of `address -> file content`. Keeps
 * example declarations readable (one template literal per file).
 */
export function filesAsData(files: Record<string, string>, options?: { active?: string }): FilesData {
  return { files, active: options?.active };
}
