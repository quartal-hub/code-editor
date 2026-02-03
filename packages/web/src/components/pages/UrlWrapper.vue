<script lang="ts" setup>
import { useQEditorPropsFromQuery } from '@/composables';
import { PageHelpers } from '@/helpers';
import { computed, ref, watch } from 'vue';

import { MonacoEditor, ExpressionEditor, ClassEditor } from 'vue-editors';

/** Only static parameters coming from Astro, rest are fetched from the query parameters / hash. */
const props = defineProps<{
  /** Type of the editor to show. */
  editor: "monaco" | "expression" | "class";
}>();

const isLoading = ref<boolean>(true);
const error = ref<string>('');
const code = ref<string>('');

const { props: urlProps } = useQEditorPropsFromQuery(props.editor);

async function fetchCodeFromUrl(targetUrl: string | undefined) {
  isLoading.value = true;
  error.value = '';
  try {
    code.value = await PageHelpers.fetchCodeFromUrl(targetUrl);
  } catch (ex) {
    error.value = (ex as Error).message;
  } finally {
    isLoading.value = false;
  }
}

fetchCodeFromUrl(urlProps.value.url);

// Read-only if true or undefined (default)
const readOnly = computed(() => urlProps.value.readOnly !== false);
watch(() => urlProps.value.url, () => {
  fetchCodeFromUrl(urlProps.value.url);
});

</script>

<template>
  <div v-if="isLoading">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
  <div v-else-if="error">
    <div class="alert alert-danger mx-auto w-50 mt-5">
      <strong>Error loading content from URL: {{ urlProps.url }}</strong>
      <br/> {{ error }}
    </div>
  </div>
  <ExpressionEditor v-else-if="editor === 'expression'" :code="code" :lang="urlProps.lang" :read-only="readOnly" />
  <ClassEditor v-else-if="editor === 'class'" :code="code" :lang="urlProps.lang" :read-only="readOnly" :view="urlProps.view as 'single-class' | 'multi-class'" />
  <MonacoEditor v-else :code="code" :lang="urlProps.lang" :read-only="readOnly" />
</template>