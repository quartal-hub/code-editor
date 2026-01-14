import { QEditor, QEditorProps } from "@/publish";
import { TesterLayout } from "@/components/layout";
import { getExpressionExamples } from "@/examples/getExpressionExamples";
import { useState } from "react";

function ExpressionTester(): JSX.Element {
  const examples = getExpressionExamples();
  const [exampleProps, setExample] = useState<QEditorProps>(examples[0].props);

  return (
    <TesterLayout title="Expression Editor Tester">
      <div className="lead">
        JavaScript expression editor (think Excel formula editor, but JS). Write the expression only — no <code>return</code> statement.
      </div>

      <div className="row mt-3 h-50">
        <div className="col-3" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <div className="list-group">
            {examples.map((example) => (
              <button
                className="list-group-item list-group-item-action"
                key={example.title}
                onClick={() => setExample(example.props)}
              >
                <div>{example.title}</div>
                <div className="text-muted">
                  <small>{example.descr}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-9" style={{ height: "50vh" }}>
          <QEditor {...exampleProps} lang={exampleProps.lang ?? "javascript"} type="expression" />
        </div>
      </div>
    </TesterLayout>
  );
}

export default ExpressionTester;
