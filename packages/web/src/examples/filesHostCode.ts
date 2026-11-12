import { SCRIPT_TAG } from "./sampleHtml";

/** A complete host page for the files editor, with the initial files in memory. */
export const filesHostCode = `<qrtl-editor id="editor" type="files" style="height: 400px"></qrtl-editor>
${SCRIPT_TAG}
<script type="module">
  // The host owns the files. Here they are in memory; use your own storage.
  const files = {
    "/index.ts": 'import { greet } from "./greet";\\n\\nconsole.log(greet("world"));\\n',
    "/greet.ts": "export function greet(name: string): string {\\n  return \`Hello, \${name}!\`;\\n}\\n",
  };
  const editor = document.getElementById("editor");

  editor.addEventListener("ready", () => {
    editor.setContext({ files });                                    // so imports resolve
    editor.openFile({ address: "/index.ts", text: files["/index.ts"] });
  });
  editor.addEventListener("file-change", (e) => {                    // the user edited
    files[e.detail.address] = e.detail.text;
  });
  editor.addEventListener("file-save", (e) => save(e.detail.address, files[e.detail.address]));   // Ctrl+S
  editor.addEventListener("file-request", (e) => {                   // go to definition into another file
    editor.openFile({ address: e.detail.address, text: files[e.detail.address] }, { selection: e.detail.selection });
  });
</` + `script>`;
