import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";

function ClassTester(): JSX.Element {
  return (
    <TesterLayout title="Class Editor Tester">
      <div className="h-100">
        <QEditor
          type="class"
          mode="default"
          code=""
          lang=""
          data={{}}
          onChange={(value) => console.log(value)}
        />
      </div>
    </TesterLayout>
  );
}

export default ClassTester;
