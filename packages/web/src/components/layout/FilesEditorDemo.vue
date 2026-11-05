<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { FilesEditorInMessage, FilesEditorOutMessage, WorkspaceSelection } from "@quartal/code-editors-core";
import { getFilesExamples } from "@/examples/getProjectExamples";
import type { FilesData } from "@/model/FilesData";

/**
 * Demo of the files editor: the page you embed is `/files`, and this component plays the host that
 * embeds it. The host owns the file list, the tabs and the storage; the editor only edits the open files.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const editorUrl = `${base}/files/`;
const examples = getFilesExamples();

interface HostFile {
  /** The text as saved. */
  saved: string;
  /** The text as edited. */
  draft: string;
  /** Version token sent with the file and returned with changes. */
  version: number;
}

const frame = ref<HTMLIFrameElement | null>(null);
const ready = ref(false);
const files = reactive<Record<string, HostFile>>({});
const tabs = ref<string[]>([]);
const active = ref<string | undefined>(undefined);
const readOnly = ref(false);
const exampleIndex = ref(0);
const log = ref<{ dir: "to" | "from"; text: string }[]>([]);

const addresses = computed(() => Object.keys(files).sort((a, b) => a.localeCompare(b)));
const isDirty = (address: string): boolean => !!files[address] && files[address].draft !== files[address].saved;

function short(message: object): string {
  return JSON.stringify(message, (_key, value) => (typeof value === "string" && value.length > 40 ? `${value.slice(0, 40)}…` : value));
}

function send(message: FilesEditorInMessage): void {
  // Before editor-ready nothing is sent: the state is replayed when the editor announces itself.
  if (!ready.value) return;
  log.value.unshift({ dir: "to", text: short(message) });
  log.value.length = Math.min(log.value.length, 60);
  frame.value?.contentWindow?.postMessage(message, window.location.origin);
}

function fileMessage(address: string): { address: string; text: string; version: string } {
  const file = files[address]!;
  return { address, text: file.draft, version: String(file.version) };
}

/** Tells the editor about the project: all the files for the language services, and the tsconfig. */
function sendContext(): void {
  const context: Record<string, string> = {};
  for (const [address, file] of Object.entries(files)) context[address] = file.saved;
  send({ type: "set-context", context: { files: context, tsconfig: files["/tsconfig.json"]?.saved } });
}

function open(address: string, selection?: WorkspaceSelection): void {
  if (!files[address]) return;
  if (!tabs.value.includes(address)) tabs.value.push(address);
  active.value = address;
  send({ type: "open-file", file: fileMessage(address), show: true, selection });
}

function show(address: string): void {
  active.value = address;
  send({ type: "show-file", address });
}

function close(address: string): void {
  const at = tabs.value.indexOf(address);
  tabs.value = tabs.value.filter((a) => a !== address);
  send({ type: "close-file", address });
  if (active.value === address) active.value = tabs.value[Math.min(at, tabs.value.length - 1)];
}

function loadExample(index: number): void {
  exampleIndex.value = index;
  for (const address of [...tabs.value]) send({ type: "close-file", address });
  tabs.value = [];
  active.value = undefined;
  for (const key of Object.keys(files)) delete files[key];
  const data = examples[index]!.props.data as unknown as FilesData;
  for (const [address, text] of Object.entries(data.files)) files[address] = { saved: text, draft: text, version: 1 };
  if (ready.value) sendContext();
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
  send({ type: "update-file", address, text: file.draft, version: String(file.version) });
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
  send({ type: "rename-file", from, to });
  sendContext();
}

function toggleReadOnly(): void {
  readOnly.value = !readOnly.value;
  send({ type: "set-options", readOnly: readOnly.value });
}

function onMessage(event: MessageEvent): void {
  if (event.source !== frame.value?.contentWindow) return;
  const message = event.data as FilesEditorOutMessage;
  if (!message?.type) return;
  log.value.unshift({ dir: "from", text: short(message) });
  log.value.length = Math.min(log.value.length, 60);
  switch (message.type) {
    case "editor-ready": {
      ready.value = true;
      sendContext();
      const shown = active.value;
      for (const address of tabs.value) send({ type: "open-file", file: fileMessage(address), show: address === shown });
      break;
    }
    case "file-change":
      if (files[message.address]) files[message.address]!.draft = message.text;
      break;
    case "file-command":
      if (message.command === "save" && files[message.address]) {
        const file = files[message.address]!;
        file.saved = file.draft;
        file.version++;
      }
      break;
    case "file-request":
      open(message.address, message.selection);
      break;
    case "file-focus":
      active.value = message.address;
      break;
  }
}

onMounted(() => {
  window.addEventListener("message", onMessage);
  loadExample(0);
});
onBeforeUnmount(() => window.removeEventListener("message", onMessage));
</script>

<template>
  <div class="container pb-5" style="height: 100%; overflow-y: auto;">
    <p class="lead">
      The files editor is Monaco for many files. Embed the page <code>/files</code> in an iframe. Your page owns the file
      list, the tabs and the storage; the editor only edits the files you open in it.
    </p>
    <pre class="border rounded p-2 small bg-body-tertiary"><code>&lt;iframe src="https://code.quartal.com/files?read-only=false"&gt;&lt;/iframe&gt;</code></pre>
    <div class="row small">
      <div class="col-md-6">
        <p class="mb-1"><strong>Your page sends</strong> (<code>postMessage</code>, after <code>editor-ready</code>):</p>
        <ul>
          <li><code>open-file</code> <code>{ file: { address, text, lang?, readOnly?, version? }, show?, selection? }</code></li>
          <li><code>show-file</code> <code>{ address, selection? }</code></li>
          <li><code>close-file</code> <code>{ address }</code></li>
          <li><code>rename-file</code> <code>{ from, to }</code></li>
          <li><code>update-file</code> <code>{ address, text, version? }</code> for a change made elsewhere</li>
          <li><code>set-context</code> <code>{ context: { files?, tsconfig?, packageJson? } }</code> so imports resolve</li>
          <li><code>set-options</code> <code>{ readOnly?, theme? }</code></li>
        </ul>
      </div>
      <div class="col-md-6">
        <p class="mb-1"><strong>The editor sends:</strong></p>
        <ul>
          <li><code>editor-ready</code> <code>{ protocol: 2 }</code></li>
          <li><code>file-change</code> <code>{ address, text, version? }</code> when the user edits</li>
          <li><code>file-command</code> <code>{ command: "save", address }</code> on Ctrl+S</li>
          <li><code>file-request</code> <code>{ address, selection? }</code> when the user goes to a file that is not open</li>
          <li><code>file-focus</code> <code>{ address }</code> when the editor shows another open file</li>
        </ul>
        <p class="mb-0">The only URL parameter is <code>read-only</code>. There is no <code>code</code> or <code>url</code> parameter: files go in with messages.</p>
      </div>
    </div>

    <h2 class="h5 mt-3">Host simulator</h2>
    <p class="small text-body-secondary">
      The page below is a host: it holds the files, opens tabs and answers the editor. Try go to definition (F12), Ctrl+S,
      switching tabs, and the buttons. The message log shows what is sent each way.
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
          <iframe ref="frame" :src="editorUrl" title="Files editor" class="border-0 w-100 h-100"></iframe>
        </div>
      </div>
      <pre class="border-start small mb-0 p-2 overflow-auto flex-shrink-0" style="width: 24rem; white-space: pre-wrap; word-break: break-all;" aria-label="Message log"><template v-if="!log.length">Messages show here.</template><template v-for="(entry, i) in log" :key="i"><span :class="entry.dir === 'to' ? 'text-primary' : 'text-success'">{{ entry.dir === 'to' ? '→ editor' : '← editor' }}</span> {{ entry.text }}
</template></pre>
    </div>
  </div>
</template>
