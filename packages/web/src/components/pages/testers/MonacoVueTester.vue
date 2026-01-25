<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { MonacoEditor } from "vue-editors";
import { getMonacoExamples } from "@/examples/getMonacoExamples";
import type { QEditorExample } from "@/examples/QEditorExample";

const examples: QEditorExample[] = getMonacoExamples();
const activeIndex = ref<number>(0);
const loading = ref<boolean>(false);
const code = ref<string>(examples[0]?.props.code ?? "");
const lang = ref<string | undefined>(examples[0]?.props.lang);
const readOnly = ref<boolean>(examples[0]?.props.mode === "read-only");
const url = ref<string | undefined>(examples[0]?.props.url);

const activeExample = computed(() => examples[activeIndex.value]);

async function fetchCodeFromUrl(targetUrl: string): Promise<void> {
  loading.value = true;
  try {
    const response = await fetch(targetUrl);
    const text = await response.text();
    code.value = text;
  } catch (error) {
    console.error("Error fetching code from URL:", error);
  } finally {
    loading.value = false;
  }
}

function applyExample(example: QEditorExample): void {
  const props = example.props;
  lang.value = props.lang;
  url.value = props.url;
  readOnly.value = props.mode === "read-only" || Boolean(props.url);

  if (props.url) {
    void fetchCodeFromUrl(props.url);
    return;
  }

  code.value = props.code ?? "";
}

function selectExample(index: number): void {
  activeIndex.value = index;
}

function handleCodeChange(newCode: string): void {
  code.value = newCode;
}

watch(activeExample, (example) => {
  if (example) {
    applyExample(example);
  }
});
</script>

<template>
  <div class="lead">
    This is the basic Monaco code editor for editing miscellaneous single code files, typically JSON for data, CSS / skins, JS/TS or HTML.
  </div>
  <div class="row mt-3 h-50">
    <div class="col-3" style="max-height: 50vh; overflow-y: auto">
      <div class="list-group">
        <button
          v-for="(example, index) in examples"
          :key="example.title"
          class="list-group-item list-group-item-action"
          :class="{ active: index === activeIndex }"
          type="button"
          @click="selectExample(index)"
        >
          <div>{{ example.title }}</div>
          <div class="text-muted">
            <small>{{ example.descr }}</small>
          </div>
        </button>
      </div>
    </div>
    <div class="col-9">
      <div style="height: 50vh">
        <div v-if="loading" class="text-center">
          Loading from {{ url }}...
        </div>
        <MonacoEditor
          v-else
          :code="code"
          :lang="lang"
          :read-only="readOnly"
          @code-change="handleCodeChange"
        />
      </div>
    </div>
  </div>
</template>
