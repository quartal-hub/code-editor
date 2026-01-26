<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ClassEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";

const { props, updateCode, isLoading } = useQEditorPropsFromQuery("class");
const localCode = ref<string>(props.value.code ?? "");

watch(
  () => props.value.code,
  (code) => {
    localCode.value = code ?? "";
  },
  { immediate: true }
);

function notifyParent(codeValue: string): void {
  if (window.self !== window.top) {
    try {
      window.parent.postMessage({ code: codeValue }, "*");
    } catch (error) {
      console.warn("Could not send code update to parent window:", error);
    }
  }
}

function handleCodeChange(newCode: string): void {
  localCode.value = newCode;
  updateCode(newCode);
  notifyParent(newCode);
}

const messageHandler = (event: MessageEvent): void => {
  if (event?.data?.code !== undefined) {
    localCode.value = String(event.data.code);
  }
};

onMounted(() => {
  window.addEventListener("message", messageHandler);

  if (window.self !== window.top) {
    window.parent.postMessage({ loaded: true }, "*");
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("message", messageHandler);
});
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else class="h-100" style="min-height: 0;">
    <ClassEditor :code="localCode" :read-only="props.mode === 'read-only'" @code-change="handleCodeChange" />
  </div>
</template>
