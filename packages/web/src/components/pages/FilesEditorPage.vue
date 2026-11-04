<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { FilesEditor } from "vue-editors";
import { FolderHelpers, type FilesEditorInMessage, type WorkspaceSelection } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";
import { useQEditorPropsFromQuery } from "@/composables";
import { getFilesExamples } from "@/examples/getProjectExamples";
import type { FilesData } from "@/model/FilesData";

/**
 * The multi-file editor page (protocol 2). In an iframe it does what the parent window tells it
 * (`open-file`, `show-file`, `close-file`, `rename-file`, `update-file`, `set-context`, `set-options`
 * and `set-data`) and reports `editor-ready`, `file-change`, `file-command`, `file-request`. It has no
 * file list, tabs or storage of its own: the host owns them. Opened on its own it shows a small file
 * list so the editor can be tried: pick an example, or open a folder from disk.
 */
const { props: queryProps } = useQEditorPropsFromQuery("files");
const editor = ref<InstanceType<typeof FilesEditor> | null>(null);
const inIframe = PageHelpers.isInIframe();

const readOnlyFromParent = ref<boolean | undefined>(undefined);
const theme = ref<string | undefined>(undefined);
const readOnly = computed(() => readOnlyFromParent.value ?? queryProps.value.readOnly ?? false);

// --- Messages from the parent ------------------------------------------------------------------

function applyData(data: NonNullable<Extract<FilesEditorInMessage, { type: "set-data" }>["data"]>): void {
  const files = data.files ?? {};
  editor.value?.setContext({ ...data.context, files: { ...(data.context?.files ?? {}), ...files }, tsconfig: data.context?.tsconfig ?? files["/tsconfig.json"], packageJson: data.context?.packageJson ?? files["/package.json"] });
  const first = data.active ?? Object.keys(files)[0];
  if (first && files[first] !== undefined) {
    editor.value?.open({ address: first, text: files[first] });
  }
}

function handleMessage(event: MessageEvent): void {
  if (event.source !== window.parent) {
    return;
  }
  const message = event.data as FilesEditorInMessage | undefined;
  const target = editor.value;
  if (!message || typeof message !== "object" || !target) {
    return;
  }
  switch (message.type) {
    case "open-file":
      target.open(message.file, message.show !== false, message.selection);
      break;
    case "show-file":
      target.show(message.address, message.selection);
      break;
    case "close-file":
      target.close(message.address);
      break;
    case "rename-file":
      target.rename(message.from, message.to);
      break;
    case "update-file":
      target.update(message.address, message.text, message.version);
      break;
    case "set-context":
      target.setContext(message.context);
      break;
    case "set-options":
      if ("readOnly" in message) readOnlyFromParent.value = message.readOnly === true;
      if (message.theme) theme.value = message.theme;
      break;
    case "set-data":
      if (message.data) applyData(message.data);
      break;
  }
}

// --- Messages to the parent --------------------------------------------------------------------

function onReady(): void {
  PageHelpers.sendIframeReadyMessage(2);
  if (queryProps.value.data) {
    applyData(queryProps.value.data as never);
  }
}

function onChange(data: { address: string; text: string; version?: string }): void {
  PageHelpers.sendMessageToParent({ type: "file-change", ...data });
  if (!inIframe && data.address in files.value) {
    files.value[data.address] = data.text;
  }
}

function onCommand(data: { command: "save"; address: string }): void {
  PageHelpers.sendMessageToParent({ type: "file-command", ...data });
}

function onOpenRequest(data: { address: string; selection?: WorkspaceSelection }): void {
  if (!inIframe && data.address in files.value) {
    openLocal(data.address, data.selection);
    return;
  }
  PageHelpers.sendMessageToParent({ type: "file-request", ...data });
}

function onShown(address: string | undefined): void {
  current.value = address;
  if (address) PageHelpers.sendMessageToParent({ type: "file-focus", address });
}

onMounted(() => window.addEventListener("message", handleMessage));
onBeforeUnmount(() => window.removeEventListener("message", handleMessage));

// --- Stand-alone mode: a file list to try the editor ----------------------------------------------

const examples = getFilesExamples();
const files = ref<Record<string, string>>({});
const current = ref<string | undefined>(undefined);
const error = ref<string | undefined>(undefined);
const addresses = computed(() => Object.keys(files.value).sort((a, b) => a.localeCompare(b)));

function loadFiles(data: FilesData): void {
  for (const address of editor.value?.openAddresses() ?? []) editor.value?.close(address);
  files.value = { ...data.files };
  applyData({ files: data.files, active: data.active, context: data.context });
}

function openLocal(address: string, selection?: WorkspaceSelection): void {
  const text = files.value[address];
  if (text === undefined) return;
  editor.value?.open({ address, text }, true, selection);
}

async function openFolder(): Promise<void> {
  error.value = undefined;
  try {
    loadFiles({ files: await FolderHelpers.readFolderBrowser() });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <div class="d-flex" style="height: 100vh;">
    <div v-if="!inIframe" class="border-end overflow-auto flex-shrink-0 p-2" style="width: 18rem;">
      <div class="small text-body-secondary mb-2">Stand-alone mode: in an iframe the host controls the files.</div>
      <select class="form-select form-select-sm mb-2" aria-label="Example" @change="loadFiles(examples[Number(($event.target as HTMLSelectElement).value)]!.props.data as unknown as FilesData)">
        <option disabled selected>Choose an example</option>
        <option v-for="(example, i) in examples" :key="example.title" :value="i">{{ example.title }}</option>
      </select>
      <button type="button" class="btn btn-sm btn-outline-secondary w-100 mb-2" @click="openFolder">Open folder…</button>
      <div v-if="error" class="alert alert-danger py-1 small">{{ error }}</div>
      <ul class="list-unstyled small mb-0">
        <li v-for="address in addresses" :key="address">
          <button type="button" class="btn btn-sm btn-link text-start text-truncate w-100 p-0" :class="{ 'fw-bold': address === current }" @click="openLocal(address)">{{ address }}</button>
        </li>
      </ul>
    </div>
    <div class="flex-grow-1" style="min-width: 0;">
      <FilesEditor
        ref="editor"
        :read-only="readOnly"
        :theme="theme"
        @ready="onReady"
        @change="onChange"
        @command="onCommand"
        @open-request="onOpenRequest"
        @shown="onShown"
      />
    </div>
  </div>
</template>
