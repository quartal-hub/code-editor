import { LeftNavi, TesterLayout } from "@/components/layout";
import { JSX } from "react";

function Home(): JSX.Element {
  return (
    <TesterLayout title="Quartal Hub, Code UI">
      <div>
        <p className="lead">
          Provides a set of code editors for Quartal Hub.
          These editors are typically used as embedded in Quartal Hub user interfaces as well as external UIs that utilize Quartal Hub components.
        </p>
        <LeftNavi />
      </div>
    </TesterLayout>
  );
}

export default Home;
