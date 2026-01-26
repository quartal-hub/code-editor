import type { QEditorExample } from "./QEditorExample";
import type { Project } from "@/model/Project";

/** These examples have not been implemented yet. */
export function getProjectExamples(): QEditorExample[] {

  return [
    {
      title: "Plain TypeScript",
      descr: "A plain TypeScript hello world project",
      props: {
        type: "project",
        data: plainTsProject as unknown as Record<string, unknown>,
      },
    },
    {
      title: "React project",
      descr: "A functioning React project",
      props: {
        type: "project",
        data: reactProject as unknown as Record<string, unknown>,
      },
    },
  ];
}

const plainTsProject: Project = {
  template: "vanilla-ts",
  files: {
    "/index.ts": {
      code: `console.log("Hello, world!");`,
    },
  },
};

const reactProject: Project = {
  files: {
    "/App.js": {
      code: `import React from "react";

export default function App() {
const [count, setCount] = React.useState(0);

return (
<div style={{ padding: "20px", textAlign: "center" }}>
<h1>Hello Sandpack!</h1>
<p>Count: {count}</p>
<button onClick={() => setCount(count + 1)}>
  Increment
</button>
</div>
);
}`,
    },
    "/index.js": {
      code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
<React.StrictMode>
<App />
</React.StrictMode>
);`,
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sandpack App</title>
</head>
<body>
<div id="root"></div>
</body>
</html>`,
    },
  },
  customSetup: {
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
  }
};