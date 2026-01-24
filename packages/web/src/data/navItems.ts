export interface NavItem {
  path: string;
  label: string;
  description: string;
}

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "About",
    description: "About the Quartal Hub Code UI",
  },
  {
    path: "/test/monaco",
    label: "Monaco Editor",
    description: "Stand-alone Monaco editor for editing single files (JSON, CSS, JS/TS, HTML)",
  },
  {
    path: "/test/expression",
    label: "Expression Editor",
    description: "Simple excel-like expression editor",
  },
  {
    path: "/test/class",
    label: "Class Editor",
    description: "Visual editor for a class with properties, expressions, functions, and interfaces",
  },
  {
    path: "/test/project",
    label: "Project Editor",
    description: "Project editor for Quartal Hub business logic tools and Quartal Hub UXs",
  },
  {
    path: "/test/skin",
    label: "Skin Editor",
    description: "Visual editor for Bootstrap based skins",
  },
  {
    path: "/test/function",
    label: "Function Editor",
    description: "Editor for a single function within a class",
  },
];
