import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import type { QEditorProps } from "./model";

const typeToRoute: Record<QEditorProps["type"], string> = {
  monaco: "/monaco",
  "monaco-react": "/monaco-react",
  excalidraw: "/excalidraw",
  expression: "/expression",
  function: "/function",
  class: "/class",
  project: "/project",
};

type ChangeHandler = (value: QEditorChangeEventData) => void;

export class QEditorElement extends HTMLElement {
  private iframe: HTMLIFrameElement | null = null;
  private dataValue: Record<string, unknown> | undefined;
  private onChangeHandler: ChangeHandler | undefined;
  private lastBaseRoute: string | null = null;
  private iframeLoaded = false;

  private readonly messageHandler = (event: MessageEvent): void => {
    if (this.iframe?.contentWindow !== event.source) {
      return;
    }

    const payload = this.normalizeChangeEvent(event.data);
    if (!payload) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("qeditor-change", {
        detail: payload,
      }),
    );
    if (this.onChangeHandler) {
      this.onChangeHandler(payload);
    }
  };

  public static get observedAttributes(): string[] {
    return ["type", "mode", "code", "url", "lang", "data"];
  }

  public connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    if (!this.iframe) {
      this.iframe = document.createElement("iframe");
      this.iframe.style.width = "100%";
      this.iframe.style.height = "100%";
      this.iframe.style.border = "none";
      this.iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms", "allow-popups");
      this.iframe.addEventListener("load", this.handleIframeLoad);
      this.shadowRoot?.appendChild(this.iframe);
    }

    window.addEventListener("message", this.messageHandler);
    this.updateIframeSrc();
  }

  public disconnectedCallback(): void {
    window.removeEventListener("message", this.messageHandler);
    this.iframe?.removeEventListener("load", this.handleIframeLoad);
  }

  public attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === "data") {
      this.dataValue = this.parseDataAttribute(newValue);
    }

    this.updateIframeSrc();
  }

  public get type(): QEditorProps["type"] | undefined {
    return (this.getAttribute("type") as QEditorProps["type"] | null) ?? undefined;
  }

  public set type(value: QEditorProps["type"] | undefined) {
    if (value) {
      this.setAttribute("type", value);
    } else {
      this.removeAttribute("type");
    }
  }

  public get mode(): string | undefined {
    return this.getAttribute("mode") ?? undefined;
  }

  public set mode(value: string | undefined) {
    if (value) {
      this.setAttribute("mode", value);
    } else {
      this.removeAttribute("mode");
    }
  }

  public get code(): string | undefined {
    return this.getAttribute("code") ?? undefined;
  }

  public set code(value: string | undefined) {
    if (value) {
      this.setAttribute("code", value);
    } else {
      this.removeAttribute("code");
    }
  }

  public get url(): string | undefined {
    return this.getAttribute("url") ?? undefined;
  }

  public set url(value: string | undefined) {
    if (value) {
      this.setAttribute("url", value);
    } else {
      this.removeAttribute("url");
    }
  }

  public get lang(): string {
    return this.getAttribute("lang") ?? "";
  }

  public set lang(value: string) {
    if (value) {
      this.setAttribute("lang", value);
    } else {
      this.removeAttribute("lang");
    }
  }

  public get data(): Record<string, unknown> | undefined {
    if (this.dataValue) {
      return this.dataValue;
    }
    return this.parseDataAttribute(this.getAttribute("data"));
  }

  public set data(value: Record<string, unknown> | undefined) {
    this.dataValue = value;
    if (value) {
      this.setAttribute("data", JSON.stringify(value));
    } else {
      this.removeAttribute("data");
    }
    this.updateIframeSrc();
  }

  public get onChange(): ChangeHandler | undefined {
    return this.onChangeHandler;
  }

  public set onChange(handler: ChangeHandler | undefined) {
    this.onChangeHandler = handler;
  }

  /**
   * Sets the known custom properties of the QEditorElement: type, mode, url, code, lang, data.
   * Especially useful in updating the editor from test data.
   */
  public applyProps(props: Partial<QEditorProps>): void {
    if (!props) {
      return;
    }

    this.type = props.type;
    this.mode = props.mode || undefined;
    this.url = props.url;
    this.code = props.code;
    this.lang = props.lang || "";
    this.data = props.data;
  }

  private parseDataAttribute(value: string | null): Record<string, unknown> | undefined {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch (error) {
      console.warn("Invalid QEditor data attribute JSON:", error);
      return undefined;
    }
  }

  private getBaseRoute(): string {
    const type = this.type ?? "monaco";
    return typeToRoute[type] || "/monaco";
  }

  private handleIframeLoad = (): void => {
    this.iframeLoaded = true;
  };

  private normalizeChangeEvent(raw: unknown): QEditorChangeEventData | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const record = raw as Record<string, unknown>;
    const nested = record.data;
    const candidate = (nested && typeof nested === "object") ? (nested as Record<string, unknown>) : record;

    const hasPayload =
      "code" in candidate
      || "data" in candidate
      || "cursorPosition" in candidate;

    if (!hasPayload) {
      return null;
    }

    const payload = candidate as QEditorChangeEventData;
    if (payload.code !== undefined && typeof payload.code !== "string") {
      return { data: payload.code };
    }
    return payload;
  }

  private buildHash(): string {
    const hashParams = new URLSearchParams();
    const data = this.data;
    const base64Data = data ? btoa(JSON.stringify(data || {})) : "";
    const mode = this.mode ?? "default";

    if (this.code) hashParams.set("code", this.code);
    if (this.url) hashParams.set("url", this.url);
    if (this.lang) hashParams.set("lang", this.lang);
    if (mode) hashParams.set("mode", mode);
    if (base64Data) hashParams.set("data", base64Data);

    return hashParams.toString();
  }

  private updateIframeSrc(): void {
    if (!this.iframe) {
      return;
    }

    const baseRoute = this.getBaseRoute();
    const hash = this.buildHash();
    const src = `${baseRoute}${hash ? `#${hash}` : ""}`;
    this.iframe.title = `${this.type ?? "monaco"} Editor`;

    if (!this.iframeLoaded || !this.iframe.contentWindow || this.lastBaseRoute !== baseRoute) {
      this.iframe.src = src;
      this.lastBaseRoute = baseRoute;
      return;
    }

    try {
      this.iframe.contentWindow.location.hash = hash ? `#${hash}` : "";
    } catch (error) {
      console.warn("Could not update iframe hash directly:", error);
      this.iframe.src = src;
    }
  }
}

export const defineQEditorElement = (tagName = "q-editor"): void => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QEditorElement);
};
