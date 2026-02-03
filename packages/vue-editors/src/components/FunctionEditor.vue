<script setup lang="ts">
interface FunctionEditorProps {
  /** Optional code to display for context. */
  code?: string;
  /** If true, editor is read-only. */
  readOnly?: boolean;
  /** Language hint for the code. */
  lang?: string;
}

withDefaults(defineProps<FunctionEditorProps>(), {
  code: "",
  readOnly: false,
  lang: "javascript",
});
</script>

<template>
  <div
    class="d-flex flex-column align-items-center justify-content-center"
    style="height: 100%; padding: 40px; text-align: center;"
  >
    <h1>Function Editor</h1>
    <p style="margin-top: 20px; color: #666;">
      Editor for a single function within a class
    </p>
    <p style="margin-top: 10px; color: #999;">
      Placeholder - Coming soon
    </p>
  </div>
</template>
