<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  EditorController,
  EditorModel,
  EditorView,
  OffsetRange,
  Selection,
  StringEdit,
  StringValue,
  findNodeOffsetById,
  taskCheckboxRange,
} from "@vscode/markdown-editor";
import { autorun } from "@vscode/markdown-editor/observables";
import "@vscode/markdown-editor/editor.css";
import "@vscode/markdown-editor/themes/github.css";
import type { QEditorChangeEventData } from "@quartal/code-editors-core";

/**
 * Obsidian-like hybrid Markdown editor based on @vscode/markdown-editor:
 * Markdown markers are shown only in the block that is being edited.
 */
interface MarkdownHybridEditorProps {
  /** The Markdown to show in the editor. */
  code?: string;
  /** If true, the editor is read only (rendered, no input handling). */
  readOnly?: boolean;
}

const props = withDefaults(defineProps<MarkdownHybridEditorProps>(), {
  code: "",
  readOnly: false,
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let model: EditorModel | undefined;
let view: EditorView | undefined;
let controller: EditorController | undefined;
let stopAutorun: { dispose(): void } | undefined;
let debounceTimeout = 0;
/** Last Markdown known to both the parent and the editor: prevents echoing parent changes back. */
let knownMarkdown = props.code ?? "";

defineExpose({
  getValue: (): string => model?.sourceText.get().value ?? knownMarkdown,
});

function setController(readOnly: boolean): void {
  controller?.dispose();
  controller = undefined;
  if (view && !readOnly) {
    controller = new EditorController(model!, view);
  }
}

function toggleCheckbox(item: Parameters<typeof taskCheckboxRange>[0], checked: boolean): void {
  if (!model || props.readOnly) {
    return;
  }
  const relative = taskCheckboxRange(item);
  const base = findNodeOffsetById(model.document.get(), item);
  if (!relative || base === undefined) {
    return;
  }
  model.applyEdit(
    StringEdit.replace(
      new OffsetRange(base + relative.start, base + relative.endExclusive),
      checked ? "[x]" : "[ ]",
    ),
  );
}

function applyCode(code: string): void {
  if (!model || code === knownMarkdown) {
    return;
  }
  knownMarkdown = code;
  const length = model.sourceText.get().length;
  model.applyEdit(StringEdit.replace(new OffsetRange(0, length), code));
}

onMounted(() => {
  if (!containerRef.value) {
    return;
  }
  model = new EditorModel();
  model.sourceText.set(new StringValue(knownMarkdown), undefined);
  model.selection.set(Selection.collapsed(0), undefined);
  view = new EditorView(model, {
    classNames: ["github-markdown-theme"],
    onOpenLink: (url) => window.open(url, "_blank", "noopener"),
    onToggleCheckbox: toggleCheckbox,
  });
  containerRef.value.appendChild(view.element);
  setController(props.readOnly ?? false);

  stopAutorun = autorun((reader) => {
    const markdown = model!.sourceText.read(reader).value;
    if (markdown === knownMarkdown) {
      return;
    }
    knownMarkdown = markdown;
    window.clearTimeout(debounceTimeout);
    debounceTimeout = window.setTimeout(() => emit("on-change", { code: markdown }), 250);
  });
});

watch(() => props.code, (code) => applyCode(code ?? ""));
watch(() => props.readOnly, (readOnly) => setController(readOnly ?? false));

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimeout);
  stopAutorun?.dispose();
  controller?.dispose();
  view?.dispose();
  view?.element.remove();
});
</script>

<template>
  <div ref="containerRef" class="q-markdown-hybrid-editor" style="width: 100%; height: 100%; overflow: auto" />
</template>
