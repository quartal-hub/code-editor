import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
import type { QEditorProps } from "@quartal/code-editors-core";
import { PageHelpers } from "@/helpers";

/**
 * Parses the URL hash and returns an object with the QEditorProps interface.
 * Uses hash parameters instead of query parameters to avoid iframe reloads.
 * @param type The type of editor to use.
 * @returns Object with props as refs
 */
function useQEditorPropsFromQuery(type: QEditorProps["type"]) {
  const result = ref<QEditorProps>(PageHelpers.getPropsFromLocation(type));
  async function handleHashChange(): Promise<void> {
    result.value = PageHelpers.getPropsFromLocation(type);
  }
  onMounted(() => {
    PageHelpers.addHashChangeListener(handleHashChange);
  });
  onBeforeUnmount(() => {
    PageHelpers.removeHashChangeListener(handleHashChange);
  });
  return {
    /** The current props as a ref. */
    props: result as Ref<QEditorProps>,
  };
}

export default useQEditorPropsFromQuery;
