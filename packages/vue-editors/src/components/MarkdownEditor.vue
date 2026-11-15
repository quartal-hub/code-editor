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

/** DOM events that mean the user is interacting with the editor content (as opposed to just loading it). */
const userInputEvents = ["beforeinput", "keydown", "paste", "cut", "drop", "pointerdown", "compositionstart"] as const;

const containerRef = ref<HTMLDivElement | null>(null);
let crepe: Crepe | undefined;
let destroyed = false;
let debounceTimeout = 0;
/** Last Markdown known to both the parent and the editor: prevents echoing parent changes back. */
let knownMarkdown = props.code ?? "";
/**
 * Milkdown normalizes the Markdown when it loads it (list markers, escaping, blank lines...).
 * This is that normalized form of the code from the parent: an update that only yields it is not a user edit.
 */
let normalizedMarkdown: string | undefined;
/** True once the user has interacted with the editor content after the code was (re)loaded. */
let userInteracted = false;
/** True once the user has made a real edit: from then on all changes are emitted. */
let dirty = false;

defineExpose({
  getValue: (): string => (dirty ? crepe?.getMarkdown() ?? knownMarkdown : knownMarkdown),
});

function onUserInput(): void {
  userInteracted = true;
}

async function initializeEditor(): Promise<void> {
  const container = containerRef.value;
  if (!container) {
    return;
  }
  const instance = new Crepe({ root: container, defaultValue: knownMarkdown });
  instance.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      if (!dirty) {
        // Ignore Milkdown's own normalization of the loaded Markdown until the user really edits something.
        if (!userInteracted || normalizedMarkdown === undefined || markdown === normalizedMarkdown) {
          return;
        }
        dirty = true;
      }
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
  normalizedMarkdown = instance.getMarkdown();
  for (const type of userInputEvents) {
    container.addEventListener(type, onUserInput, true);
  }
  // The parent may have changed the code while the editor was loading.
  applyCode(props.code ?? "");
}

function applyCode(code: string): void {
  if (!crepe || code === knownMarkdown) {
    return;
  }
  window.clearTimeout(debounceTimeout);
  knownMarkdown = code;
  dirty = false;
  userInteracted = false;
  crepe.editor.action(replaceAll(code));
  normalizedMarkdown = crepe.getMarkdown();
}

onMounted(() => {
  void initializeEditor();
});

watch(() => props.code, (code) => applyCode(code ?? ""));
watch(() => props.readOnly, (readOnly) => crepe?.setReadonly(readOnly ?? false));

onBeforeUnmount(() => {
  destroyed = true;
  window.clearTimeout(debounceTimeout);
  const container = containerRef.value;
  if (container) {
    for (const type of userInputEvents) {
      container.removeEventListener(type, onUserInput, true);
    }
  }
  void crepe?.destroy();
  crepe = undefined;
});
</script>

<template>
  <div ref="containerRef" class="q-markdown-editor" style="width: 100%; height: 100%; overflow: auto" />
</template>
