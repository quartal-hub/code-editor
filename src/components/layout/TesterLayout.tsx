import { ReactNode } from "react";
import LeftNavi from "./LeftNavi";
import TopNavi from "./TopNavi";

interface TesterLayoutProps {
  title: string;
  children: ReactNode;
}

function TesterLayout({ title, children }: TesterLayoutProps): JSX.Element {
  return (
    <div className="h-100">
      <TopNavi />
      <div className="container h-100">
        <h1 className="my-3">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default TesterLayout;
