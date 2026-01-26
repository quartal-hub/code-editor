<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MonacoEditor from "./MonacoEditor.vue";

type ExpressionMode = "plain" | "excel";

interface ExpressionEditorProps {
  code?: string;
  lang?: string;
  mode?: ExpressionMode;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  code: "",
  lang: "javascript",
  mode: "excel",
  readOnly: false,
});

const emit = defineEmits<{
  (event: "code-change", code: string): void;
  (event: "draft-change", code: string): void;
  (event: "commit", code: string): void;
  (event: "monaco-mount", monacoInstance: unknown): void;
}>();

function tempTrimCode(code: string | undefined): string {
  let trimmedCode = code?.trim() ?? "";
  if (!code) return "";
  if (trimmedCode.startsWith("return ")) {
    trimmedCode = trimmedCode.slice(6).trim();
  }
  return trimmedCode;
}

const originalCode = ref<string>(tempTrimCode(props.code));
const currentCode = ref<string>(tempTrimCode(props.code));
const editorRef = ref<{ getValue: () => string; triggerSuggest: () => void } | null>(null);

watch(
  () => [props.code, props.mode],
  () => {
    const nextCode = tempTrimCode(props.code);
    const wasSynced = currentCode.value === originalCode.value;
    originalCode.value = nextCode;

    if (props.mode === "excel") {
      if (wasSynced) {
        currentCode.value = nextCode;
      }
    } else {
      currentCode.value = nextCode;
    }
  },
  { immediate: true }
);

const options = {
  lineNumbers: "off",
  glyphMargin: false,
  folding: false,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  renderLineHighlight: "none",
  wordWrap: "on",
  contextmenu: false,
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  tabSize: 2,
  padding: { top: 10, bottom: 10 },
} as const;

const isPlainMode = computed(() => props.mode === "plain");

function handlePlainModeChange(newCode: string): void {
  currentCode.value = newCode;
  emit("code-change", newCode);
}

function handleCheck(): void {
  const newCode = editorRef.value?.getValue() ?? currentCode.value;
  originalCode.value = newCode;
  currentCode.value = newCode;
  emit("commit", newCode);
}

function handleClose(): void {
  currentCode.value = originalCode.value;
}

function handleFunction(): void {
  editorRef.value?.triggerSuggest();
}

function handleExcelModeChange(newCode: string): void {
  currentCode.value = newCode;
  emit("draft-change", newCode);
}

function handleMonacoMount(monacoInstance: unknown): void {
  emit("monaco-mount", monacoInstance);
}
</script>

<template>
  <div v-if="isPlainMode" class="h-100">
    <MonacoEditor
      :code="currentCode"
      :lang="props.lang"
      :read-only="props.readOnly"
      theme="vs-light"
      :options="options"
      @code-change="handlePlainModeChange"
      @monaco-mount="handleMonacoMount"
    />
  </div>
  <div v-else class="h-100">
    <div class="p-2 d-flex align-items-start" style="background-color: var(--bs-gray-200);">
      <div class="btn-group me-2 flex-shrink-0 flex-grow-0">
        <button
          class="btn btn-outline-primary p-2 pb-1"
          type="button"
          title="Apply changes"
          :disabled="props.readOnly"
          @click="handleCheck"
        >
          <span class="material-symbols-outlined text-success">check</span>
        </button>
        <button
          class="btn btn-outline-primary p-2 pb-1"
          type="button"
          title="Reset to original"
          :disabled="props.readOnly"
          @click="handleClose"
        >
          <span class="material-symbols-outlined text-danger">close</span>
        </button>
        <button
          class="btn btn-outline-primary p-2 pb-1"
          type="button"
          title="Show autocomplete"
          :disabled="props.readOnly"
          @click="handleFunction"
        >
          <span class="material-symbols-outlined">function</span>
        </button>
      </div>
      <div
        class="flex-shrink-1 flex-grow-1 border border-primary position-relative rounded p-1 ps-4 bg-white"
        style="height: 120px;"
      >
        <span
          class="position-absolute badge text-primary"
          style="top: 2px; left: -6px; font-size: 1.5rem; font-weight: bold;"
        >=</span>
        <div class="h-100">
          <MonacoEditor
            ref="editorRef"
            :code="currentCode"
            :lang="props.lang"
            :read-only="props.readOnly"
            theme="vs-light"
            :options="options"
            @code-change="handleExcelModeChange"
            @monaco-mount="handleMonacoMount"
          />
        </div>
      </div>
    </div>
  </div>
</template>
