import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";

function ExpressionTester(): JSX.Element {
  return (
    <TesterLayout title="Expression Editor Tester">
      <div className="h-100">
        <QEditor
          type="expression"
          mode="default"
          code=""
          language=""
          data={{}}
          onChange={(value) => console.log(value)}
        />
      </div>
    </TesterLayout>
  );
}

export default ExpressionTester;
