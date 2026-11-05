/** A folder read from the user's disk: file text by address (`/{folder}/...`), in the order found. */
export type FolderFiles = Record<string, string>;

/** Browser-side helpers for reading a folder from the user's computer. */
export class FolderHelpers {
  private static readonly excludedFolders = new Set(["dist", "node_modules", ".git", ".vscode", ".idea"]);

  private static readonly excludedFiles = new Set([
    ".gitignore",
    "pnpm-lock.yaml",
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
  ]);

  /** Files that are not text; reading them as text would only produce noise. */
  private static readonly binaryExtensions = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|eot|mp[34]|wasm)$/i;

  /**
   * Reads a folder the user picks, using the File System Access API.
   * `node_modules`, `.git`, build output, lock files, `.env` files and binary files are left out.
   * @returns The text of the files, by address starting from the folder's contents (`/package.json`).
   * @throws Error if the browser has no File System Access API.
   */
  public static async readFolderBrowser(): Promise<FolderFiles> {
    type Handle = { kind: string; name: string; getFile?: () => Promise<{ text: () => Promise<string> }>; entries?: () => AsyncIterable<[string, Handle]> };
    const picker = (globalThis as unknown as { showDirectoryPicker?: () => Promise<Handle> }).showDirectoryPicker;
    if (!picker) {
      throw new Error("File System Access API is not available in this browser.");
    }
    const files: FolderFiles = {};
    const read = async (dir: Handle, base: string): Promise<void> => {
      for await (const [name, handle] of dir.entries!()) {
        if (handle.kind === "directory") {
          if (!FolderHelpers.excludedFolders.has(name)) {
            await read(handle, `${base}/${name}`);
          }
        } else if (handle.kind === "file" && !FolderHelpers.excludedFiles.has(name) && !FolderHelpers.binaryExtensions.test(name)) {
          files[`${base}/${name}`] = await (await handle.getFile!()).text();
        }
      }
    };
    await read(await picker.call(globalThis), "");
    return files;
  }
}
