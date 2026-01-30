/** Data sent from the editor to the parent when the editor is mounted. */
export interface QEditorMountEventData {
  /** The underlying editor instance. */ 
  editor: any;

  /** The main API that the editor exposes. */
  api: any;
}