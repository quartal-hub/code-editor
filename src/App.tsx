import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MonacoEditorPage from "./pages/MonacoEditor";
import SkinEditor from "./pages/SkinEditor";
import ExpressionEditor from "./pages/ExpressionEditor";
import FunctionEditor from "./pages/FunctionEditor";
import ClassEditor from "./pages/ClassEditor";
import ProjectEditor from "./pages/ProjectEditor";
import MonacoTester from "./pages/MonacoTester";
import SkinTester from "./pages/SkinTester";
import ExpressionTester from "./pages/ExpressionTester";
import FunctionTester from "./pages/FunctionTester";
import ClassTester from "./pages/ClassTester";
import ProjectTester from "./pages/ProjectTester";

function App(): JSX.Element {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
