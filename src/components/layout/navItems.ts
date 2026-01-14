import type { NavItem } from "./LeftNavi";

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "About",
    description: "About the Quartal Hub Code UI",
  },
  {
    path: "/monaco-tester",
    label: "Monaco Editor",
    description: "Stand-alone Monaco editor for editing single files (JSON, CSS, JS/TS, HTML)",
  },
  {
    path: "/expression-tester",
    label: "Expression Editor",
    description: "Simple excel-like expression editor",
  },
  {
    path: "/class-tester",
    label: "Class Editor",
    description: "Visual editor for a class with properties, expressions, functions, and interfaces",
  },
  {
    path: "/project-tester",
    label: "Project Editor",
    description: "Project editor for Quartal Hub business logic tools and Quartal Hub UXs",
  },
  {
    path: "/skin-tester",
    label: "TODO: Skin Editor",
    description: "Visual editor for Bootstrap based skins",
  },
  {
    path: "/function-tester",
    label: "Function Editor",
    description: "Editor for a single function within a class",
  }
];
