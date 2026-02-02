import type { QEditorProps } from "@quartal/code-editors-core";

export class PageHelpers {

  /**
   * Parses the URL hash and returns an object with the QEditorProps interface.
   * Uses hash parameters instead of query parameters to avoid iframe reloads.
   * @param type The type of editor to use. May later be to support editor specific logic. Hardcoded to "type".
   * @returns Object with known hash parameters as keys and their values as values.
   */
  public static getPropsFromHash(type: QEditorProps["type"]): QEditorProps {
    const hash = window.location.hash.substring(1); // Remove the '#' character
    const params = new URLSearchParams(hash);
    const code = params.get("code") ?? "";
    const url = params.get("url") ?? undefined;
    const lang = params.get("lang") ?? undefined;
    const mode = params.get("mode") ?? undefined;
    let data: Record<string, unknown> | undefined = undefined;
    const dataStr = params.get("data");
    if (dataStr) {
      try {
        // Attempt base64 decode and JSON parse
        data = JSON.parse(atob(dataStr));
      } catch {
        data = undefined;
      }
    }
    return { code, url, lang, mode, data, type };
  }

  /**
   * Updates the hash with the new code.
   * @param type The type of editor to use. May later be to support editor specific logic.
   * @param code The new code to update the hash with. Other parameters are kept the same as the current props.
   */
  public static updateHash(type: QEditorProps["type"], code: string): void {
    const currentProps = PageHelpers.getPropsFromHash(type);
    const base64Data = currentProps.data ? btoa(JSON.stringify(currentProps.data || {})) : "";
    const hashParams = new URLSearchParams();
    hashParams.set("code", code);
    if (currentProps.lang) hashParams.set("lang", currentProps.lang);
    if (currentProps.mode) hashParams.set("mode", currentProps.mode);
    if (base64Data) hashParams.set("data", base64Data);
    const hash = hashParams.toString();
    window.location.hash = hash ? `#${hash}` : "";
  }

}