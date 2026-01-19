import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";
import { getClassExamples } from "@/examples/getClassExamples";
import { JSX } from "react";

const testCode = getClassExamples()[1].props.code;

function ClassTester(): JSX.Element {
  return (
    <TesterLayout title="Class Editor Tester">
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
    </TesterLayout>
  );
}

export default ClassTester;
