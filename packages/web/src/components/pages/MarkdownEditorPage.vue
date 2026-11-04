<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

const { props } = useQEditorPropsFromQuery("markdown");

// Markdown as sent from parent window (or the URL hash).
const code = ref<string>(props.value.code ?? "");

function handleCodeChange(data: QEditorChangeEventData): void {
  if (props.value.readOnly) {
    return;
  }
  // Keep the prop in sync with the editor: otherwise a later set-data with the previous
  // value would be no change for Vue and the editor would ignore it.
  code.value = data.code ?? "";
  PageHelpers.sendOnChangeMessage(data);
}

function handleMessageFromParent(event: MessageEvent): void {
  if (event.data?.type === "set-data") {
    code.value = event.data.code ?? "";
  }
}

onMounted(() => {
  PageHelpers.addParentListener(handleMessageFromParent);
  PageHelpers.sendIframeReadyMessage();
});

onBeforeUnmount(() => {
  PageHelpers.removeParentListener(handleMessageFromParent);
});
</script>
<template>
  <MarkdownEditor :code="code" :read-only="props.readOnly" @on-change="handleCodeChange" />
</template>
