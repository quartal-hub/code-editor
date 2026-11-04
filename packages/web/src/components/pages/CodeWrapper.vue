<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { ClassEditor, ExpressionEditor, FunctionEditor, MarkdownEditor, MarkdownHybridEditor, MonacoEditor } from "vue-editors";
import { PageHelpers } from "@/helpers";

const props = defineProps<{
  editor: "monaco" | "expression" | "class" | "function" | "markdown" | "markdown-hybrid";
}>();

const code = ref<string>("");
const lang = ref<string | undefined>(undefined);
const view = ref<string | undefined>(undefined);
const readOnly = ref<boolean>(false);

const isUpdatingHash = ref(false);
const debounceTimeoutRef = { value: 0 as number };

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === "") {
    return undefined;
  }
  const normalized = value.toLowerCase().trim();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
}

function readPropsFromLocation(): void {
  if (isUpdatingHash.value) {
    isUpdatingHash.value = false;
    return;
  }
  const values = PageHelpers.getPropsFromLocation(props.editor);
  code.value = values.code ?? "";
  lang.value = values.lang ?? undefined;
  view.value = values.view ?? undefined;
  readOnly.value = values.readOnly ?? false;
}

function scheduleHashUpdate(nextCode: string): void {
  window.clearTimeout(debounceTimeoutRef.value);
  debounceTimeoutRef.value = window.setTimeout(() => {
    isUpdatingHash.value = true;
    PageHelpers.updateToHash("code", nextCode);
  }, 250);
}

function handleCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  code.value = nextCode;
  scheduleHashUpdate(nextCode);
}

const expressionView = computed<"plain" | "excel">(() =>
  view.value === "plain" ? "plain" : "excel"
);

onMounted(() => {
  readPropsFromLocation();
  PageHelpers.addHashChangeListener(readPropsFromLocation);
});

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimeoutRef.value);
  PageHelpers.removeHashChangeListener(readPropsFromLocation);
});
</script>

<template>
  <ExpressionEditor
    v-if="props.editor === 'expression'"
    :code="code"
    :lang="lang"
    :view="expressionView"
    :read-only="readOnly"
    @on-change="handleCodeChange"
  />
  <ClassEditor
    v-else-if="props.editor === 'class'"
    :code="code"
    :lang="lang"
    :read-only="readOnly"
    :view="view as 'single-class' | 'multi-class'"
    @on-change="handleCodeChange"
  />
  <FunctionEditor
    v-else-if="props.editor === 'function'"
    :code="code"
    :lang="lang"
    :read-only="readOnly"
  />
  <MarkdownEditor
    v-else-if="props.editor === 'markdown'"
    :code="code"
    :read-only="readOnly"
    @on-change="handleCodeChange"
  />
  <MarkdownHybridEditor
    v-else-if="props.editor === 'markdown-hybrid'"
    :code="code"
    :read-only="readOnly"
    @on-change="handleCodeChange"
  />
  <MonacoEditor
    v-else
    :code="code"
    :lang="lang"
    :read-only="readOnly"
    @on-change="handleCodeChange"
  />
</template>
