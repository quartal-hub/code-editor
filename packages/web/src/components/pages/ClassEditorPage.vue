<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ClassEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

const { props, updateCode } = useQEditorPropsFromQuery("class");
const localCode = ref<string>(props.value.code ?? "");

watch(
  () => props.value.code,
  (code) => {
    localCode.value = code ?? "";
  },
  { immediate: true }
);

function notifyParent(codeValue: string, cursorPosition?: QEditorChangeEventData["cursorPosition"]): void {
  if (window.self !== window.top) {
    try {
      if (props.value.readOnly) {
        return;
      }
      window.parent.postMessage({ type: "on-change", code: codeValue, cursorPosition }, "*");
    } catch (error) {
      console.warn("Could not send code update to parent window:", error);
    }
  }
}

function handleCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  localCode.value = nextCode;
  if (props.value.mode === "code") {
    updateCode(nextCode);
  }
  notifyParent(nextCode, data.cursorPosition);
}

const messageHandler = (event: MessageEvent): void => {
  if (event?.data?.type !== "set-data") {
    return;
  }
  if (event.data.code !== undefined) {
    localCode.value = String(event.data.code);
    return;
  }
  if (event.data.data !== undefined) {
    localCode.value = String(event.data.data);
  }
};

onMounted(() => {
  window.addEventListener("message", messageHandler);

  if (window.self !== window.top && props.value.mode === "events") {
    window.parent.postMessage({ type: "editor-ready" }, "*");
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("message", messageHandler);
});
</script>

<template>
  <div class="h-100" style="min-height: 0;">
    <ClassEditor :code="localCode" :read-only="props.readOnly" @on-change="handleCodeChange" />
  </div>
</template>
