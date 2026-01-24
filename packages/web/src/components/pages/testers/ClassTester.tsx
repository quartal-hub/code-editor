import { QEditor } from "@/publish";
import { getClassExamples } from "@/examples/getClassExamples";
import type { JSX } from "react";

const testCode = getClassExamples()[1].props.code;

function ClassTester(): JSX.Element {
  return (
    <div className="h-100">
      <QEditor
        type="class"
        mode="default"
        code={testCode}
        lang=""
        data={{}}
        onChange={(value) => console.log(value)}
      />
    </div>
  );
}

export default ClassTester;
