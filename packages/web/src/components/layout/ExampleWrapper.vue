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
  return `/${props.editor}/fetch#url=${encodeURIComponent(url)}`;
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
            <div>{{ example.title }}</div>
            <div class="text-muted">
              <small>{{ example.descr }}</small>
            </div>
          </button>
        </div>
      </div>
      <div class="col-9">
        <div v-if="current.props.url">
          <h3>URL link</h3>
          <p>
            This is a simple url link and can be opened in a new window:
            <a :href="getUrlLink(current.props.url)" target="_blank">{{ getUrlLink(current.props.url) }}</a>
          </p>
          <div>
            Shown using simple iframe:<br/>
            <iframe :src="getUrlLink(current.props.url)" class="border w-100" style="height: 50vh;"></iframe>
          </div>
        </div>
        <qrtl-code-editor v-else style="display: block; width: 100%; height: 100%;"
          v-bind="current.props"></qrtl-code-editor>
      </div>
    </div>
  </div>
  <div class="alert alert-danger mx-auto w-50 mt-5" v-else>No examples for editor "{{ editor }}"</div>
</template>