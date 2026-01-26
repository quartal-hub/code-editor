<script setup lang="ts">
import { MonacoEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";

const { props, updateCode, isLoading } = useQEditorPropsFromQuery("monaco");

function handleCodeChange(newCode: string): void {
  updateCode(newCode);
}

</script>
<template>
  <div v-if="isLoading">Loading...</div>
  <MonacoEditor v-else :code="props.code" :lang="props.lang" :read-only="props.mode === 'read-only'"
    @code-change="handleCodeChange" />
</template>