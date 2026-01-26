import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { QEditorProps } from "@/publish/model";
import { PageHelpers } from "@/helpers";

/**
 * Parses the URL hash and returns an object with the QEditorProps interface.
 * Uses hash parameters instead of query parameters to avoid iframe reloads.
 * Also provides a function to update the hash when code changes.
 * @param type The type of editor to use.
 * @returns Object with props as refs
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]) {
  const isLoading = ref<boolean>(false);
  const result = ref<QEditorProps>(PageHelpers.getPropsFromHash(type));

  // HACK: There is a bit too much updating back-and-forth here (uncomment the console.log).
  //       Refactor in a way that updating from/to hash is very explicit and happens to one direction only.
  let isUpdatingHash = false;
  async function handleHashChange(): Promise<void> {
    if (isUpdatingHash) { return; };
    isUpdatingHash = true;
    isLoading.value = true;
    try {
      result.value = PageHelpers.getPropsFromHash(type);
      if (result.value.url) {
        const response = await fetch(result.value.url);
        const text = await response.text();
        result.value.code = text;
      }
      // console.log("handleHashChange", result.value);
    } finally {
      isLoading.value = false;
      isUpdatingHash = false;
    }
  }
  function updateHash(code: string): void {
    if (isUpdatingHash) { return; };
    isUpdatingHash = true;
    try {
      PageHelpers.updateHash(type, code);
      // console.log("updateHash", code);
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
    /** If true, the editor is loading content from the URL. */
    isLoading: isLoading as Ref<boolean>,
  };
}

export default useQEditorPropsFromQuery;
