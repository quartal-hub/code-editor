import type { QEditorProps } from "@quartal/code-editors-core";

/** Msc helpers for rendering the pages based on the components. */
export class PageHelpers {

  /**
   * Parses the URL hash and returns an object with the QEditorProps interface.
   * Uses hash parameters for mutable values to avoid iframe reloads.
   * @param type The type of editor to use. May later be to support editor specific logic. Hardcoded to "type".
   * @returns Object with known hash parameters as keys and their values as values.
   */
  public static getPropsFromHash(type: QEditorProps["type"]): QEditorProps {
    const hash = window.location.hash.substring(1); // Remove the '#' character
    const params = new URLSearchParams(hash);
    const code = params.get("code") ?? "";
    const url = params.get("url") ?? undefined;
    const lang = params.get("lang") ?? undefined;
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
    return { code, url, lang, data, type };
  }

  /**
   * Parses query parameters for non-hash values (mode/view/readOnly).
   */
  public static getQueryProps(): Pick<QEditorProps, "mode" | "view" | "readOnly"> {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") ?? undefined;
    const view = params.get("view") ?? undefined;
    const readOnlyParam = (params.get("readOnly") ?? params.get("read-only") ?? "").toLowerCase().trim();
    const readOnly = readOnlyParam === "" ? undefined : (readOnlyParam === "true" || readOnlyParam === "1");
    return { mode: mode as QEditorProps["mode"], view, readOnly };
  }

  /**
   * Parses both query and hash params into QEditorProps.
   */
  public static getPropsFromLocation(type: QEditorProps["type"]): QEditorProps {
    const hashProps = PageHelpers.getPropsFromHash(type);
    const queryProps = PageHelpers.getQueryProps();
    const mode = queryProps.mode ?? PageHelpers.getDefaultMode();
    return {
      ...hashProps,
      ...queryProps,
      mode,
      type,
    };
  }

  /**
   * Fetches a file from a URL and returns the content as a string.
   * Uses a CORS proxy to avoid CORS issues.
   * 
   * @param url The URL to fetch the code from.
   * @returns The content of the file as a string.
   * @throws Error if the URL is not provided or is not a valid URL.
   * @throws Error if the URL is a HTML page, not a text file.
   * @throws Error if the fetch fails.
   */
  public static async fetchCodeFromUrl(url: string | undefined): Promise<string> {
    if (!url) {
      throw new Error('No URL provided');
    }
    if (url.startsWith("/")) {
      url = window.location.origin + url;
    }
    if (!url.startsWith("http")) {
      throw new Error(`Invalid URL: ${url}. The URL must start with http or https because it is proxied through a CORS proxy.`);
    }

    // HACK: Switch to our own proxy service => This will not work in production.

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch code from URL: ${url}`);
    }
    const contents = await response.text();
    if (!contents) {
      throw new Error(`Failed to fetch code from URL: ${url}. The URL is a HTML page, not a text file.`);
    }
    return contents;
  }

  private static getDefaultMode(): QEditorProps["mode"] {
    if (PageHelpers.isInIframe()) {
      return "events";
    }
    return "browser-files";
  }

  private static isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
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
    if (base64Data) hashParams.set("data", base64Data);
    const hash = hashParams.toString();
    window.location.hash = hash ? `#${hash}` : "";
  }

}