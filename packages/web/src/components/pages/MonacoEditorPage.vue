<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MonacoEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

const { props } = useQEditorPropsFromQuery("monaco");

// Code as sent from parent window.
const code = ref<string>("");
// Code as updated by this editor after sent from parent window.
const updatedCode = ref<string>("");

function handleCodeChange(data: QEditorChangeEventData): void {
  if (props.value.readOnly) {
    return;
  }
  updatedCode.value = data.code ?? "";
  PageHelpers.sendOnChangeMessage(data);
}

function handleMessageFromParent(event: MessageEvent): void {
  if (event.data?.type === "set-data") {
    updatedCode.value = event.data.code ?? "";
    code.value = updatedCode.value;
    return;
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
  <MonacoEditor :code="code" :lang="props.lang" :read-only="props.readOnly" @on-change="handleCodeChange" />
</template>