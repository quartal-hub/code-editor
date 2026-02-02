<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { ExpressionEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

const { props, updateCode } = useQEditorPropsFromQuery("expression");

const view = computed<"plain" | "excel">(() => (props.value.view === "plain" ? "plain" : "excel"));
const readOnly = computed(() => Boolean(props.value.readOnly));
const code = computed(() => props.value.code ?? "");
const lang = computed(() => props.value.lang ?? "javascript");

function notifyParent(codeValue: string, cursorPosition?: QEditorChangeEventData["cursorPosition"]): void {
  if (window.self !== window.top) {
    try {
      if (readOnly.value) {
        return;
      }
      window.parent.postMessage({ type: "on-change", code: codeValue, cursorPosition }, "*");
    } catch (error) {
      console.warn("Could not send code update to parent window:", error);
    }
  }
}

function handleChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  if (props.value.mode === "code") {
    updateCode(nextCode);
  }
  notifyParent(nextCode, data.cursorPosition);
}

function handleMessage(event: MessageEvent): void {
  if (event?.data?.type !== "set-data") {
    return;
  }
  if (event.data.code !== undefined) {
    updateCode(String(event.data.code));
  } else if (event.data.data !== undefined) {
    updateCode(String(event.data.data));
  }
}

onMounted(() => {
  window.addEventListener("message", handleMessage);
  if (window.self !== window.top && props.value.mode === "events") {
    window.parent.postMessage({ type: "editor-ready" }, "*");
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage);
});
</script>

<template>
  <ExpressionEditor
    :code="code"
    :lang="lang"
    :mode="view"
    :read-only="readOnly"
    @on-change="handleChange"
  />
</template>
