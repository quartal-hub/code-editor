<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Crepe } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

/** WYSIWYG Markdown editor based on Milkdown Crepe. */
interface MarkdownEditorProps {
  /** The Markdown to show in the editor. */
  code?: string;
  /** If true, the editor is read only. */
  readOnly?: boolean;
}

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
  code: "",
  readOnly: false,
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let crepe: Crepe | undefined;
let destroyed = false;
let debounceTimeout = 0;
/** Last Markdown known to both the parent and the editor: prevents echoing parent changes back. */
let knownMarkdown = props.code ?? "";

defineExpose({
  getValue: (): string => crepe?.getMarkdown() ?? knownMarkdown,
});

async function initializeEditor(): Promise<void> {
  if (!containerRef.value) {
    return;
  }
  const instance = new Crepe({ root: containerRef.value, defaultValue: knownMarkdown });
  instance.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      if (markdown === knownMarkdown) {
        return;
      }
      knownMarkdown = markdown;
      window.clearTimeout(debounceTimeout);
      debounceTimeout = window.setTimeout(() => emit("on-change", { code: markdown }), 250);
    });
  });
  await instance.create();
  if (destroyed) {
    await instance.destroy();
    return;
  }
  instance.setReadonly(props.readOnly ?? false);
  crepe = instance;
  // The parent may have changed the code while the editor was loading.
  applyCode(props.code ?? "");
}

function applyCode(code: string): void {
  if (!crepe || code === knownMarkdown) {
    return;
  }
  knownMarkdown = code;
  crepe.editor.action(replaceAll(code));
}

onMounted(() => {
  void initializeEditor();
});

watch(() => props.code, (code) => applyCode(code ?? ""));
watch(() => props.readOnly, (readOnly) => crepe?.setReadonly(readOnly ?? false));

onBeforeUnmount(() => {
  destroyed = true;
  window.clearTimeout(debounceTimeout);
  void crepe?.destroy();
  crepe = undefined;
});
</script>

<template>
  <div ref="containerRef" class="q-markdown-editor" style="width: 100%; height: 100%; overflow: auto" />
</template>
