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
  theme: "vs-dark",
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
  (event: "on-editor-mount", data: QEditorMountEventData): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const editorRef = shallowRef<any | null>(null);
const monacoRef = shallowRef<any | null>(null);
const debounceTimeoutRef = { value: 0 as number };

const exposeApi = {
  getValue: (): string => editorRef.value?.getValue() ?? "",
  triggerSuggest: (): void => {
    editorRef.value?.trigger("keyboard", "editor.action.triggerSuggest", null);
  },
};

defineExpose(exposeApi);

function scheduleEmit(code: string, cursorPosition?: CursorPosition): void {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    emit("on-change", { code, cursorPosition: cursorPosition ?? undefined });
  }, 250);
}

async function initializeEditor(): Promise<void> {
  if (!containerRef.value) {
    return;
  }

  const monacoInstance = await loader.init();
  monacoRef.value = monacoInstance;

  editorRef.value = monacoInstance.editor.create(containerRef.value, {
    value: props.code ?? "",
    language: props.lang ?? "javascript",
    theme: props.theme ?? "vs-dark",
    readOnly: props.readOnly ?? false,
    automaticLayout: true,
    ...(props.options ?? {}),
  });

   monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

   const editor = editorRef.value;
   if (editor) {
     const model = editor.getModel();
     if (model) {
       model.updateOptions({ tabSize: 2, insertSpaces: true });
     }
   }

  emit("on-editor-mount", { editor: editorRef.value, api: monacoInstance });

  editorRef.value!.onDidChangeModelContent(() => {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }
    const newCode = editor.getValue() || "";
    scheduleEmit(newCode, editor.getPosition() ?? null);
  });
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
  if (editorRef.value) {
    editorRef.value.dispose();
    editorRef.value = null;
  }
});
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100%" />
</template>
