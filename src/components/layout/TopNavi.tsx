import { Link, useLocation } from "react-router-dom";
import { navItems } from "./navItems";

function TopNavi(): JSX.Element {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-light quartal-topnavi-override">
      <div className="container-fluid">
        <Link className="navbar-brand ms-3" to="/">
          <img src="https://cdn.quartal.com/img/logo/quartal-logo.png" alt="@Quartal" style={{ height: "32px", mixBlendMode: "multiply" }} />
          <strong className="ms-2">
            Code
          </strong>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default TopNavi;
