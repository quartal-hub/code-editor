/**
 * The Quartal Hub Code UI as custom elements. Each element is an iframe that loads one of the editors and
 * hides the `postMessage` protocol of the editor pages behind attributes, methods and events.
 *
 * - `<qrtl-editor>`: any editor, driven by attributes, methods and events. See the table on the About page.
 * - `<qrtl-editor-code>`: any editor with the code in the URL hash. Shows the code, reports no changes.
 * - `<qrtl-editor-url>`: any editor with the code fetched from a URL. Shows the code, reports no changes.
 *
 * Messages that the page cannot take yet are held and sent when it announces itself (`ready`).
 */

const typeToRoute = {
  monaco: "/monaco",
  markdown: "/markdown",
  "markdown-hybrid": "/markdown-hybrid",
  expression: "/expression",
  class: "/class",
  files: "/files",
  excalidraw: "/excalidraw",
};

/** Editors that take a read-only change as a message instead of reloading the page. */
const liveReadOnly = new Set(["monaco", "files"]);

const defaultEditorBaseUrl = (() => {
  try {
    return new URL(".", import.meta.url).href.replace(/\/$/, "");
  } catch (error) {
    console.warn("Could not resolve editor base URL:", error);
    return "";
  }
})();

const getEditorBaseUrl = (element) => {
  const override = element?.getAttribute?.("base-url");
  if (override) {
    return override.replace(/\/$/, "");
  }
  return defaultEditorBaseUrl;
};

const buildEditorUrl = (element, path) => {
  const base = getEditorBaseUrl(element);
  if (!base) {
    return path;
  }
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
};

/** A message may arrive as the object itself or wrapped in `{ data: message }`. */
const unwrapMessage = (raw) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  if (typeof raw.type === "string") {
    return raw;
  }
  if (raw.data && typeof raw.data === "object" && typeof raw.data.type === "string") {
    return raw.data;
  }
  return null;
};

/** Messages are copied to plain data: a proxy (Vue, MobX) or a function in them cannot be posted. */
const toPlain = (message) => JSON.parse(JSON.stringify(message));

const createFrame = (element) => {
  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.sandbox.add("allow-scripts", "allow-same-origin", "allow-forms", "allow-popups");
  element.shadowRoot?.appendChild(iframe);
  return iframe;
};

/** Reads an attribute that is a string; sets or removes it. */
const stringProperty = (name, fallback) => ({
  get() {
    return this.getAttribute(name) ?? fallback;
  },
  set(value) {
    if (value) {
      this.setAttribute(name, value);
    } else {
      this.removeAttribute(name);
    }
  },
});

/** Reads an attribute that is a flag; sets or removes it. */
const flagProperty = (name) => ({
  get() {
    return this.hasAttribute(name);
  },
  set(value) {
    if (value) {
      this.setAttribute(name, "");
    } else {
      this.removeAttribute(name);
    }
  },
});

export class QrtlEditorElement extends HTMLElement {
  iframe = null;
  dataValue = undefined;
  lastBaseRoute = null;
  lastQuery = null;
  ready = false;
  protocol = undefined;
  queue = [];
  attributeUpdateTimer = null;
  pendingIframeUpdate = false;
  pendingSetDataUpdate = false;
  pendingReadOnly = false;
  settingData = false;

  messageHandler = (event) => {
    if (!this.iframe || this.iframe.contentWindow !== event.source) {
      return;
    }
    const message = unwrapMessage(event.data);
    if (!message) {
      return;
    }
    switch (message.type) {
      case "editor-ready":
        this.handleReady(message);
        break;
      case "on-change":
        if ("code" in message || "data" in message || "cursorPosition" in message) {
          this.dispatch("change", message.code !== undefined && typeof message.code !== "string" ? { type: "on-change", data: message.code } : message);
        }
        break;
      case "on-link-open":
        if ("link" in message || "detail" in message) {
          this.dispatch("link-open", message);
        }
        break;
      case "file-change":
        this.dispatch("file-change", { address: message.address, text: message.text, version: message.version });
        break;
      case "file-command":
        if (message.command === "save") {
          this.dispatch("file-save", { address: message.address });
        }
        break;
      case "file-request":
        this.dispatch("file-request", { address: message.address, selection: message.selection });
        break;
      case "file-focus":
        this.dispatch("file-focus", { address: message.address });
        break;
    }
  };

  static get observedAttributes() {
    return ["type", "view", "read-only", "code", "lang", "data", "schema", "base-url"];
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (!this.iframe) {
      this.iframe = createFrame(this);
    }
    window.addEventListener("message", this.messageHandler);
    this.updateIframeSrc();
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.messageHandler);
    if (this.attributeUpdateTimer) {
      clearTimeout(this.attributeUpdateTimer);
      this.attributeUpdateTimer = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (name === "data" && !this.settingData) {
      this.dataValue = this.parseDataAttribute(newValue);
    }
    if (name === "read-only" && this.ready && liveReadOnly.has(this.type ?? "monaco")) {
      this.pendingReadOnly = true;
    } else if ((name === "code" || name === "data" || name === "schema") && this.ready) {
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
        this.pendingReadOnly = false;
        this.updateIframeSrc();
        return;
      }
      if (this.pendingReadOnly) {
        this.pendingReadOnly = false;
        this.lastQuery = this.buildQuery();
        // The files editor takes options; the single-file Monaco page takes the flag with the data.
        if (this.type === "files") {
          this.setOptions({ readOnly: this.readOnly });
        } else {
          this.setData({ readOnly: this.readOnly });
        }
      }
      if (this.pendingSetDataUpdate) {
        this.pendingSetDataUpdate = false;
        this.sendSetData();
      }
    }, 100);
  }

  // ---------------------------------------------------------------- properties

  /** Type of the editor: monaco (default), markdown, markdown-hybrid, expression, class, files or excalidraw. */
  get type() { return stringProperty("type", undefined).get.call(this); }
  set type(value) { stringProperty("type").set.call(this, value); }

  /** Variant of the editor: `plain` or `excel` for expression; `single-class` or `multi-class` for class. */
  get view() { return stringProperty("view", undefined).get.call(this); }
  set view(value) { stringProperty("view").set.call(this, value); }

  /** The editor refuses edits. */
  get readOnly() { return flagProperty("read-only").get.call(this); }
  set readOnly(value) { flagProperty("read-only").set.call(this, value); }

  /** The text to edit (a JSON string for excalidraw). Not for the files editor. */
  get code() { return stringProperty("code", undefined).get.call(this); }
  set code(value) { stringProperty("code").set.call(this, value); }

  /** Language of the code, e.g. `javascript`. Monaco and expression. */
  get lang() { return stringProperty("lang", "").get.call(this); }
  set lang(value) { stringProperty("lang").set.call(this, value); }

  /** JSON schema options for JSON in the Monaco editor (a JSON string). */
  get schema() { return stringProperty("schema", undefined).get.call(this); }
  set schema(value) { stringProperty("schema").set.call(this, value); }

  /** Base URL of the Code UI site, when it is not the site `qrtl-editor.js` was loaded from. */
  get baseUrl() { return stringProperty("base-url", undefined).get.call(this); }
  set baseUrl(value) { stringProperty("base-url").set.call(this, value); }

  /**
   * An object for editors that take more than text: the scene of excalidraw, `{ files, active?, context? }` of the files editor.
   * Setting it sends it to the editor.
   */
  get data() {
    if (this.dataValue !== undefined) {
      return this.dataValue;
    }
    return this.parseDataAttribute(this.getAttribute("data"));
  }

  set data(value) {
    this.dataValue = value ?? undefined;
    this.settingData = true;
    try {
      if (value) {
        this.setAttribute("data", JSON.stringify(value));
      } else {
        this.removeAttribute("data");
      }
    } finally {
      this.settingData = false;
    }
  }

  /** True when the editor page has announced itself and messages go straight through. */
  get isReady() {
    return this.ready;
  }

  parseDataAttribute(value) {
    if (!value) {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Invalid qrtl-editor data attribute JSON:", error);
      return undefined;
    }
  }

  // ------------------------------------------------------------------ messages

  /** Raises an event on the element: `detail` is the payload. */
  dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  /** Posts a message to the editor, or holds it until the editor is ready. */
  sendMessage(message) {
    const plain = toPlain(message);
    if (!this.ready || !this.iframe?.contentWindow) {
      this.queue.push(plain);
      return;
    }
    let origin = "*";
    try {
      origin = new URL(this.iframe.src, window.location.href).origin;
    } catch {
      // Keep "*": the message carries no secrets and the editor checks its sender.
    }
    this.iframe.contentWindow.postMessage(plain, origin);
  }

  handleReady(message) {
    this.ready = true;
    this.protocol = message.protocol;
    if (this.type !== "files" || this.data !== undefined) {
      this.sendSetData();
    }
    const held = this.queue;
    this.queue = [];
    held.forEach((m) => this.sendMessage(m));
    this.dispatch("ready", { protocol: message.protocol });
  }

  /** Sends the `code`, `data` and `schema` of the element to the editor. */
  sendSetData() {
    const message = { type: "set-data" };
    if (this.code !== undefined) message.code = this.code;
    if (this.data !== undefined) message.data = this.data;
    if (this.schema !== undefined) message.schema = this.schema;
    this.sendMessage(message);
  }

  /**
   * Changes what the editor shows, without changing the attributes.
   * @param fields `code` (text), `data` (scene or files), `schema` (Monaco JSON schema), `readOnly` (Monaco).
   */
  setData(fields) {
    this.sendMessage({ type: "set-data", ...fields });
  }

  // ------------------------------------------------- files editor: methods

  /**
   * Opens a file in the files editor. The address is the file's identity, e.g. `/data/a.ts`.
   * @param file `{ address, text, lang?, readOnly?, version? }`
   * @param options `{ show?: boolean (default true), selection?: { startLineNumber, startColumn, endLineNumber?, endColumn? } }`
   */
  openFile(file, options = {}) {
    this.sendMessage({ type: "open-file", file, show: options.show !== false, selection: options.selection });
  }

  /** Shows a file that is open in the files editor. */
  showFile(address, selection) {
    this.sendMessage({ type: "show-file", address, selection });
  }

  /** Closes a file in the files editor. */
  closeFile(address) {
    this.sendMessage({ type: "close-file", address });
  }

  /** Tells the files editor that a file or folder was renamed or moved. */
  renameFile(from, to) {
    this.sendMessage({ type: "rename-file", from, to });
  }

  /** Replaces the text of a file in the files editor with a change made elsewhere. */
  updateFile(address, text, version) {
    this.sendMessage({ type: "update-file", address, text, version });
  }

  /**
   * Gives the files editor the project around the open files, so imports resolve.
   * @param context `{ files?: { [address]: text }, tsconfig?: string, packageJson?: string }`
   */
  setContext(context) {
    this.sendMessage({ type: "set-context", context });
  }

  /** Editor-wide options of the files editor: `{ readOnly?, theme? }`. */
  setOptions(options) {
    this.sendMessage({ type: "set-options", ...options });
  }

  // -------------------------------------------------------------- iframe url

  getBaseRoute() {
    const type = this.type ?? "monaco";
    return buildEditorUrl(this, typeToRoute[type] || "/monaco");
  }

  buildHash() {
    const hashParams = new URLSearchParams();
    if (this.lang) hashParams.set("lang", this.lang);
    return hashParams.toString();
  }

  buildQuery() {
    const params = new URLSearchParams();
    if (this.view) params.set("view", this.view);
    if (this.readOnly) params.set("readOnly", "true");
    return params.toString();
  }

  updateIframeSrc() {
    if (!this.iframe) {
      return;
    }
    const baseRoute = this.getBaseRoute();
    const hash = this.buildHash();
    const query = this.buildQuery();
    const src = `${baseRoute}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
    this.iframe.title = `${this.type ?? "monaco"} Editor`;

    if (!this.iframe.getAttribute("src") || this.lastBaseRoute !== baseRoute || this.lastQuery !== query) {
      // A new page: it announces itself again, and the host gets `ready` again.
      this.ready = false;
      this.iframe.src = src;
      this.lastBaseRoute = baseRoute;
      this.lastQuery = query;
      return;
    }
    try {
      this.iframe.contentWindow.location.hash = hash ? `#${hash}` : "";
    } catch (error) {
      this.ready = false;
      this.iframe.src = src;
    }
  }
}

/** Base of the elements that show code given in the URL: no messages, only the `link-open` event. */
class QEditorStaticElement extends HTMLElement {
  iframe = null;
  lastSrc = null;
  /** The page route after the editor type: `code` or `fetch`. */
  route = "";

  messageHandler = (event) => {
    if (!this.iframe || this.iframe.contentWindow !== event.source) {
      return;
    }
    const message = unwrapMessage(event.data);
    if (message?.type === "on-link-open" && ("link" in message || "detail" in message)) {
      this.dispatchEvent(new CustomEvent("link-open", { detail: message, bubbles: true, composed: true }));
    }
  };

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (!this.iframe) {
      this.iframe = createFrame(this);
    }
    window.addEventListener("message", this.messageHandler);
    this.updateIframeSrc();
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.messageHandler);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.updateIframeSrc();
    }
  }

  get type() { return stringProperty("type", undefined).get.call(this); }
  set type(value) { stringProperty("type").set.call(this, value); }

  get view() { return stringProperty("view", undefined).get.call(this); }
  set view(value) { stringProperty("view").set.call(this, value); }

  get lang() { return stringProperty("lang", "").get.call(this); }
  set lang(value) { stringProperty("lang").set.call(this, value); }

  /** The editor accepts edits. Default is read-only. */
  get editable() { return flagProperty("editable").get.call(this); }
  set editable(value) { flagProperty("editable").set.call(this, value); }

  getBaseRoute() {
    const type = this.type ?? "monaco";
    return buildEditorUrl(this, `${typeToRoute[type] || "/monaco"}/${this.route}`);
  }

  /** The hash parameter that carries the content: `code` or `url`. */
  contentParameter() {
    return undefined;
  }

  buildHash() {
    const hashParams = new URLSearchParams();
    const content = this.contentParameter();
    if (content?.value) hashParams.set(content.name, content.value);
    if (this.lang) hashParams.set("lang", this.lang);
    return hashParams.toString();
  }

  buildQuery() {
    const params = new URLSearchParams();
    if (this.view) params.set("view", this.view);
    if (!this.editable) params.set("readOnly", "true");
    return params.toString();
  }

  updateIframeSrc() {
    if (!this.iframe) {
      return;
    }
    const baseRoute = this.getBaseRoute();
    const hash = this.buildHash();
    const query = this.buildQuery();
    const src = `${baseRoute}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
    this.iframe.title = `${this.type ?? "monaco"} Editor`;
    if (this.lastSrc !== src) {
      this.iframe.src = src;
      this.lastSrc = src;
    }
  }
}

/** The code in the URL hash. */
export class QEditorCodeElement extends QEditorStaticElement {
  route = "code";

  static get observedAttributes() {
    return ["type", "view", "code", "lang", "editable", "base-url"];
  }

  /** The text to show. */
  get code() { return stringProperty("code", undefined).get.call(this); }
  set code(value) { stringProperty("code").set.call(this, value); }

  contentParameter() {
    return { name: "code", value: this.code };
  }
}

/** The code fetched from a URL. */
export class QEditorUrlElement extends QEditorStaticElement {
  route = "fetch";

  static get observedAttributes() {
    return ["type", "view", "url", "lang", "editable", "base-url"];
  }

  /** The address of the text to show. It must be readable without credentials. */
  get url() { return stringProperty("url", undefined).get.call(this); }
  set url(value) { stringProperty("url").set.call(this, value); }

  contentParameter() {
    return { name: "url", value: this.url };
  }
}

export const defineQrtlEditorElement = (tagName = "qrtl-editor") => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QrtlEditorElement);
};

export const defineQEditorCodeElement = (tagName = "qrtl-editor-code") => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QEditorCodeElement);
};

export const defineQEditorUrlElement = (tagName = "qrtl-editor-url") => {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, QEditorUrlElement);
};

defineQrtlEditorElement();
defineQEditorCodeElement();
defineQEditorUrlElement();
