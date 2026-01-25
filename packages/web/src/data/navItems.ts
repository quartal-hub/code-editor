import type { NavItem } from "vue-editors";

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "About",
    description: "About the Quartal Hub Code UI",
  },
  {
    path: "/demo/monaco-demo",
    label: "Monaco Editor",
    description: "Vue version of the stand-alone Monaco editor for editing single files",
  },
  {
    path: "/demo/monaco-react-demo",
    label: "Monaco Editor (React/Sandpack)",
    description: "React/Sandpack version of the stand-alone Monaco editor: This is used with Sandpack and other React based editor tools.",
  },
  {
    path: "/demo/expression-demo",
    label: "Expression Editor",
    description: "Simple excel-like expression editor",
  },
  {
    path: "/demo/class-demo",
    label: "Class Editor",
    description: "Visual editor for a class with properties, expressions, functions, and interfaces",
  },
  {
    path: "/demo/project-demo",
    label: "Project Editor",
    description: "Project editor for Quartal Hub business logic tools and Quartal Hub UXs",
  },
  {
    path: "/demo/skin-demo",
    label: "Skin Editor",
    description: "Visual editor for Bootstrap based skins",
  },
  {
    path: "/demo/function-demo",
    label: "Function Editor",
    description: "Editor for a single function within a class",
  },
];
