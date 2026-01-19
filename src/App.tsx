import { JSX, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all page components for code splitting
const Home = lazy(() => import("./pages/HomePage"));
const MonacoEditorPage = lazy(() => import("./pages/MonacoEditorPage"));
const SkinEditor = lazy(() => import("./pages/SkinEditorPage"));
const ExpressionEditor = lazy(() => import("./pages/ExpressionEditorPage"));
const FunctionEditor = lazy(() => import("./pages/FunctionEditorPage"));
const ClassEditor = lazy(() => import("./pages/ClassEditorPage"));
const ProjectEditor = lazy(() => import("./pages/ProjectEditorPage"));
const MonacoTester = lazy(() => import("./pages/MonacoTesterPage"));
const SkinTester = lazy(() => import("./pages/SkinTesterPage"));
const ExpressionTester = lazy(() => import("./pages/ExpressionTesterPage"));
const FunctionTester = lazy(() => import("./pages/FunctionTesterPage"));
const ClassTester = lazy(() => import("./pages/ClassTesterPage"));
const ProjectTester = lazy(() => import("./pages/ProjectTesterPage"));

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
