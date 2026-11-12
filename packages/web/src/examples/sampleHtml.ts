import type { QEditorProps } from "@quartal/code-editors-core";
import type { QEditorExample } from "./QEditorExample";

/** The public address of the Code UI site: snippets that are copied elsewhere load from here. */
export const SITE_URL = "https://code.quartal.com";

/** The script tag that defines the `qrtl-*` elements. */
export const SCRIPT_TAG = `<script type="module" src="${SITE_URL}/qrtl-editor.js"></` + `script>`;

/** Editors that raise the `change` event (see editorApi.ts). */
const changeEditors: QEditorProps["type"][] = ["monaco", "markdown", "markdown-hybrid", "expression", "class", "excalidraw"];

/** How a sample is shown: the element it uses. `host` is a page that drives the element with methods (files). */
export type SampleKind = "code" | "url" | "host";

export function sampleKind(sample: QEditorExample): SampleKind {
  if (sample.props.url) return "url";
  if (sample.props.code !== undefined) return "code";
  return "host";
}

/** An attribute value in quotes: single quotes when that avoids escaping double quotes. */
function attr(name: string, value: string): string {
  const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  if (value.includes('"') && !value.includes("'")) return ` ${name}='${escaped}'`;
  return ` ${name}="${escaped.replace(/"/g, "&quot;")}"`;
}

/** A site-relative URL (the examples on this site) as an absolute one, for code that runs elsewhere. */
function absoluteUrl(url: string): string {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

/**
 * The element of a sample: `<qrtl-editor>` with the code, or `<qrtl-editor-url>` for a URL.
 * @param absolute Site-relative URLs as absolute ones (for the snippet); the preview keeps them relative.
 */
export function elementHtml(sample: QEditorExample, absolute = false): string {
  const p = sample.props;
  if (sampleKind(sample) === "url") {
    return (
      `<qrtl-editor-url${attr("type", p.type)}${attr("url", absolute ? absoluteUrl(p.url!) : p.url!)}` +
      `${p.lang ? attr("lang", p.lang) : ""}${p.view ? attr("view", p.view) : ""}${p.readOnly === false ? " editable" : ""}></qrtl-editor-url>`
    );
  }
  return (
    `<qrtl-editor${attr("type", p.type)}${p.lang ? attr("lang", p.lang) : ""}${p.view ? attr("view", p.view) : ""}` +
    `${p.readOnly ? " read-only" : ""}${p.code !== undefined ? attr("code", p.code) : ""}></qrtl-editor>`
  );
}

/** The copy-paste HTML of a sample: a sized host, the element, the script and (for `qrtl-editor`) a change listener. */
export function componentSnippet(sample: QEditorExample): string {
  const lines = [`<div style="height: 400px;">`, `  ${elementHtml(sample, true)}`, `</div>`, "", SCRIPT_TAG];
  if (sampleKind(sample) === "code" && changeEditors.includes(sample.props.type)) {
    lines.push(
      `<script type="module">`,
      `  const editor = document.querySelector("qrtl-editor");`,
      `  editor.addEventListener("change", (e) => console.log(e.detail));`,
      `</` + `script>`,
    );
  }
  return lines.join("\n");
}

/**
 * The editor page with the sample in its URL (`/<editor>/code` or `/<editor>/fetch`), as the `qrtl-editor-code` and
 * `qrtl-editor-url` elements build it. Undefined for a sample that needs a host page (files).
 * @param base The origin and base path of the site (the absolute site URL in the snippets).
 */
export function plainLink(sample: QEditorExample, base: string = SITE_URL): string | undefined {
  const p = sample.props;
  const kind = sampleKind(sample);
  if (kind === "host") return undefined;
  const query = new URLSearchParams();
  if (p.view) query.set("view", p.view);
  // The code page is editable by default and the fetch page read-only: only the other value is added.
  if (kind === "code" && p.readOnly) query.set("readOnly", "true");
  if (kind === "url" && p.readOnly === false) query.set("readOnly", "false");
  const hash = new URLSearchParams();
  if (kind === "url") hash.set("url", p.url!);
  else hash.set("code", p.code!);
  if (p.lang) hash.set("lang", p.lang);
  const q = query.toString();
  return `${base}/${p.type}/${kind === "url" ? "fetch" : "code"}${q ? `?${q}` : ""}#${hash.toString()}`;
}
