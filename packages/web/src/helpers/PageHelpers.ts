import type { QEditorChangeEventData, QEditorProps } from "@quartal/code-editors-core";

/** Miscellaneous helpers for rendering the pages based on the components. */
export class PageHelpers {

  /**
   * Updates a value to the hash.
   * Currently, this is always "code" (which is modified), but future impelementations may support other keys to modify.
   * @param key The key to update. Typically "code".
   * @param value The value to update the key with.
   */
  public static updateToHash(key: string, value: string): void {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    hashParams.set(key, value);
    window.location.hash = hashParams.toString();
  }

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
   * Parses query parameters for non-hash values (view/readOnly).
   */
  public static getQueryProps(): Pick<QEditorProps, "view" | "readOnly"> {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") ?? undefined;
    const readOnlyParam = (params.get("readOnly") ?? params.get("read-only") ?? "").toLowerCase().trim();
    const readOnly = readOnlyParam === "" ? undefined : (readOnlyParam === "true" || readOnlyParam === "1");
    return { view, readOnly };
  }

  /**
   * Parses both query and hash params into QEditorProps.
   */
  public static getPropsFromLocation(type: QEditorProps["type"]): QEditorProps {
    const hashProps = PageHelpers.getPropsFromHash(type);
    const queryProps = PageHelpers.getQueryProps();
    return {
      ...hashProps,
      ...queryProps,
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
      // Site-relative URLs (e.g. "/examples/x.json") live under the base path when the site is not at the domain root.
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const prefix = base && !url.startsWith(`${base}/`) ? base : "";
      url = window.location.origin + prefix + url;
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

  /**
   * Sends a message to the parent iframe that the editor is ready (only if in iframe).
   */
  public static sendIframeReadyMessage(): void {
    if (PageHelpers.isInIframe()) {
      window.parent.postMessage({ type: "editor-ready" }, "*");
    }
  }

  /**
   * Sends a message to the parent iframe that the code has changed (only if in iframe).
   * @param data The data to send.
   */
  public static sendOnChangeMessage(data: Partial<QEditorChangeEventData>): void {
    if (PageHelpers.isInIframe()) {
      const message: QEditorChangeEventData = {
        ...data,
        type: "on-change",
      };
      window.parent.postMessage(message, "*");
    }
  }

  /**
   * Sends a message to the parent iframe when a link is opened (only if in iframe).
   * @param data The link and detail data to send.
   */
  public static sendOnLinkOpenMessage(data: { link?: string; detail?: { nativeEvent?: Record<string, unknown> } }): void {
    if (PageHelpers.isInIframe()) {
      window.parent.postMessage({ type: "on-link-open", ...data }, "*");
    }
  }

  /**
   * Extracts link-open details from a native event wrapper.
   */
  public static getLinkOpenDetail(event: unknown): { nativeEvent: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; button: number } } | undefined {
    const nativeEvent = (event as { detail?: { nativeEvent?: MouseEvent } })?.detail?.nativeEvent;
    if (!nativeEvent) {
      return undefined;
    }
    return {
      nativeEvent: {
        ctrlKey: nativeEvent.ctrlKey,
        metaKey: nativeEvent.metaKey,
        shiftKey: nativeEvent.shiftKey,
        altKey: nativeEvent.altKey,
        button: nativeEvent.button,
      },
    };
  }

  /** Checks if the current page is in an iframe. */
  public static isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      return false;
    }
  }

  /** Adds a listener to the message event (only if in iframe). */
  public static addParentListener(callback: (event: MessageEvent) => void): void {
    if (PageHelpers.isInIframe()) {
      window.addEventListener("message", callback);
    }
  }

  /** Removes a listener from the message event (only if in iframe). */
  public static removeParentListener(callback: (event: MessageEvent) => void): void {
    if (PageHelpers.isInIframe()) {
      window.removeEventListener("message", callback);
    }
  }

  /** Adds a listener to the hash change event (also listens to popstate for browser back/forward). */
  public static addHashChangeListener(callback: () => void): void {
    // Primary event for hash changes
    window.addEventListener("hashchange", callback);
    // Also listen to popstate for browser back/forward
    window.addEventListener("popstate", callback);
  }

  /** Removes a listener from the hash change event / popstate event. */
  public static removeHashChangeListener(callback: () => void): void {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  }

}