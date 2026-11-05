<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { WorkspaceSelection } from "@quartal/code-editors-core";
import { getFilesExamples } from "@/examples/getProjectExamples";
import type { FilesData } from "@/model/FilesData";

/**
 * Demo of the files editor with the `<qrtl-editor type="files">` element. This component plays the host: it owns
 * the file list, the tabs and the storage, and calls the methods of the element. The editor only edits the open files.
 */
interface HostFile {
  /** The text as saved. */
  saved: string;
  /** The text as edited. */
  draft: string;
  /** Version token sent with the file and returned with changes. */
  version: number;
}

/** The members of the `qrtl-editor` element that this host uses. */
interface FilesEditorElement extends HTMLElement {
  readOnly: boolean;
  openFile(file: { address: string; text: string; version?: string }, options?: { show?: boolean; selection?: WorkspaceSelection }): void;
  showFile(address: string, selection?: WorkspaceSelection): void;
  closeFile(address: string): void;
  renameFile(from: string, to: string): void;
  updateFile(address: string, text: string, version?: string): void;
  setContext(context: { files?: Record<string, string>; tsconfig?: string; packageJson?: string }): void;
}

const examples = getFilesExamples();
const editor = ref<FilesEditorElement | null>(null);
const files = reactive<Record<string, HostFile>>({});
const tabs = ref<string[]>([]);
const active = ref<string | undefined>(undefined);
const readOnly = ref(false);
const ready = ref(false);
const exampleIndex = ref(0);
const log = ref<{ dir: "to" | "from"; text: string }[]>([]);

const addresses = computed(() => Object.keys(files).sort((a, b) => a.localeCompare(b)));
const isDirty = (address: string): boolean => !!files[address] && files[address].draft !== files[address].saved;

function short(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "string" && v.length > 30 ? `${v.slice(0, 30)}…` : v));
}

function addLog(dir: "to" | "from", text: string): void {
  log.value.unshift({ dir, text });
  log.value.length = Math.min(log.value.length, 60);
}

/** Calls a method of the element and shows the call in the log. Before `ready` nothing is called: the state is replayed. */
function call<K extends keyof FilesEditorElement>(method: K, ...args: FilesEditorElement[K] extends (...a: infer A) => unknown ? A : never): void {
  if (!ready.value) return;
  addLog("to", `${String(method)}(${args.map((a) => short(a)).join(", ")})`);
  (editor.value![method] as (...a: unknown[]) => void)(...args);
}

function fileOf(address: string): { address: string; text: string; version: string } {
  const file = files[address]!;
  return { address, text: file.draft, version: String(file.version) };
}

/** Tells the editor about the project: all the files for the language services, and the tsconfig. */
function sendContext(): void {
  const context: Record<string, string> = {};
  for (const [address, file] of Object.entries(files)) context[address] = file.saved;
  call("setContext", { files: context, tsconfig: files["/tsconfig.json"]?.saved });
}

function open(address: string, selection?: WorkspaceSelection): void {
  if (!files[address]) return;
  if (!tabs.value.includes(address)) tabs.value.push(address);
  active.value = address;
  call("openFile", fileOf(address), { show: true, selection });
}

function show(address: string): void {
  active.value = address;
  call("showFile", address);
}

function close(address: string): void {
  const at = tabs.value.indexOf(address);
  tabs.value = tabs.value.filter((a) => a !== address);
  call("closeFile", address);
  if (active.value === address) active.value = tabs.value[Math.min(at, tabs.value.length - 1)];
}

function loadExample(index: number): void {
  exampleIndex.value = index;
  for (const address of [...tabs.value]) call("closeFile", address);
  tabs.value = [];
  active.value = undefined;
  for (const key of Object.keys(files)) delete files[key];
  const data = examples[index]!.props.data as unknown as FilesData;
  for (const [address, text] of Object.entries(data.files)) files[address] = { saved: text, draft: text, version: 1 };
  sendContext();
  open(data.active ?? Object.keys(data.files)[0]!);
}

/** Someone else saves the active file: the host pushes the new text. */
function changeByOther(): void {
  const address = active.value;
  if (!address || !files[address]) return;
  const file = files[address]!;
  file.saved += "\n// changed by someone else\n";
  file.draft = file.saved;
  file.version++;
  call("updateFile", address, file.draft, String(file.version));
}

/** The host renames the active file: the editor keeps its text and history. */
function renameActive(): void {
  const from = active.value;
  if (!from || !files[from]) return;
  const dot = from.lastIndexOf(".");
  const to = dot > from.lastIndexOf("/") ? `${from.slice(0, dot)}-renamed${from.slice(dot)}` : `${from}-renamed`;
  if (files[to]) return;
  files[to] = files[from]!;
  delete files[from];
  tabs.value = tabs.value.map((a) => (a === from ? to : a));
  active.value = to;
  call("renameFile", from, to);
  sendContext();
}

function toggleReadOnly(): void {
  readOnly.value = !readOnly.value;
  if (editor.value) editor.value.readOnly = readOnly.value;
  addLog("to", `readOnly = ${readOnly.value}`);
}

// --- Events of the element -----------------------------------------------------------------------

function onReady(event: Event): void {
  addLog("from", `ready ${short((event as CustomEvent).detail)}`);
  ready.value = true;
  sendContext();
  const shown = active.value;
  for (const address of tabs.value) call("openFile", fileOf(address), { show: address === shown });
}

function onFileChange(event: Event): void {
  const detail = (event as CustomEvent<{ address: string; text: string }>).detail;
  addLog("from", `file-change ${short(detail)}`);
  if (files[detail.address]) files[detail.address]!.draft = detail.text;
}

function onFileSave(event: Event): void {
  const detail = (event as CustomEvent<{ address: string }>).detail;
  addLog("from", `file-save ${short(detail)}`);
  const file = files[detail.address];
  if (file) {
    file.saved = file.draft;
    file.version++;
  }
}

function onFileRequest(event: Event): void {
  const detail = (event as CustomEvent<{ address: string; selection?: WorkspaceSelection }>).detail;
  addLog("from", `file-request ${short(detail)}`);
  open(detail.address, detail.selection);
}

function onFileFocus(event: Event): void {
  const detail = (event as CustomEvent<{ address: string }>).detail;
  addLog("from", `file-focus ${short(detail)}`);
  active.value = detail.address;
}

onMounted(() => {
  // The first example is loaded when the editor says it is ready (see onReady); until then only the state is set.
  const data = examples[0]!.props.data as unknown as FilesData;
  for (const [address, text] of Object.entries(data.files)) files[address] = { saved: text, draft: text, version: 1 };
  const first = data.active ?? Object.keys(data.files)[0]!;
  tabs.value = [first];
  active.value = first;
});
</script>

<template>
  <div class="container pb-5" style="height: 100%; overflow-y: auto;">
    <p class="lead">
      The files editor is Monaco for many files. Your page owns the file list, the tabs and the storage; the editor only edits
      the files you open in it.
    </p>
    <pre class="border rounded p-2 small bg-body-tertiary"><code>&lt;qrtl-editor type="files"&gt;&lt;/qrtl-editor&gt;
editor.addEventListener("ready", () =&gt; editor.openFile({ address: "/a.ts", text: "export const a = 1;" }));
editor.addEventListener("file-change", (e) =&gt; save(e.detail.address, e.detail.text));</code></pre>
    <div class="row small">
      <div class="col-md-6">
        <p class="mb-1"><strong>Methods</strong> (call after <code>ready</code>):</p>
        <ul>
          <li><code>openFile(file, { show?, selection? })</code> with <code>file = { address, text, lang?, readOnly?, version? }</code></li>
          <li><code>showFile(address, selection?)</code>, <code>closeFile(address)</code></li>
          <li><code>renameFile(from, to)</code> for a renamed or moved file or folder</li>
          <li><code>updateFile(address, text, version?)</code> for a change made elsewhere</li>
          <li><code>setContext({ files?, tsconfig?, packageJson? })</code> so imports resolve</li>
          <li><code>setOptions({ readOnly?, theme? })</code></li>
        </ul>
      </div>
      <div class="col-md-6">
        <p class="mb-1"><strong>Events</strong> (<code>event.detail</code>):</p>
        <ul>
          <li><code>ready</code> <code>{ protocol }</code></li>
          <li><code>file-change</code> <code>{ address, text, version? }</code> when the user edits</li>
          <li><code>file-save</code> <code>{ address }</code> on Ctrl+S</li>
          <li><code>file-request</code> <code>{ address, selection? }</code> when the user goes to a file that is not open</li>
          <li><code>file-focus</code> <code>{ address }</code> when the editor shows another open file</li>
        </ul>
        <p class="mb-0">Attribute: <code>read-only</code>. There is no <code>code</code> or <code>url</code>: files go in with the methods. All editors: see the <a href="../../">About page</a>.</p>
      </div>
    </div>

    <h2 class="h5 mt-3">Host simulator</h2>
    <p class="small text-body-secondary">
      The page below is a host: it holds the files, opens tabs and answers the events. Try go to definition (F12), Ctrl+S,
      switching tabs, and the buttons. The log shows each call and event.
    </p>
    <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
      <select class="form-select form-select-sm w-auto" aria-label="Example" :value="exampleIndex" @change="loadExample(Number(($event.target as HTMLSelectElement).value))">
        <option v-for="(example, i) in examples" :key="example.title" :value="i">{{ example.title }}</option>
      </select>
      <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!active" @click="changeByOther">Someone else changes the file</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!active" @click="renameActive">Rename the file</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" :class="{ active: readOnly }" @click="toggleReadOnly">Read only</button>
    </div>
    <div class="d-flex border rounded" style="height: 60vh; min-height: 320px;">
      <div class="border-end overflow-auto flex-shrink-0 p-2 small" style="width: 15rem;">
        <button v-for="address in addresses" :key="address" type="button" class="btn btn-sm btn-link text-start text-truncate w-100 p-0 text-decoration-none"
          :class="{ 'fw-bold': address === active }" :title="address" @click="open(address)">
          {{ address }}
        </button>
      </div>
      <div class="flex-grow-1 d-flex flex-column" style="min-width: 0;">
        <ul class="nav nav-tabs flex-nowrap overflow-x-auto flex-shrink-0 small" role="tablist">
          <li v-for="address in tabs" :key="address" class="nav-item" role="presentation">
            <div class="nav-link d-flex gap-2 align-items-center text-nowrap py-1" :class="{ active: address === active }" role="tab" style="cursor: default;" @click="show(address)">
              {{ address.slice(address.lastIndexOf('/') + 1) }}<span v-if="isDirty(address)" class="text-warning-emphasis" title="Unsaved changes">●</span>
              <button type="button" class="btn-close" style="font-size: 0.55rem;" :aria-label="`Close ${address}`" @click.stop="close(address)"></button>
            </div>
          </li>
        </ul>
        <div class="flex-grow-1" style="min-height: 0;">
          <qrtl-editor
            ref="editor"
            type="files"
            @ready="onReady"
            @file-change="onFileChange"
            @file-save="onFileSave"
            @file-request="onFileRequest"
            @file-focus="onFileFocus"
          ></qrtl-editor>
        </div>
      </div>
      <pre class="border-start small mb-0 p-2 overflow-auto flex-shrink-0" style="width: 24rem; white-space: pre-wrap; word-break: break-all;" aria-label="Message log"><template v-if="!log.length">Calls and events show here.</template><template v-for="(entry, i) in log" :key="i"><span :class="entry.dir === 'to' ? 'text-primary' : 'text-success'">{{ entry.dir === 'to' ? '→' : '←' }}</span> {{ entry.text }}
</template></pre>
    </div>
  </div>
</template>
