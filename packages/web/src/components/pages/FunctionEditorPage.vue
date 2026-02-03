<script setup lang="ts">
import { computed } from "vue";
import { FunctionEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";

const { props } = useQEditorPropsFromQuery("function");

const readOnly = computed(() => Boolean(props.value.readOnly));
const code = computed(() => props.value.code ?? "");
const lang = computed(() => props.value.lang ?? "javascript");
</script>

<template>
  <FunctionEditor :code="code" :lang="lang" :read-only="readOnly" />
</template>
