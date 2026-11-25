<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MonacoEditor } from "vue-editors";
import { useQEditorPropsFromQuery } from "@/composables";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

const { props } = useQEditorPropsFromQuery("monaco");

// Code as sent from parent window, kept in sync with the user's edits.
// If it were not, a later set-data with the previous value would be no change for Vue and the editor would ignore it.
const code = ref<string>("");
// Read-only state sent by the parent as a set-data message. Overrides the read-only query parameter.
const readOnlyFromParent = ref<boolean | undefined>(undefined);
const readOnly = computed<boolean>(() => readOnlyFromParent.value ?? props.value.readOnly ?? false);
// Original code sent by the parent: when a string, the editor shows a diff of the original (left) and the code (right).
const original = ref<string | null>(null);

// The Monaco API (set when the editor has mounted) and the JSON schema options sent by the parent.
let monacoApi: any = undefined;
let schemaOptions: string | undefined = undefined;

/**
 * Applies the JSON schema options to Monaco: A JSON string of the diagnostics options,
 * e.g. { "validate": true, "schemas": [...] } (see monaco.languages.json.jsonDefaults.setDiagnosticsOptions).
 */
function applySchema(): void {
  if (!monacoApi || !schemaOptions) {
    return;
  }
  try {
    monacoApi.languages.json.jsonDefaults.setDiagnosticsOptions(JSON.parse(schemaOptions));
  } catch (error) {
    console.error("Invalid JSON schema options from parent", error);
  }
}

function handleEditorMount(data: QEditorMountEventData): void {
  monacoApi = data.api;
  applySchema();
}

function handleCodeChange(data: QEditorChangeEventData): void {
  if (readOnly.value) {
    return;
  }
  code.value = data.code ?? "";
  PageHelpers.sendOnChangeMessage(data);
}

/**
 * Messages from the parent: `{ type: "set-data", code?, original?, schema?, readOnly? }`.
 * Each field is optional: Only the fields that are present are changed.
 * `original` as a string turns the editor into a diff editor; `original: null` turns it back to the plain editor.
 */
function handleMessageFromParent(event: MessageEvent): void {
  const data = event.data;
  if (data?.type !== "set-data") {
    return;
  }
  if ("code" in data) {
    code.value = data.code ?? "";
  }
  if ("original" in data) {
    original.value = typeof data.original === "string" ? data.original : null;
  }
  if ("readOnly" in data) {
    readOnlyFromParent.value = data.readOnly === true || data.readOnly === "true";
  }
  if (data.schema) {
    schemaOptions = data.schema;
    applySchema();
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
  <MonacoEditor :code="code" :lang="props.lang" :original="original" :read-only="readOnly" @on-change="handleCodeChange" @on-editor-mount="handleEditorMount" />
</template>
