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
  lastQuery = null;
  iframeLoaded = false;
  attributeUpdateTimer = null;
  pendingIframeUpdate = false;
  pendingSetDataUpdate = false;

  messageHandler = (event) => {
    if (this.iframe?.contentWindow !== event.source) {
      return;
    }

    const raw = event.data;
    if (!raw || typeof raw !== "object") {
      return;
    }
    if (raw.type === "editor-ready") {
      if (this.mode === "events") {
        this.sendSetData();
      }
      return;
    }

    const payload = this.normalizeChangeEvent(raw);
    if (!payload) {
      return;
    }
    if (this.onChangeHandler) {
      this.onChangeHandler(payload);
    }
  };

  static get observedAttributes() {
    return ["type", "mode", "view", "read-only", "code", "url", "lang", "data"];
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
    if (this.attributeUpdateTimer) {
      clearTimeout(this.attributeUpdateTimer);
      this.attributeUpdateTimer = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (name === "data") {
      this.dataValue = this.parseDataAttribute(newValue);
    }

    const shouldSendSetData =
      (name === "code" || name === "data") && this.mode === "events" && this.iframeLoaded;
    if (shouldSendSetData) {
      this.pendingSetDataUpdate = true;
    } else {
      this.pendingIframeUpdate = true;
    }

    this.scheduleAttributeUpdate();
  }

  scheduleAttributeUpdate() {
    if (this.attributeUpdateTimer) {
      clearTimeout(this.attributeUpdateTimer);
    }

    this.attributeUpdateTimer = setTimeout(() => {
      this.attributeUpdateTimer = null;

      if (this.pendingIframeUpdate) {
        this.pendingIframeUpdate = false;
        this.pendingSetDataUpdate = false;
        this.updateIframeSrc();
        return;
      }

      if (this.pendingSetDataUpdate) {
        this.pendingSetDataUpdate = false;
        this.sendSetData();
      }
    }, 100);
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

  get view() {
    return this.getAttribute("view") ?? undefined;
  }

  set view(value) {
    if (value) {
      this.setAttribute("view", value);
    } else {
      this.removeAttribute("view");
    }
  }

  get readOnly() {
    return this.hasAttribute("read-only");
  }

  set readOnly(value) {
    if (value) {
      this.setAttribute("read-only", "");
    } else {
      this.removeAttribute("read-only");
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
    this.view = props.view || undefined;
    this.readOnly = Boolean(props.readOnly);
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
    if (this.mode === "events") {
      this.sendSetData();
    }
  };

  normalizeChangeEvent(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const record = raw;
    const candidate = (record.type && typeof record.type === "string")
      ? record
      : (record.data && typeof record.data === "object" && record.data.type)
        ? record.data
        : record;

    if (candidate.type !== "on-change") {
      return null;
    }

    const hasPayload =
      "code" in candidate
      || "data" in candidate
      || "cursorPosition" in candidate;

    if (!hasPayload) {
      return null;
    }

    if (candidate.code !== undefined && typeof candidate.code !== "string") {
      return { type: "on-change", data: candidate.code };
    }
    return candidate;
  }

  buildHash() {
    const hashParams = new URLSearchParams();
    const data = this.data;
    const base64Data = data ? btoa(JSON.stringify(data || {})) : "";
    const mode = this.mode;

    if (mode === "events" || mode === "browser-files") {
      return "";
    }

    const includeCode = !mode || mode === "code";
    const includeUrl = !mode || mode === "url";
    const includeData = !mode || mode === "code";

    if (includeCode && this.code) hashParams.set("code", this.code);
    if (includeUrl && this.url) hashParams.set("url", this.url);
    if ((includeCode || includeUrl) && this.lang) hashParams.set("lang", this.lang);
    if (includeData && base64Data) hashParams.set("data", base64Data);

    return hashParams.toString();
  }

  buildQuery() {
    const params = new URLSearchParams();
    if (this.mode) params.set("mode", this.mode);
    if (this.view) params.set("view", this.view);
    if (this.readOnly) params.set("readOnly", "true");
    return params.toString();
  }

  sendSetData() {
    if (!this.iframe?.contentWindow) {
      return;
    }
    const payload = {
      type: "set-data",
      code: this.code,
      data: this.data,
    };
    this.iframe.contentWindow.postMessage(payload, "*");
  }

  updateIframeSrc() {
    if (!this.iframe) {
      return;
    }

    const baseRoute = this.getBaseRoute();
    const hash = this.buildHash();
    const query = this.buildQuery();
    const src = `${baseRoute}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
    console.log("Updating iframe src to:", src);

    this.iframe.title = `${this.type ?? "monaco"} Editor`;

    if (
      !this.iframeLoaded
      || !this.iframe.contentWindow
      || this.lastBaseRoute !== baseRoute
      || this.lastQuery !== query
    ) {
      this.iframe.src = src;
      this.lastBaseRoute = baseRoute;
      this.lastQuery = query;
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

export const defineQEditorElement = (tagName = "qrtl-code-editor") => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QEditorElement);
};

defineQEditorElement();
