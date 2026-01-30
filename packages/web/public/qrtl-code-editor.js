const typeToRoute = {
  monaco: "/monaco",
  "monaco-react": "/monaco-react",
  excalidraw: "/excalidraw",
  expression: "/expression",
  function: "/function",
  class: "/class",
  project: "/project",
};

export class QEditorElement extends HTMLElement {
  iframe = null;
  dataValue = undefined;
  onChangeHandler = undefined;
  lastBaseRoute = null;
  iframeLoaded = false;

  messageHandler = (event) => {
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

  static get observedAttributes() {
    return ["type", "mode", "code", "url", "lang", "data"];
  }

  connectedCallback() {
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

  disconnectedCallback() {
    window.removeEventListener("message", this.messageHandler);
    this.iframe?.removeEventListener("load", this.handleIframeLoad);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (name === "data") {
      this.dataValue = this.parseDataAttribute(newValue);
    }

    this.updateIframeSrc();
  }

  get type() {
    return this.getAttribute("type") ?? undefined;
  }

  set type(value) {
    if (value) {
      this.setAttribute("type", value);
    } else {
      this.removeAttribute("type");
    }
  }

  get mode() {
    return this.getAttribute("mode") ?? undefined;
  }

  set mode(value) {
    if (value) {
      this.setAttribute("mode", value);
    } else {
      this.removeAttribute("mode");
    }
  }

  get code() {
    return this.getAttribute("code") ?? undefined;
  }

  set code(value) {
    if (value) {
      this.setAttribute("code", value);
    } else {
      this.removeAttribute("code");
    }
  }

  get url() {
    return this.getAttribute("url") ?? undefined;
  }

  set url(value) {
    if (value) {
      this.setAttribute("url", value);
    } else {
      this.removeAttribute("url");
    }
  }

  get lang() {
    return this.getAttribute("lang") ?? "";
  }

  set lang(value) {
    if (value) {
      this.setAttribute("lang", value);
    } else {
      this.removeAttribute("lang");
    }
  }

  get data() {
    if (this.dataValue) {
      return this.dataValue;
    }
    return this.parseDataAttribute(this.getAttribute("data"));
  }

  set data(value) {
    this.dataValue = value;
    if (value) {
      this.setAttribute("data", JSON.stringify(value));
    } else {
      this.removeAttribute("data");
    }
    this.updateIframeSrc();
  }

  get onChange() {
    return this.onChangeHandler;
  }

  set onChange(handler) {
    this.onChangeHandler = handler;
  }

  /**
   * Sets the known custom properties of the QEditorElement: type, mode, url, code, lang, data.
   * Especially useful in updating the editor from test data.
   */
  applyProps(props) {
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

  parseDataAttribute(value) {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Invalid QEditor data attribute JSON:", error);
      return undefined;
    }
  }

  getBaseRoute() {
    const type = this.type ?? "monaco";
    return typeToRoute[type] || "/monaco";
  }

  handleIframeLoad = () => {
    this.iframeLoaded = true;
  };

  normalizeChangeEvent(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const record = raw;
    const nested = record.data;
    const candidate = (nested && typeof nested === "object") ? nested : record;

    const hasPayload =
      "code" in candidate
      || "data" in candidate
      || "cursorPosition" in candidate;

    if (!hasPayload) {
      return null;
    }

    const payload = candidate;
    if (payload.code !== undefined && typeof payload.code !== "string") {
      return { data: payload.code };
    }
    return payload;
  }

  buildHash() {
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

  updateIframeSrc() {
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

export const defineQEditorElement = (tagName = "q-editor") => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QEditorElement);
};

defineQEditorElement();
