import { QEditor } from "@/publish";
import type { JSX } from "react";

function FunctionTester(): JSX.Element {
  return (
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
  );
}

export default FunctionTester;
