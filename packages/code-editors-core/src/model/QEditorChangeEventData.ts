/**
 * Data sent from the editor to the parent when the code changes.
 */
export interface QEditorChangeEventData {
  /** Most editors will send the code back as string in onChange event. */
  code?: string;
  /** Some editors will the data as an object in onChange event. */
  data?: any;
  /** Monaco editor will send the cursor position in the onChange event. */
  cursorPosition?: {
    /** Line number of the cursor position. */
    lineNumber: number;
    /** Column number of the cursor position. */
    column: number;
  };
}