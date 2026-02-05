<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MonacoEditor from "./MonacoEditor.vue";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";

type ExpressionMode = "plain" | "excel";

interface ExpressionEditorProps {
  code?: string;
  lang?: string;
  view?: ExpressionMode;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  code: "",
  lang: "javascript",
  view: "excel",
  readOnly: false,
});

const emit = defineEmits<{
  (event: "on-change", data: Partial<QEditorChangeEventData>): void;
  (event: "on-editor-mount", data: QEditorMountEventData): void;
}>();

function tempTrimCode(code: string | undefined): {
  /** The code to set in the editor. */
  nextCode: string;
  /**
   * Whether the "return " prefix was trimmed from the code.
   * Whitespace trimming does not affect this value.
   */
  isTrimmed: boolean;
} {
  let trimmedCode = code?.trim() ?? "";
  if (!trimmedCode) {
    return { nextCode: "", isTrimmed: false }
  };
  if (trimmedCode.startsWith("return ")) {
    return { nextCode: trimmedCode.slice(6).trim(), isTrimmed: true };
  }
  return { nextCode: trimmedCode, isTrimmed: false };
}

const isCodeTrimmed = ref<boolean>(false);
const originalCode = ref<string>("");
const currentCode = ref<string>("");
setCurrentCode(props.code);

const editorRef = ref<{ getValue: () => string; triggerSuggest: () => void } | null>(null);

watch(
  () => [props.code, props.view],
  () => {
    setCurrentCode(props.code);
  },
  { immediate: true }
);

function setCurrentCode(nextCodeRaw: string): void {
  const { nextCode, isTrimmed } = tempTrimCode(nextCodeRaw);
  const wasSynced = currentCode.value === originalCode.value;
  originalCode.value = nextCode;
  isCodeTrimmed.value = isTrimmed;

  if (props.view === "excel") {
    if (wasSynced) {
      // TODO: Do not understand this. Test how it works / what is this  if(wasSynced) => (seems to work though...).
      currentCode.value = nextCode;
    }
  } else {
    currentCode.value = nextCode;
  }
}

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

const isPlainMode = computed(() => props.view === "plain");

function handlePlainModeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  currentCode.value = nextCode;
  emit("on-change", { code: nextCode });
}

function handleCheck(): void {
  const newCode = editorRef.value?.getValue() ?? currentCode.value;
  originalCode.value = newCode;
  currentCode.value = newCode;
  let sendCode = newCode;
  if (isCodeTrimmed.value) {
    sendCode = `return ${sendCode}`;
  }
  emit("on-change", { code: sendCode });
}

function handleClose(): void {
  currentCode.value = originalCode.value;
}

function handleFunction(): void {
  editorRef.value?.triggerSuggest();
}

function handleExcelModeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  currentCode.value = nextCode;
}

function handleEditorMount(data: QEditorMountEventData): void {
  emit("on-editor-mount", data);
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
      @on-change="handlePlainModeChange"
      @on-editor-mount="handleEditorMount"
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
            @on-change="handleExcelModeChange"
            @on-editor-mount="handleEditorMount"
          />
        </div>
      </div>
    </div>
  </div>
</template>
