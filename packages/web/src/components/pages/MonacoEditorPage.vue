<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { MonacoEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

const { props, updateCode } = useQEditorPropsFromQuery("monaco");

function handleCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  if (props.value.mode === "code") {
    updateCode(nextCode);
  }
  if (props.value.readOnly) {
    return;
  }
  if (window.self !== window.top) {
    window.parent.postMessage({ type: "on-change", code: nextCode, cursorPosition: data.cursorPosition }, "*");
  }
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
  <MonacoEditor :code="props.code" :lang="props.lang" :read-only="props.readOnly" @on-change="handleCodeChange" />
</template>