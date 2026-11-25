<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import loader from "@monaco-editor/loader";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";

// TODO: Check if we can get the MonacoEditor type from the monaco-types package.
//       If not => Remove monaco-type dependency.

type CursorPosition = { lineNumber: number; column: number } | null;

 interface MonacoEditorProps {
  /** The language of the code to show in the editor. */
  lang?: string;
  /** If true, the editor is read only. */
  readOnly?: boolean;
  /** The code to show in the editor. */
  code?: string;
  /**
   * The original code to compare the code against. When set (also an empty string), the editor is a side-by-side diff editor:
   * the original on the left (read-only), the code on the right. Long runs of unchanged lines are collapsed
   * (hideUnchangedRegions; turn it off with options). Undefined or null shows the plain editor.
   */
  original?: string | null;
  /** The URL of the code to show in the editor. Alternative to code. Must allow CORS (or be on the Code UI site); there is no proxy. */
  url?: string;
  /** Extra Monaco editor options to merge into the editor options. */
  options?: Record<string, unknown>;
  /**
   * The theme of the editor.
   * Default is "vs-dark", typically the other value would be "vs-light", but it can be any valid Monaco theme.
   */
  theme?: string;
}

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  lang: "javascript",
  readOnly: false,
  code: "",
  original: undefined,
  theme: "vs-dark",
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
  (event: "on-editor-mount", data: QEditorMountEventData): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
/** The editor of the code: the editor itself, or the modified (right) side of the diff editor. */
const editorRef = shallowRef<any | null>(null);
/** The diff editor and its original model, when in diff mode. */
const diffEditorRef = shallowRef<any | null>(null);
const originalModelRef = shallowRef<any | null>(null);
const monacoRef = shallowRef<any | null>(null);
const debounceTimeoutRef = { value: 0 as number };

const exposeApi = {
  getValue: (): string => editorRef.value?.getValue() ?? "",
  triggerSuggest: (): void => {
    editorRef.value?.trigger("keyboard", "editor.action.triggerSuggest", null);
  },
};

defineExpose(exposeApi);

function isDiff(original: string | null | undefined): original is string {
  return typeof original === "string";
}

function scheduleEmit(code: string, cursorPosition?: CursorPosition): void {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    emit("on-change", { code, cursorPosition: cursorPosition ?? undefined });
  }, 250);
}

function disposeEditor(): void {
  if (diffEditorRef.value) {
    const model = diffEditorRef.value.getModel();
    diffEditorRef.value.dispose();
    model?.original?.dispose();
    model?.modified?.dispose();
    diffEditorRef.value = null;
    originalModelRef.value = null;
  } else if (editorRef.value) {
    editorRef.value.dispose();
  }
  editorRef.value = null;
}

/** Creates the plain editor or the diff editor, depending on the original. */
function createEditor(): void {
  const monacoInstance = monacoRef.value;
  if (!containerRef.value || !monacoInstance) {
    return;
  }
  const baseOptions = {
    theme: props.theme ?? "vs-dark",
    readOnly: props.readOnly ?? false,
    automaticLayout: true,
    ...(props.options ?? {}),
  };
  const lang = props.lang ?? "javascript";

  if (isDiff(props.original)) {
    const diffEditor = monacoInstance.editor.createDiffEditor(containerRef.value, {
      originalEditable: false,
      // Long runs of unchanged lines are collapsed (click to expand); the options prop can turn this off.
      hideUnchangedRegions: { enabled: true, contextLineCount: 3, minimumLineCount: 3 },
      ...baseOptions,
    });
    const originalModel = monacoInstance.editor.createModel(props.original, lang);
    const modifiedModel = monacoInstance.editor.createModel(props.code ?? "", lang);
    diffEditor.setModel({ original: originalModel, modified: modifiedModel });
    diffEditorRef.value = diffEditor;
    originalModelRef.value = originalModel;
    editorRef.value = diffEditor.getModifiedEditor();
  } else {
    editorRef.value = monacoInstance.editor.create(containerRef.value, {
      ...baseOptions,
      value: props.code ?? "",
      language: lang,
    });
  }

  const editor = editorRef.value;
  editor.getModel()?.updateOptions({ tabSize: 2, insertSpaces: true });

  emit("on-editor-mount", { editor, api: monacoInstance });

  editor.onDidChangeModelContent(() => {
    if (editorRef.value !== editor) {
      return;
    }
    scheduleEmit(editor.getValue() || "", editor.getPosition() ?? null);
  });
}

async function initializeEditor(): Promise<void> {
  if (!containerRef.value) {
    return;
  }

  const monacoInstance = await loader.init();
  monacoRef.value = monacoInstance;

  monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  createEditor();
}

onMounted(() => {
  void initializeEditor();
});

watch(
  () => props.lang,
  (lang) => {
    const editor = editorRef.value;
    const monacoInstance = monacoRef.value;
    if (!editor || !monacoInstance || !lang) {
      return;
    }
    const model = editor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, lang);
    }
    if (originalModelRef.value) {
      monacoInstance.editor.setModelLanguage(originalModelRef.value, lang);
    }
  }
);

watch(
  () => props.original,
  (original, previous) => {
    if (!monacoRef.value) {
      return;
    }
    if (isDiff(original) !== isDiff(previous)) {
      // Plain <=> diff: Monaco has separate editors for these, so the editor is created again.
      disposeEditor();
      createEditor();
    } else if (isDiff(original) && originalModelRef.value && originalModelRef.value.getValue() !== original) {
      originalModelRef.value.setValue(original);
    }
  }
);

watch(
  () => [props.readOnly, props.options],
  () => {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }
    editor.updateOptions({
      readOnly: props.readOnly ?? false,
      ...(props.options ?? {}),
    });
  },
  { deep: true }
);

watch(
  () => props.code,
  (code) => {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }
    const nextValue = code ?? "";
    if (editor.getValue() !== nextValue) {
      editor.setValue(nextValue);
    }
  }
);

watch(
  () => props.theme,
  (theme) => {
    const monacoInstance = monacoRef.value;
    if (monacoInstance && theme) {
      monacoInstance.editor.setTheme(theme);
    }
  }
);

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimeoutRef.value);
  disposeEditor();
});
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100%" />
</template>
