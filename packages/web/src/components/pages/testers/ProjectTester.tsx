import { QEditor } from "@/publish";
import type { JSX } from "react";

function ProjectTester(): JSX.Element {
  return (
    <div className="h-100">
      <QEditor
        type="project"
        mode="default"
        code=""
        lang=""
        data={{}}
        onChange={(value) => console.log(value)}
      />
    </div>
  );
}

export default ProjectTester;
