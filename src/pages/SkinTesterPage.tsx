import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";
import { JSX } from "react";

function SkinTester(): JSX.Element {
  return (
    <TesterLayout title="Skin Editor Tester">
      <div className="h-100">
        <QEditor
          type="skin"
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

export default SkinTester;
