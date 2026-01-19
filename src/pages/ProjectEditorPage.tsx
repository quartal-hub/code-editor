import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { SandpackMonacoEditor } from "@/components/editors";
import { JSX } from "react";

function ProjectEditor(): JSX.Element {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <SandpackProvider
        theme="dark"
        template="react"
        files={{
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
        }}
        customSetup={{
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
        }}
      >
        <SandpackLayout>
          <SandpackMonacoEditor />
          <SandpackPreview style={{ height: "100vh" }} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default ProjectEditor;
