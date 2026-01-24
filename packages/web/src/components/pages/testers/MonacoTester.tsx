import { QEditor } from "@/publish";
import type { QEditorProps } from "@/publish";
import { getMonacoExamples } from "@/examples/getMonacoExamples";
import { useState } from "react";
import type { JSX } from "react";

function MonacoTester(): JSX.Element {
  const examples = getMonacoExamples();
  const [exampleProps, setExample] = useState<QEditorProps>(examples[0].props);

  return (
    <>
      <div className="lead">
        This is the basic Monaco code editor for editing miscellaneous single code files, typically JSON for data, CSS / skins, JS/TS or HTML.
      </div>
      <div className="row mt-3 h-50">
        <div className="col-3" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <div className="list-group">
            {examples.map((example) => (
              <button className="list-group-item list-group-item-action" key={example.title}
                onClick={() => setExample(example.props)}>
                  <div>{example.title}</div>
                  <div className="text-muted"><small>{example.descr}</small></div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-9">
          <QEditor
            {...exampleProps}
            type="monaco"
          />
        </div>
      </div>
    </>
  );
}

export default MonacoTester;
