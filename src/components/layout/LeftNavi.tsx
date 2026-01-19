import { Link, useLocation } from "react-router-dom";
import { navItems } from "./navItems";
import { JSX } from "react";

export interface NavItem {
  path: string;
  label: string;
  description: string;
}

function LeftNavi(): JSX.Element {
  const location = useLocation();

  return (
    <div>
      <h2 className="mb-3">Available Editors:</h2>
      <div className="list-group">
        {navItems.filter((item) => item.path !== "/").map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`list-group-item list-group-item-action ${isActive ? "active" : ""}`}
            >
              <div className={`${isActive ? "fw-bold" : ""}`}>
                {item.label}
              </div>
              <div className="text-muted small mb-0 mt-1">
                {item.description}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default LeftNavi;
