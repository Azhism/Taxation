/* Admin panel shell: its own header, but the same FileUpProvider as the
   user app (lifted in main.tsx), so admin actions drive the user's return.
   This is a mocked prototype; real role-gating is backend work. */

import { Link, Outlet, useNavigate } from "react-router-dom";

import { Ti } from "../ui";
import { ThemeToggle } from "../../ThemeToggle";

import "../app.css";
import "./admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="fileup-app fileup-admin">
      <header className="nav">
        <div className="container nav__inner">
          <Link className="brand" to="/admin" aria-label="FileUp admin">
            <span className="brand__mark">
              <Ti name="ti-shield-check" />
            </span>
            <span className="brand__text">
              <span className="brand__name">FileUp</span>
            </span>
            <span className="admin-tag">Admin</span>
          </Link>
          <div className="app-user">
            <ThemeToggle className="btn btn--secondary btn--sm btn--icon" />
            <button className="btn btn--secondary btn--sm" type="button" onClick={() => navigate("/dashboard")}>
              <Ti name="ti-user" />
              User view
            </button>
          </div>
        </div>
      </header>

      <main className="app-main app-main--wide">
        <Outlet />
      </main>
    </div>
  );
}
