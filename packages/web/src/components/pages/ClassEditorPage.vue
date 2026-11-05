<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ClassEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData, QEditorProps } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

/** Properties that adre passed to the component. */
const editorProps = ref<QEditorProps | undefined>(undefined);
/** Up to date code whereas editorProps.code remains as the same as passed in set-data event. */
const updatedCode = ref<string | undefined>(undefined);

const { props } = useQEditorPropsFromQuery("class");

function notifyParent(codeValue: string, cursorPosition?: QEditorChangeEventData["cursorPosition"]): void {
  PageHelpers.sendOnChangeMessage({ code: codeValue, cursorPosition });
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
  editorProps.value = event.data as QEditorProps;
  updatedCode.value = editorProps.value?.code ?? "";
};

onMounted(() => {
  PageHelpers.addParentListener(messageHandler);
  PageHelpers.sendIframeReadyMessage();
});

onBeforeUnmount(() => {
  PageHelpers.removeParentListener(messageHandler);
});
</script>

<template>
  <div class="h-100" style="min-height: 0;">
    <ClassEditor v-if="editorProps" :code="editorProps.code ?? ''" :read-only="editorProps.readOnly ?? props.readOnly"
      :view="(editorProps.view ?? props.view) as 'single-class' | 'multi-class'" @on-change="handleCodeChange" />
    <div v-else class="d-flex align-items-center justify-content-center" style="height: 100%;">
      <div class="spinner-border" role="status"></div>
      <span class="ms-2">Waiting for class code...</span>
    </div>
  </div>
</template>
