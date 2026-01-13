import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";

function MonacoTester(): JSX.Element {
  return (
    <TesterLayout title="Monaco Editor Tester">
      <div className="h-100">
        <QEditor
          type="monaco"
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

export default MonacoTester;
