import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const MonacoEditorPage = lazy(() => import("./pages/MonacoEditor"));
const SkinEditor = lazy(() => import("./pages/SkinEditor"));
const ExpressionEditor = lazy(() => import("./pages/ExpressionEditor"));
const FunctionEditor = lazy(() => import("./pages/FunctionEditor"));
const ClassEditor = lazy(() => import("./pages/ClassEditor"));
const ProjectEditor = lazy(() => import("./pages/ProjectEditor"));
const MonacoTester = lazy(() => import("./pages/MonacoTester"));
const SkinTester = lazy(() => import("./pages/SkinTester"));
const ExpressionTester = lazy(() => import("./pages/ExpressionTester"));
const FunctionTester = lazy(() => import("./pages/FunctionTester"));
const ClassTester = lazy(() => import("./pages/ClassTester"));
const ProjectTester = lazy(() => import("./pages/ProjectTester"));

// Loading fallback component
function LoadingFallback(): JSX.Element {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/monaco" element={<MonacoEditorPage />} />
          <Route path="/skin" element={<SkinEditor />} />
          <Route path="/expression" element={<ExpressionEditor />} />
          <Route path="/function" element={<FunctionEditor />} />
          <Route path="/class" element={<ClassEditor />} />
          <Route path="/project" element={<ProjectEditor />} />
          <Route path="/monaco-tester" element={<MonacoTester />} />
          <Route path="/skin-tester" element={<SkinTester />} />
          <Route path="/expression-tester" element={<ExpressionTester />} />
          <Route path="/function-tester" element={<FunctionTester />} />
          <Route path="/class-tester" element={<ClassTester />} />
          <Route path="/project-tester" element={<ProjectTester />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
