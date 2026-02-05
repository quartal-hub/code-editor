/**
 * Data sent from the editor to the parent when the code changes.
 */
export interface QEditorChangeEventData {
  /**
   * Type of the event.
   * This should always be present in window communication events to identify the event.
   * Not necessary in Vue/React component communication where event is clearly defined.
   */
  type?: "on-change";
  /** Most editors will send the code back as string in `change` event. */
  code?: string;
  /** Some editors will the data as an object in `change` event. */
  data?: any;
  /** Monaco editor will send the cursor position in the `change` event. */
  cursorPosition?: {
    /** Line number of the cursor position. */
    lineNumber: number;
    /** Column number of the cursor position. */
    column: number;
  };
}