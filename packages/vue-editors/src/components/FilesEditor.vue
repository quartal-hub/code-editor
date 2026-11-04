<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import loader from "@monaco-editor/loader";
import {
  MonacoPackages,
  WorkspaceModels,
  type WorkspaceContext,
  type WorkspaceFile,
  type WorkspaceSelection,
} from "@quartal/code-editors-core";

/**
 * A Monaco editor for many files: one model per open file (cursor, scroll and undo are kept when
 * switching files), plus background files for the language services, so completion and go to
 * definition work across files. It has no tabs and no file list: the host (the page, or the Quartal
 * file explorer around the iframe) decides which files are open and which one is shown.
 */
const props = withDefaults(
  defineProps<{
    /** The editor refuses every edit. A file's own `readOnly` applies as well. */
    readOnly?: boolean;
    /** Monaco theme. Default `vs-dark`. */
    theme?: string;
    /** Extra Monaco editor options. */
    options?: Record<string, unknown>;
  }>(),
  { readOnly: false, theme: "vs-dark" },
);

const emit = defineEmits<{
  /** Monaco is loaded: the methods can be called. */
  ready: [];
  /** The user changed the text of an open file (debounced). */
  change: [data: { address: string; text: string; version?: string }];
  /** The user pressed a command key (Ctrl/Cmd+S). */
  command: [data: { command: "save"; address: string }];
  /** The user went to a file that is not open (go to definition): open it. */
  openRequest: [data: { address: string; selection?: WorkspaceSelection }];
  /** The editor showed another file, or none. */
  shown: [address: string | undefined];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const editorRef = shallowRef<any>(null);
const monacoRef = shallowRef<any>(null);
let models: WorkspaceModels | undefined;
let packages: MonacoPackages | undefined;
const timers = new Map<string, number>();
let disposed = false;

/** Calls made before Monaco has loaded wait here, in order. */
let onReady: () => void = () => undefined;
let queue: Promise<void> = new Promise<void>((resolve) => {
  onReady = resolve;
});

function enqueue(action: (m: WorkspaceModels) => void): void {
  queue = queue.then(() => {
    if (models && !disposed) action(models);
  });
}

function scheduleChange(address: string, text: string, version?: string): void {
  window.clearTimeout(timers.get(address));
  timers.set(
    address,
    window.setTimeout(() => {
      timers.delete(address);
      emit("change", { address, text, version });
    }, 250),
  );
}

/** Reports what is pending right away (before a file is closed or the page leaves). */
function flush(address?: string): void {
  for (const [key, timer] of [...timers]) {
    if (address && key !== address) continue;
    window.clearTimeout(timer);
    timers.delete(key);
    const text = models?.getText(key);
    if (text !== undefined) emit("change", { address: key, text });
  }
}

async function initialize(): Promise<void> {
  if (!containerRef.value) return;
  const monaco = await loader.init();
  if (disposed || !containerRef.value) return;
  monacoRef.value = monaco;
  const editor = monaco.editor.create(containerRef.value, {
    model: null,
    theme: props.theme,
    readOnly: props.readOnly,
    automaticLayout: true,
    tabSize: 2,
    ...(props.options ?? {}),
  });
  editorRef.value = editor;
  packages = new MonacoPackages(monaco);
  models = new WorkspaceModels(monaco, editor, {
    onChange: scheduleChange,
    onOpenRequest: (address, selection) => emit("openRequest", { address, selection }),
    onShown: (address) => emit("shown", address),
  });
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const address = models?.shown;
    if (address) {
      flush(address);
      emit("command", { command: "save", address });
    }
  });
  onReady();
  emit("ready");
}

onMounted(() => void initialize());

onBeforeUnmount(() => {
  disposed = true;
  timers.forEach((t) => window.clearTimeout(t));
  timers.clear();
  packages?.dispose();
  models?.dispose();
  editorRef.value?.dispose();
  editorRef.value = null;
});

watch(
  () => props.readOnly,
  (readOnly) => enqueue((m) => m.setReadOnly(readOnly)),
);
watch(
  () => props.theme,
  (theme) => monacoRef.value?.editor.setTheme(theme),
);

defineExpose({
  /** Opens a file and, by default, shows it. */
  open: (file: WorkspaceFile, show = true, selection?: WorkspaceSelection): void => enqueue((m) => m.open(file, show, selection)),
  /** Shows an open file. */
  show: (address: string, selection?: WorkspaceSelection): void => enqueue((m) => m.show(address, selection)),
  /** Closes a file. Edits not yet reported are reported first. */
  close: (address: string): void =>
    enqueue((m) => {
      flush(address);
      m.close(address);
    }),
  /** Follows a rename or move of a file or folder. */
  rename: (from: string, to: string): void =>
    enqueue((m) => {
      flush();
      for (const [key, timer] of [...timers]) {
        if (key === from || key.startsWith(`${from}/`)) {
          window.clearTimeout(timer);
          timers.delete(key);
        }
      }
      m.rename(from, to);
    }),
  /** Replaces the text of a file with a change made elsewhere. */
  update: (address: string, text: string, version?: string): void =>
    enqueue((m) => {
      window.clearTimeout(timers.get(address));
      timers.delete(address);
      m.update(address, text, version);
    }),
  /** Sets the project context: background files, tsconfig, package.json. */
  setContext: (context: WorkspaceContext): void =>
    enqueue((m) => {
      m.setContext(context);
      if (context.packageJson !== undefined) packages?.sync(context.packageJson);
    }),
  /** The text of an open or background file. */
  getText: (address: string): string | undefined => models?.getText(address),
  /** The addresses of the open files. */
  openAddresses: (): string[] => models?.openAddresses ?? [],
  /** Moves keyboard focus into the editor. */
  focus: (): void => editorRef.value?.focus(),
});
</script>

<template>
  <div ref="containerRef" class="q-files-editor" style="width: 100%; height: 100%" />
</template>
