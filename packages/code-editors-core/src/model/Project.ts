/** A project that can be displayed / edited in the project editor component. */
export interface Project {
  /** A Sandpack template name to be used for the project. */
  template?: string;
  /** The code files that should be edited. */
  files: Record<string, { code: string }>;
  /** The custom setup for the project. */
  customSetup?: {
    /** The dependencies that should be installed in the project. */
    dependencies?: Record<string, string>;
    /** The development dependencies that should be installed in the project. */
    devDependencies?: Record<string, string>;
  };
}