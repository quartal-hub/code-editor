import type { NavItem } from "@quartal/code-editors-core";

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "About",
    description: "About the Quartal Hub Code UI",
  },
  {
    path: "/monaco/demo",
    label: "Monaco Editor",
    description: "Vue version of the stand-alone Monaco editor for editing single files",
  },
  {
    path: "/markdown/demo",
    label: "Markdown Editor",
    description: "WYSIWYG Markdown editor (Milkdown Crepe)",
  },
  {
    path: "/markdown-hybrid/demo",
    label: "Markdown (hybrid)",
    description: "Obsidian-like hybrid Markdown editor: markers are shown in the block being edited",
  },
  {
    path: "/expression/demo",
    label: "Expression Editor",
    description: "Simple excel-like expression editor",
  },
  {
    path: "/class/demo",
    label: "Class Editor",
    description: "Visual editor for a class with properties, expressions, functions, and interfaces",
  },
  {
    path: "/project/demo",
    label: "Project Editor",
    description: "Project editor for Quartal Hub business logic tools and Quartal Hub UXs",
  },
  {
    path: "/excalidraw/demo",
    label: "Excalidraw Editor",
    description: "Excalidraw editor for editing and displaying drawings and diagrams",
  },
  {
    path: "/function/demo",
    label: "Function Editor",
    description: "Editor for a single function within a class",
  },
  {
    path: "/monaco-react/demo",
    label: "Monaco (React)",
    description: "React/Sandpack version of the stand-alone Monaco editor: This is used with Sandpack and other React based editor tools.",
  },
];
