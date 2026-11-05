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
    description: "Obsidian-like hybrid Markdown editor (test / evaluation only: use the Markdown Editor instead)",
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
    path: "/files/demo",
    label: "Files Editor",
    description: "Monaco editor for many files, used by the Quartal file explorer",
  },
  {
    path: "/excalidraw/demo",
    label: "Excalidraw Editor",
    description: "Excalidraw editor for editing and displaying drawings and diagrams",
  },
];
