<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import MonacoEditor from "./MonacoEditor.vue";
import ExpressionEditor from "./ExpressionEditor.vue";
import { ClassParser, type ClassInfo, type ParsedMethod } from "../helpers/classParser";
import { PackageCache } from "@quartal/code-editors-core";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";

export interface ClassEditorProps {
  /** Full source file containing the class(es). */
  code: string;
  /** When true, disable editing and saving. */
  readOnly?: boolean;
}

type MonacoDisposable = { dispose: () => void };

type MonacoLibrary =
  | { type: "module"; name: string }
  | { type: "context"; code: string };

const props = withDefaults(defineProps<ClassEditorProps>(), {
  readOnly: false,
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
}>();

const errorMsg = ref<string>("");
const classes = ref<ClassInfo[]>([]);
const methods = ref<ParsedMethod[]>([]);
const selectedClassName = ref<string | null>(null);
const selectedMethodIndex = ref<number>(-1);
const editorContent = ref<string>("");
const activeTab = ref<string>("class-editor");

const monacoRef = shallowRef<any | null>(null);
const libDisposables = ref<MonacoDisposable[]>([]);

const packageCache = new PackageCache();

// HACK: Use common libraries in code-editors-core package to handle these.
const libraries: MonacoLibrary[] = [
  {
    type: "module",
    name: "@salaxy/core",
  },
  {
    type: "module",
    name: "@salaxy/expressions",
  },
  {
    type: "context",
    code: `
      imp${"o"}rt { CalculationRowSource, CalculationRowType, HelpersRoot, UserDefinedRow, RowContext } from "@salaxy/core";
      declare global {
        /** The row that is being process as part of calculation. */
        declare var row: UserDefinedRow;
        /** The calculation context: Calculation, Employment, Company settings, etc. */
        declare var ctx: RowContext;
        /** The sxy helper functions. */
        declare var sxy: HelpersRoot;
      }
    `,
  },
];

function getDefaultCompilerOptions(monacoInstance: any): any {
  if (!monacoInstance) {
    return {
      target: 5,
      allowNonTsExtensions: true,
      moduleResolution: 2,
      module: 99,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    };
  }

  return {
    target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monacoInstance.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };
}

async function loadModuleLibrary(lib: { name: string }): Promise<string> {
  const code = await packageCache.getTypes(lib.name);
  if (!code) {
    throw new Error(`Failed to fetch library types for ${lib.name}`);
  }
  return `declare module '${lib.name}' {\n${code}\n}`;
}

async function applyLibraries(monacoInstance: any): Promise<void> {
  libDisposables.value.forEach((disposable) => disposable.dispose());
  libDisposables.value = [];

  for (const lib of libraries) {
    try {
      let code: string;
      let filePath: string;

      if (lib.type === "module") {
        code = await loadModuleLibrary(lib);
        filePath = `file:///node_modules/${lib.name}/index.d.ts`;
      } else {
        code = lib.code;
        filePath = `file:///context/${Date.now()}.d.ts`;
      }

      const jsDisposable = monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(code, filePath);
      const tsDisposable = monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(code, filePath);
      libDisposables.value.push(jsDisposable, tsDisposable);
    } catch (error) {
      console.error("Error processing library:", lib, error);
    }
  }
}

async function setupMonaco(monacoInstance: unknown): Promise<void> {
  const monaco = monacoInstance as any;
  monacoRef.value = monaco;

  const compilerOptions = getDefaultCompilerOptions(monaco);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);

  await applyLibraries(monaco);
}

function handleMonacoMount(data: QEditorMountEventData): void {
  void setupMonaco(data.api);
}

watch(
  () => props.code,
  (code) => {
    try {
      errorMsg.value = "";
      const parsedMethods = ClassParser.parseMethods(code ?? "");
      const parsedClasses = ClassParser.parseClasses(code ?? "");
      methods.value = parsedMethods;
      classes.value = parsedClasses;

      const classNames = parsedClasses.map((item) => item.name);
      if (selectedClassName.value && classNames.includes(selectedClassName.value)) {
        return;
      }
      selectedClassName.value = classNames.length > 0 ? classNames[0] : null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errorMsg.value = `Syntax Error: ${msg}`;
      classes.value = [];
      methods.value = [];
      selectedClassName.value = null;
      selectedMethodIndex.value = -1;
      editorContent.value = "";
    }
  },
  { immediate: true }
);

const classList = computed(() => classes.value);

const methodsForSelectedClass = computed(() => {
  if (!selectedClassName.value) return [];
  return methods.value.filter(
    (method) => method.owner.kind === "class" && method.owner.name === selectedClassName.value
  );
});

watch(
  methodsForSelectedClass,
  (list) => {
    if (list.length === 0) {
      selectedMethodIndex.value = -1;
      return;
    }
    if (selectedMethodIndex.value < 0 || selectedMethodIndex.value >= list.length) {
      selectedMethodIndex.value = 0;
    }
  },
  { immediate: true }
);

const selectedMethod = computed(() => {
  const list = methodsForSelectedClass.value;
  if (selectedMethodIndex.value < 0 || selectedMethodIndex.value >= list.length) return null;
  return list[selectedMethodIndex.value];
});

watch(selectedMethod, (method) => {
  if (!method) {
    editorContent.value = "";
    return;
  }
  editorContent.value = (method.content ?? "").replace(/^\n/, "");
});

const selectedMethodName = computed(() => selectedMethod.value?.name ?? "");

function saveMethod(): void {
  if (props.readOnly) return;
  if (!selectedMethod.value || !selectedMethod.value.editable) return;

  if (selectedMethod.value.start == null || selectedMethod.value.end == null) return;
  const before = props.code.slice(0, selectedMethod.value.start + 1);
  const after = props.code.slice(selectedMethod.value.end - 1);
  const newSource = `${before}\n${editorContent.value}\n${after}`;
  emit("on-change", { code: newSource });
}

function handleAddClass(): void {
  if (props.readOnly) return;
  const baseName = "NewClass";
  const existing = new Set(classList.value.map((item) => item.name));
  let nextIndex = 1;
  let newName = `${baseName}${nextIndex}`;
  while (existing.has(newName)) {
    nextIndex += 1;
    newName = `${baseName}${nextIndex}`;
  }

  const snippet = `\n\nexport class ${newName} {\n\n}\n`;
  const updated = `${props.code}${snippet}`;
  emit("on-change", { code: updated });
  selectedClassName.value = newName;
}

function handleAddMethod(): void {
  if (props.readOnly) return;
  if (!selectedClassName.value) return;
  const classInfo = classList.value.find((item) => item.name === selectedClassName.value);
  if (!classInfo) return;

  const existingNames = new Set(methodsForSelectedClass.value.map((method) => method.name));
  let methodIndex = 1;
  let methodName = `newMethod${methodIndex}`;
  while (existingNames.has(methodName)) {
    methodIndex += 1;
    methodName = `newMethod${methodIndex}`;
  }

  const classIndent = getIndentAtIndex(props.code, classInfo.start);
  const methodIndent = `${classIndent}  `;
  const methodSnippet = `\n${methodIndent}public ${methodName}(): void {\n${methodIndent}  \n${methodIndent}}\n${classIndent}`;

  const insertionPoint = classInfo.bodyEnd - 1;
  const updated = `${props.code.slice(0, insertionPoint)}${methodSnippet}${props.code.slice(insertionPoint)}`;
  emit("on-change", { code: updated });
}

function handleEditorCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  editorContent.value = nextCode;
}

onBeforeUnmount(() => {
  libDisposables.value.forEach((disposable) => disposable.dispose());
  libDisposables.value = [];
});

function getIndentAtIndex(source: string, index: number): string {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const line = source.slice(lineStart, index);
  const match = line.match(/^\s*/);
  return match ? match[0] : "";
}
</script>

<template>
  <div class="d-flex flex-column" style="height: calc(100vh - 200px);">
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'class-editor' || !activeTab }"
          href="#class-editor"
          @click.prevent="activeTab = 'class-editor'"
        >
          Classes and functions
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'full-source-code' || !activeTab }"
          href="#full-source-code"
          @click.prevent="activeTab = 'full-source-code'"
        >
          Full source code
        </a>
      </li>
    </ul>

    <div v-if="activeTab === 'class-editor'" class="h-100 d-flex flex-column" style="min-height: 0;">
      <div v-if="errorMsg" class="alert alert-danger py-1 px-2 m-3" role="alert">{{ errorMsg }}</div>
      <div class="flex-grow-0 flex-shrink-0" style="height: 140px;">
        <ExpressionEditor
          :code="editorContent"
          lang="typescript"
          @on-change="handleEditorCodeChange"
          @on-editor-mount="handleMonacoMount"
        />
      </div>
      <div class="d-flex flex-grow-1" style="min-height: 0;">
        <div class="card flex-shrink-0" style="width: 260px; overflow-y: auto;">
          <div class="card-body flex-grow-0 flex-shrink-0">
            <h3>Rivityypit</h3>
            <div v-if="classList.length === 0" class="text-muted small fst-italic mb-2">No classes found.</div>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="owner in classList"
              :key="owner.name"
              type="button"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ active: owner.name === selectedClassName }"
              @click="selectedClassName = owner.name"
            >
              <span class="text-truncate">{{ owner.name }}</span>
            </button>
          </div>
          <div class="card-body flex-grow-1 d-flex align-items-end">
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="props.readOnly"
              @click="handleAddClass"
            >
              + Lisää rivityyppi...
            </button>
          </div>
        </div>
        <div class="card flex-shrink-0 ms-2" style="width: 260px; overflow-y: auto;">
          <div class="card-body flex-grow-0 flex-shrink-0">
            <h3>Funktiot</h3>
            <div v-if="methodsForSelectedClass.length === 0" class="text-muted small fst-italic mb-2">
              {{ selectedClassName ? "No methods found in class." : "Select a class to view methods." }}
            </div>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="(method, index) in methodsForSelectedClass"
              :key="`${method.name}-${index}`"
              type="button"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ active: index === selectedMethodIndex }"
              @click="selectedMethodIndex = index"
            >
              <strong class="me-2 text-muted">ƒ</strong>
              <span class="text-truncate">{{ method.name }}</span>
            </button>
          </div>
          <div class="card-body flex-grow-1 d-flex align-items-end">
            <button
              type="button"
              class="btn btn-primary w-100"
              :disabled="!selectedClassName || props.readOnly"
              @click="handleAddMethod"
            >
              + Lisää funktio...
            </button>
          </div>
        </div>

        <div class="flex-grow-1 p-2 d-flex flex-column ms-2" style="min-height: 0;">
          <div v-if="selectedMethodIndex === -1" class="text-muted fst-italic mt-3">
            Select a method on the left to edit its body.
          </div>
          <template v-else>
            <div class="d-flex justify-content-between mb-2">
              <div>
                <h3>
                  {{ selectedMethodName }}({{ selectedMethod?.doc.params.map((p) => p.name).join(", ") }})
                  <small class="text-muted">
                    in {{ `${selectedMethod?.owner.kind} ${selectedMethod?.owner.name}` }}
                  </small>
                </h3>
                <template v-if="selectedMethod">
                  <p v-if="selectedMethod.doc.description">{{ selectedMethod.doc.description }}</p>
                  <ul v-if="selectedMethod.doc.params.length">
                    <li v-for="param in selectedMethod.doc.params" :key="param.name">
                      {{ param.name }}: {{ param.description }}
                    </li>
                  </ul>
                  <p v-if="selectedMethod.doc.returns">Returns: {{ selectedMethod.doc.returns }}</p>
                </template>
              </div>
              <div>
                <button
                  class="btn btn-outline-success btn-sm"
                  type="button"
                  :disabled="props.readOnly || !selectedMethod?.editable"
                  @click="saveMethod"
                >
                  TODO: Save Changes
                </button>
              </div>
            </div>
            <div class="text-muted small mt-2">
              {{ selectedMethod?.editable ? "Only the function body is editable." : "Interface methods are read-only." }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'full-source-code'" class="h-100 border rounded" style="min-height: 0;">
      <MonacoEditor
        :code="props.code"
        lang="javascript"
        theme="vs-dark"
        :read-only="true"
        :options="{
          minimap: { enabled: false },
          tabSize: 2,
          automaticLayout: true,
        }"
        @on-editor-mount="handleMonacoMount"
      />
    </div>
  </div>
</template>
