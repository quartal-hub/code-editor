<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ExpressionEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

const { props } = useQEditorPropsFromQuery("expression");

// Code as sent from parent window.
const code = ref<string>("");
// Code as updated by this editor after sent from parent window.
const updatedCode = ref<string>("");

const view = computed<"plain" | "excel">(() => (props.value.view === "plain" ? "plain" : "excel"));
const readOnly = computed(() => Boolean(props.value.readOnly));
const lang = computed(() => props.value.lang ?? "javascript");

function handleChange(data: QEditorChangeEventData): void {
  if (props.value.readOnly) {
    return;
  }
  updatedCode.value = data.code ?? "";
  PageHelpers.sendOnChangeMessage(data);
}

function handleMessageFromParent(event: MessageEvent): void {
  if (event?.data?.type !== "set-data") {
    return;
  }
  code.value = event.data.code ?? "";
  updatedCode.value = code.value;
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
  <ExpressionEditor
    :code="code"
    :lang="lang"
    :view="view"
    :read-only="readOnly"
    @on-change="handleChange"
  />
</template>
