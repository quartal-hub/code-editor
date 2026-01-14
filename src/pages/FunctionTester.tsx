import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";

function FunctionTester(): JSX.Element {
  return (
    <TesterLayout title="Function Editor Tester">
      <div className="h-100">
        <QEditor
          type="function"
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

export default FunctionTester;
