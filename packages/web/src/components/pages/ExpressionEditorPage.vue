<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ExpressionEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";

const { props, updateCode, isLoading } = useQEditorPropsFromQuery("expression");

const mode = computed<"plain" | "excel">(() => (props.value.mode === "plain" ? "plain" : "excel"));
const readOnly = computed(() => props.value.mode === "read-only");
const code = computed(() => props.value.code ?? "");
const lang = computed(() => props.value.lang ?? "javascript");

function notifyParent(codeValue: string): void {
  if (window.self !== window.top) {
    try {
      window.parent.postMessage({ code: codeValue }, "*");
    } catch (error) {
      console.warn("Could not send code update to parent window:", error);
    }
  }
}

function handlePlainChange(newCode: string): void {
  if (mode.value !== "plain") return;
  updateCode(newCode);
  notifyParent(newCode);
}

function handleCommit(newCode: string): void {
  if (mode.value !== "excel") return;
  updateCode(newCode);
  notifyParent(newCode);
}

onMounted(() => {
  if (window.self !== window.top) {
    window.parent.postMessage({ loaded: true }, "*");
  }
});
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <ExpressionEditor
    v-else
    :code="code"
    :lang="lang"
    :mode="mode"
    :read-only="readOnly"
    @code-change="handlePlainChange"
    @commit="handleCommit"
  />
</template>
