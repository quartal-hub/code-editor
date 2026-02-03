<script lang="ts" setup>
import { editorInfo } from "@/data";
import { getExamples, type QEditorExample } from "@/examples";
import type { EditorType } from "@quartal/code-editors-core";
import { ref } from "vue";

const props = defineProps<{
  /**
   * The editor type to show examples for.
   * NOTE: Currently, does not support switching after initial load (should not be needed).
   */
  editor: EditorType;
}>();

const examples: Readonly<QEditorExample[]> = getExamples(props.editor);
const editorConfig = editorInfo[props.editor];

const current = ref<QEditorExample | undefined>(examples[0]);

function getUrlLink(url: string): string {
  let urlLink = `/${props.editor}/fetch#url=${encodeURIComponent(url)}`;
  if (current.value?.props.readOnly === false) {
    // URL Links are read-only by default, so we need to add the read-only flag only if it is false.
    urlLink = urlLink.replace("/fetch#", `/fetch?read-only=false#`);
  }
  if (current.value?.props.view) {
    urlLink = urlLink.replace("/fetch#", `/fetch?view=${current.value.props.view}#`);
  }
  return urlLink;
}

function getCodeLink(code: string): string {
  let url = `/${props.editor}/code#code=${encodeURIComponent(code)}`;
  // Add to the beginning so that it is easier to observe => Code is long.
  if (current.value?.props.lang) {
    url = url.replace("/code#", `/code#lang=${encodeURIComponent(current.value.props.lang)}&`);
  }
  if (current.value?.props.readOnly) {
    url = url.replace('/code#', '/code#read-only=true&');
  }
  if (current.value?.props.view) {
    url = url.replace("/code#", `/code?view=${encodeURIComponent(current.value.props.view)}#`);
  }
  return url;
}

</script>

<template>
  <div class="container h-100" v-if="editorConfig && current">
    <div class="lead">
      {{ editorConfig.description }}
    </div>
    <div class="row mt-3 h-50">
      <div class="col-3" style="max-height: 50vh; overflow-y: auto;">
        <div class="list-group">
          <button v-for="example in examples" :key="example.title"
            class="list-group-item list-group-item-action" type="button"
            @click="current = example">
            <div class="d-flex justify-content-between align-items-center">
              {{ example.title }}
              <div>
                <span class="badge bg-primary" v-if="example.props.url" :title="example.props.url">URL</span>
                <span class="badge bg-secondary" v-if="example.props.code" title="Code example">code</span>
              </div>
            </div>
            <div class="text-muted">
              <small>{{ example.descr }}</small>
            </div>
          </button>
        </div>
      </div>
      <div class="col-9">
        <div v-if="current.props.url">
          <h3>URL link</h3>
          <div>This is a simple url link and can be opened in a new window:</div>
          <div class="text-truncate"><a :href="getUrlLink(current.props.url)" target="_blank">{{ getUrlLink(current.props.url) }}</a></div>
          <div>
            Shown using simple iframe:<br/>
            <iframe :src="getUrlLink(current.props.url)" class="border w-100" style="height: 50vh;"></iframe>
          </div>
        </div>
        <div v-else-if="current.props.code">
          <h3>Code example</h3>
          <div>This is a code example in hash and can be opened in a new window:</div>
          <div class="text-truncate"><code><a :href="getCodeLink(current.props.code)" target="_blank">{{ getCodeLink(current.props.code) }}</a></code></div>
          <div>
            Shown using simple iframe:<br/>
            <iframe :src="getCodeLink(current.props.code)" class="border w-100" style="height: 50vh;"></iframe>
          </div>
        </div>
        <qrtl-code-editor v-else style="display: block; width: 100%; height: 100%;"
          v-bind="current.props"></qrtl-code-editor>
      </div>
    </div>
  </div>
  <div class="alert alert-danger mx-auto w-50 mt-5" v-else>No examples for editor "{{ editor }}"</div>
</template>