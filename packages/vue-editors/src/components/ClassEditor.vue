<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";

import { MonacoHelper, PackageCache } from "@quartal/code-editors-core";
import type { QEditorChangeEventData, QEditorMountEventData } from "@quartal/code-editors-core";

import { useClassStructure } from "../composables";
import MonacoEditor from "./MonacoEditor.vue";
import ExpressionEditor from "./ExpressionEditor.vue";
import { SalaxyHelpers } from "../helpers";

export interface ClassEditorProps {
  /** Full source file containing the class(es). */
  code: string;
  /** When true, disable editing and saving. */
  readOnly?: boolean;

  /**
   * View mode for the class editor.
   * In "single-class" mode, the given file is expected to contain only one class.
   * In "multi-class" mode, the given file may have many classes and there buttons for adding / removing them.
   */
  view?: "single-class" | "multi-class";  
}

type MonacoDisposable = { dispose: () => void };

const props = withDefaults(defineProps<ClassEditorProps>(), {
  readOnly: false,
});

const emit = defineEmits<{
  (event: "on-change", data: QEditorChangeEventData): void;
}>();

const {
  setCurrentCode, setCurrentMethod, setCurrentMethodBody, setCurrentClass, addMethod, addClass,
  currentCode, errorMsg, 
  classes, currentClass, currentClassMethods, currentMethod, currentMethodBody
} = useClassStructure(props.code);

const activeTab = ref<string>("class-editor");

const monacoRef = shallowRef<any | null>(null);
const libDisposables = ref<MonacoDisposable[]>([]);

const packageCache = new PackageCache();

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

  for (const lib of SalaxyHelpers.getTempLibraries()) {
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
  MonacoHelper.applyDefaultCompilerOptions(monaco);
  await applyLibraries(monaco);
}

function handleMonacoMount(data: QEditorMountEventData): void {
  void setupMonaco(data.api);
}

watch(
  () => props.code,
  (code) => {
    setCurrentCode(code);
  },
  { immediate: true }
);

function saveMethod(): void {
  if (props.readOnly) return;
  if (!currentMethod.value || !currentMethod.value.editable) return;

  if (currentMethod.value.start == null || currentMethod.value.end == null) return;
  const before = currentCode.value.slice(0, currentMethod.value.start + 1);
  const after = currentCode.value.slice(currentMethod.value.end - 1);
  const newSource = `${before}\n${currentMethodBody.value}\n${after}`;
  emit("on-change", { code: newSource });
}

function handleAddClass(): void {
  if (props.readOnly) {
    return;
  }
  const className = prompt("Enter the name of the new class:");
  if (!className) {
    return;
  }
  const isExisting = classes.value.some((item) => item.name === className);
  if (isExisting) {
    alert(`Class "${className}" already exists`);
    return;
  }
  addClass(className, SalaxyHelpers.getCodeForClass(className));
  emit("on-change", { code: currentCode.value });
}

// HACK: Go through the white space handling logic: Expression editor, getIndentAtIndex and any trimming in composable.
function handleAddMethod(methodName: string): void {
  if (props.readOnly) {
    return
  };
  if (!currentClass.value) {
    return
  };
  const isExisting = currentClassMethods.value.some((method) => method.name === methodName);
  if (isExisting) {
    alert(`Method "${methodName}" already exists`);
    return;
  }
  addMethod(methodName, SalaxyHelpers.getCodeForFunction(methodName) + "\n\n");
  emit("on-change", { code: currentCode.value });
}

function handleEditorCodeChange(data: QEditorChangeEventData): void {
  const nextCode = data.code ?? "";
  setCurrentMethodBody(nextCode, true);
}

onBeforeUnmount(() => {
  libDisposables.value.forEach((disposable) => disposable.dispose());
  libDisposables.value = [];
});

const functions = computed(() => SalaxyHelpers.getRowsInterface().map((item) => {
  return {
    ...item,
    disabled: currentClassMethods.value.some((method) => method.name === item.name),
  }
}));

</script>

<template>
  <div class="d-flex flex-column" style="height: calc(100vh);">
    <div class="btn-group" style="position: absolute; top: 3px; right: 18px;">
      <button class="btn btn-primary dropdown-toggle" type="button" id="addFunctionDropdown"
        :class="{ disabled: props.readOnly }"
        data-bs-toggle="dropdown" aria-expanded="false" data-bs-reference="body">
        Add function
      </button>
      <ul class="dropdown-menu" aria-labelledby="addFunctionDropdown"
        style="max-height: calc(100vh - 60px); overflow-y: auto;">
        <li v-for="func in functions" :key="func.name">
          <a class="dropdown-item" :class="{ disabled: func.disabled }"
            href="#" @click.prevent="handleAddMethod(func.name)">{{ func.name }}</a>
        </li>
      </ul>
    </div>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'class-editor' || !activeTab }"
          href="#class-editor"
          @click.prevent="activeTab = 'class-editor'"
        >Classes and functions</a>
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
      <div class="text-muted px-2 pb-0 pt-1" style="background-color: var(--bs-gray-200);">
        <small>Try the following entry points:</small> <code>row</code><small> = Current row, </small><code>ctx</code><small> = Context (calc, employment, settings), </small><code>sxy</code><small> = Salaxy helpers.</small>
      </div> 
      <div class="flex-grow-0 flex-shrink-0" style="height: 140px;">
        <ExpressionEditor
          :code="currentMethodBody"
          lang="typescript"
          @on-change="handleEditorCodeChange"
          @on-editor-mount="handleMonacoMount"
        />
      </div>
      <div class="d-flex flex-grow-1" style="min-height: 0;">
        <div class="card flex-shrink-0" style="width: 260px; overflow-y: auto;" v-if="view === 'multi-class'">
          <div class="card-body flex-grow-0 flex-shrink-0">
            <h3>Classes</h3>
            <div v-if="classes.length === 0" class="text-muted small fst-italic mb-2">No classes found.</div>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="owner in classes" :key="owner.name"
              type="button" @click="setCurrentClass(owner)"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ active: owner.name === currentClass?.name }">
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
              + Add class...
            </button>
          </div>
        </div>
        <div class="card flex-shrink-0 ms-2" style="width: 260px;">
          <div class="card-body flex-grow-0 flex-shrink-0">
            <h3>Functions</h3>
            <div v-if="currentClassMethods.length === 0" class="text-muted small fst-italic mb-2">
              {{ currentClass?.name ? "No methods found in class." : "Select a class to view methods." }}
            </div>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="method in currentClassMethods" :key="method.name"
              type="button" @click="setCurrentMethod(method)"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :class="{ active: method.name === currentMethod?.name }">
              <strong class="me-2 text-muted">ƒ</strong>
              <span class="text-truncate">{{ method.name }}</span>
            </button>
          </div>
        </div>
        <div class="flex-grow-1 p-2 d-flex flex-column ms-2" style="min-height: 0; overflow-y: auto;">
          <div v-if="!currentMethod" class="text-muted fst-italic mt-3">
            Select a method on the left to edit its body.
          </div>
          <template v-else>
            <div class="d-flex justify-content-between mb-2">
              <div>
                <h3>
                  {{ currentMethod?.name }}({{ currentMethod?.doc.params.map((p) => p.name).join(", ") }})
                  <small class="text-muted">
                    in {{ `${currentMethod?.owner.kind} ${currentMethod?.owner.name}` }}
                  </small>
                </h3>
                <template v-if="currentMethod">
                  <p v-if="currentMethod.doc.description">{{ currentMethod.doc.description }}</p>
                  <ul v-if="currentMethod.doc.params.length">
                    <li v-for="param in currentMethod.doc.params" :key="param.name">
                      {{ param.name }}: {{ param.description }}
                    </li>
                  </ul>
                  <p v-if="currentMethod.doc.returns">Returns: {{ currentMethod.doc.returns }}</p>
                </template>
              </div>
              <div>
                <button
                  class="btn btn-outline-success btn-sm"
                  type="button"
                  :disabled="props.readOnly || !currentMethod?.editable"
                  @click="saveMethod"
                >
                  TODO: Save Changes
                </button>
              </div>
            </div>
            <div class="text-muted small mt-2">
              {{ currentMethod?.editable ? "Only the function body is editable." : "Interface methods are read-only." }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'full-source-code'" class="h-100 border rounded" style="min-height: 0;">
      <MonacoEditor
        :code="currentCode"
        lang="javascript"
        theme="vs-dark"
        :read-only="props.readOnly"
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
