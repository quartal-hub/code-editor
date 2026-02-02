import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { QEditorProps } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

/**
 * Parses the URL hash and returns an object with the QEditorProps interface.
 * Uses hash parameters instead of query parameters to avoid iframe reloads.
 * Also provides a function to update the hash when code changes.
 * @param type The type of editor to use.
 * @returns Object with props as refs
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]) {
  const result = ref<QEditorProps>(PageHelpers.getPropsFromLocation(type));

  // HACK: There is a bit too much updating back-and-forth here (uncomment the console.log).
  //       Refactor in a way that updating from/to hash is very explicit and happens to one direction only.
  let isUpdatingHash = false;
  async function handleHashChange(): Promise<void> {
    if (isUpdatingHash) { return; };
    isUpdatingHash = true;
    result.value = PageHelpers.getPropsFromLocation(type);
    isUpdatingHash = false;
  }
  function updateHash(code: string | undefined): void {
    result.value.code = code ?? "";
    if (
      isUpdatingHash // Updating TO hash => do not loop back any more.
      || result.value.mode !== "code" // Only code mode updates hash.
    ) {
      return;
    }
    isUpdatingHash = true;
    try {
      PageHelpers.updateHash(type, code ?? "");
    } finally {
      isUpdatingHash = false;
    }
  }
  onMounted(() => {
    // Primary event for hash changes
    window.addEventListener("hashchange", handleHashChange);
    // Also listen to popstate for browser back/forward
    window.addEventListener("popstate", handleHashChange);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener("popstate", handleHashChange);
  });
  return {
    /** The current props as a ref. */
    props: result as Ref<QEditorProps>,
    /** Function to update the code in the hash. */
    updateCode: (code: string): void => updateHash(code),
  };
}

export default useQEditorPropsFromQuery;
