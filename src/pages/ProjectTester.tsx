import { QEditor } from "@/publish";
import { TesterLayout } from "@/components/layout";

function ProjectTester(): JSX.Element {
  return (
    <TesterLayout title="Project Editor Tester">
      <div className="h-100">
        <QEditor
          type="project"
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

export default ProjectTester;
