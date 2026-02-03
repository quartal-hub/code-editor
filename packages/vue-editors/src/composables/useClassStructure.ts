import { computed, ref } from "vue";

import type { ClassInfo, ParsedMethod } from "../helpers";
import { ClassParser } from "../helpers";


/**
 * Holds the structure of file with one or several classes and provides methods to parse and manipulate it.
 * @param code - The code of the file to parse.
 */
export function useClassStructure(code: string) {

  const currentCode = ref<string>(code);
  
  const errorMsg = ref<string>("");

  const classes = ref<ClassInfo[]>([]);
  const allMethodsInFile = ref<ParsedMethod[]>([]);

  const currentClass = ref<ClassInfo | undefined>(undefined);
  const currentMethod = ref<ParsedMethod | undefined>(undefined);
  const currentMethodBody = ref<string>("");

  // Initialize the structure with the given code.
  setCurrentCode(code);

  const currentClassMethods = computed(() => {
    if (!currentClass.value) {
      return [];
    }
    return allMethodsInFile.value.filter(
      (method) => method.owner.kind === "class" && method.owner.name === currentClass.value!.name
    );
  });

  function setCurrentCode(nextCode: string): void {
    try {
      errorMsg.value = "";
      const parsedMethods = ClassParser.parseMethods(nextCode ?? "");
      const parsedClasses = ClassParser.parseClasses(nextCode ?? "");
      allMethodsInFile.value = parsedMethods;
      classes.value = parsedClasses;
      currentCode.value = nextCode ?? "";

      const sameNameClass = currentClass.value ? parsedClasses.find((item) => item.name === currentClass.value!.name) : undefined;
      if (sameNameClass) {
        setCurrentClass(sameNameClass);
      } else {
        setCurrentClass(parsedClasses.length > 0 ? parsedClasses[0] : undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errorMsg.value = `Syntax Error: ${msg}`;
      classes.value = [];
      allMethodsInFile.value = [];
      currentClass.value = undefined;
      currentMethod.value = undefined;
      currentMethodBody.value = "";
    }
  }

  /**
   * Sets the current class to the given class name or class info object or undefined to clear the current class.
   * The comparison is done based on class name so that it is not a problem if the underlying code changes (class refs change)..
   * @param newClass The class name or class info object or undefined to clear the current class.
   */
  function setCurrentClass(newClass: string | ClassInfo | undefined): void {
    const className = typeof newClass === "string" ? newClass : newClass?.name ?? undefined;
    if (!className) {
      currentClass.value = undefined;
      return;
    }
    const classInfo = classes.value.find((item) => item.name === className) ?? undefined;
    currentClass.value = classInfo;

    const sameNameMethod = currentMethod.value ? currentClassMethods.value.find((item) => item.name === currentMethod.value!.name) : undefined;
    if (sameNameMethod) {
      setCurrentMethod(sameNameMethod);
    } else {
      setCurrentMethod(currentClassMethods.value.length > 0 ? currentClassMethods.value[0] : undefined);
    }
  }

  /**
   * Sets the current method to the given method name or method info object or undefined to clear the current method.
   * The comparison is done based on method name so that it is not a problem if the underlying code changes (method refs change)..
   * @param newMethod The method name or method info object or undefined to clear the current method.
   */
  function setCurrentMethod(newMethod: string | ParsedMethod | undefined): void {
    const methodName = typeof newMethod === "string" ? newMethod : newMethod?.name ?? undefined;
    if (!methodName) {
      currentMethod.value = undefined;
      return;
    }
    const methodInfo = currentClassMethods.value.find((item) => item.name === methodName) ?? undefined;
    currentMethod.value = methodInfo;

    setCurrentMethodBody(currentMethod.value?.content ?? "", false);
  }

  /**
   * Sets the current method body to the given body text.
   * @param newBody The new body text.
   * @param updateCode If true, the code is updated with the currentCode (means that code will be reparsed and collections will be updated).
   */
  function setCurrentMethodBody(newBody: string, updateCode: boolean): void {
    if (!currentMethod.value?.start || !currentMethod.value.end) {
      throw new Error("No method selected or no start/end position found");
    }
    // HACK: Removing only the first new line (if first character) => Need a more solid trimming logic. Also synchronize with Expression editor logic.
    newBody = (newBody ?? "").replace(/^\n/, "");
    currentMethodBody.value = newBody ?? "";
    if (updateCode) {
      const updated = `${currentCode.value.slice(0, currentMethod.value.start + 1)}\n    ${newBody}\n  ${currentCode.value.slice(currentMethod.value.end - 1)}`;
      setCurrentCode(updated);
    }
  }

  function addClass(className: string, classCode: string): void {
    const isExisting = classes.value.some((item) => item.name === className);
    if (isExisting) {
      throw new Error(`Class "${className}" already exists`);
    }
    const updated = `${currentCode.value}\n\n${classCode}\n\n`;
    setCurrentCode(updated);
    setCurrentClass(className);
  }

  function addMethod(methodName: string, methodCode: string): void {
    if (!currentClass.value) {
      throw new Error("No class selected");
    }
    const isExisting = currentClassMethods.value.some((method) => method.name === methodName);
    if (isExisting) {
      throw new Error(`Method "${methodName}" already exists`);
    }
    const insertionPoint = currentClass.value.bodyEnd - 1;
    const updated = `${currentCode.value.slice(0, insertionPoint)}${methodCode}${currentCode.value.slice(insertionPoint)}`;
    setCurrentCode(updated);
  }

  return {
    /**
     * Sets the current code from source code string.
     * This is automatically called when the composable is initialized, but you need to call this
     * if the code changes in parent component, full source code editor etc.
     */
    setCurrentCode,
    /** Sets the current class to the given class name or class info object or undefined to clear the current class. */
    setCurrentClass,
    /** Sets the current method to the given method name or method info object or undefined to clear the current method. */
    setCurrentMethod,
    /** Sets the body of the current method. */
    setCurrentMethodBody,
    /** Adds a new method to the current class. */
    addMethod,
    /** Adds a new class to the code. */
    addClass,
    /** The code that is currently being edited. */
    currentCode,
    /** Parse error: The error message if the code is not valid syntax. Empty string if no error. */
    errorMsg,
    /** The list of classes in the code. Supports multiple classes in one code file. */
    classes,
    /** The list of methods in the code: Methods in all classes. */
    allMethodsInFile,
    /** The current class that is being edited. Undefined if no class is selected. */
    currentClass,
    /** The list of methods in the current class only. */
    currentClassMethods,
    /** The current method that is being edited. Undefined if no method is selected. */
    currentMethod,
    /** The body of the current method. */
    currentMethodBody

  };
}