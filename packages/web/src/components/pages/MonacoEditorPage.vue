<script setup lang="ts">
import { MonacoEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

const { props, updateCode, isLoading } = useQEditorPropsFromQuery("monaco");

function handleCodeChange(data: QEditorChangeEventData): void {
  updateCode(data.code ?? "");
  window.parent.postMessage(data, "*");
}

</script>
<template>
  <div v-if="isLoading">Loading...</div>
  <MonacoEditor v-else :code="props.code" :lang="props.lang" :read-only="props.mode === 'read-only'"
    @on-change="handleCodeChange" />
</template>