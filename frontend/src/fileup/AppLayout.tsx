/* Logged-in app shell: header, routed content, and the ?preview bar. */

import { Link, Outlet, useNavigate } from "react-router-dom";

import { CONFIG, STAGE_LABELS } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";

import "./app.css";

function initials(): string {
  try {
    const name = localStorage.getItem("USER_NAME") || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length) return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  } catch {
    /* ignore */
  }
  return "DU";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { s, jump, resetAll } = useFileUp();

  function logout() {
    resetAll();
    try {
      localStorage.removeItem("TOKEN");
      localStorage.removeItem("USER_EMAIL");
      localStorage.removeItem("USER_NAME");
    } catch {
      /* ignore */
    }
    navigate("/");
  }

  return (
    <div className="fileup-app">
      <header className="nav">
        <div className="container nav__inner">
          <Link className="brand" to="/dashboard" aria-label="FileUp dashboard">
            <span className="brand__mark">
              <Ti name="ti-shield-check" />
            </span>
            <span className="brand__text">
              <span className="brand__name">FileUp</span>
            </span>
          </Link>
          <div className="app-user">
            <span className="avatar" aria-hidden="true">
              {initials()}
            </span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={logout}>
              <Ti name="ti-logout" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {CONFIG.SHOW_PREVIEW_BAR && (
        <div className="devbar">
          <p className="devbar__label">Preview: jump to where a user would land after logging in</p>
          <div className="devbar__row">
            {STAGE_LABELS.map((label, i) => (
              <button
                key={label}
                className={"qchip" + (i === s.stage ? " is-on" : "")}
                type="button"
                onClick={() => {
                  jump(i);
                  navigate("/dashboard");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
