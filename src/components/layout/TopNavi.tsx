import { Link, useLocation } from "react-router-dom";
import { navItems } from "./navItems";

function TopNavi(): JSX.Element {
  const location = useLocation();

  return (
    <div>
      <nav className="navbar quartal-topnavi-override">
        <div className="container-fluid">
          <div className="d-none d-lg-flex ms-3" style={{ fontSize: "1.3rem" }}>
            <img src="https://cdn.quartal.com/img/logo/quartal-logo-q.png" style={{ height: "32px" }} alt="Logo" className="me-3" />
            <span className="text-quartal">Quartal <strong>Code</strong></span>
          </div>
          <a className="navbar-brand" href="#"></a>
        </div>
      </nav>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-2">
        <div className="container-fluid">
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
    </div>
  );
}

export default TopNavi;
