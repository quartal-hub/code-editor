<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ClassEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData, QEditorProps } from "@quartal/code-editors-core";

/** Properties that adre passed to the component. */
const editorProps = ref<QEditorProps | undefined>(undefined);
/** Up to date code whereas editorProps.code remains as the same as passed in set-data event. */
const updatedCode = ref<string | undefined>(undefined);

const { props } = useQEditorPropsFromQuery("class");

function notifyParent(codeValue: string, cursorPosition?: QEditorChangeEventData["cursorPosition"]): void {
  if (window.self !== window.top) {
    try {
      window.parent.postMessage({ type: "on-change", code: codeValue, cursorPosition }, "*");
    } catch (error) {
      console.warn("Could not send code update to parent window:", error);
    }
  }
}

function handleCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  updatedCode.value = nextCode;
  notifyParent(nextCode, data.cursorPosition);
}

const messageHandler = (event: MessageEvent): void => {
  if (event?.data?.type !== "set-data") {
    return;
  }
  editorProps.value = event.data.data as QEditorProps;
  updatedCode.value = editorProps.value?.code ?? "";
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
    <ClassEditor v-if="editorProps" :code="editorProps.code ?? ''" :read-only="editorProps.readOnly"
      :view="editorProps.view as 'single-class' | 'multi-class'" @on-change="handleCodeChange" />
    <div v-else class="d-flex align-items-center justify-content-center" style="height: 100%;">
      <div class="spinner-border" role="status"></div>
      <span class="ms-2">Waiting for class code...</span>
    </div>
  </div>
</template>
