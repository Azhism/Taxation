/* Logged-in app shell: header, routed content, and the ?preview bar. */

import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { CONFIG, PREVIEW_LABELS } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";
import { ThemeToggle } from "../ThemeToggle";

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

function readLS(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

/* The profile button: the avatar opens a small menu with the account and a
   log-out option. Closes on outside click or Escape. */
function ProfileMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = readLS("USER_NAME") || "Demo User";
  const email = readLS("USER_EMAIL");

  return (
    <div className="app-menu" ref={ref}>
      <button
        className="avatar avatar--btn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        {initials()}
      </button>
      {open && (
        <div className="app-menu__pop" role="menu">
          <div className="app-menu__id">
            <div className="app-menu__name">{name}</div>
            {email && <div className="app-menu__email">{email}</div>}
          </div>
          <button
            className="app-menu__item"
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <Ti name="ti-logout" cls="i18" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { s, jump, waDemo, payRejectDemo, clearWaBanner, clearNotice, resetAll } = useFileUp();

  // Banners clear as the user moves away from the status screens. The
  // WhatsApp arrival banner belongs to Home; the payment notice shows on
  // Home and the workflow page, then clears once they leave both.
  useEffect(() => {
    const p = location.pathname;
    if (p !== "/dashboard" && s.waBanner) clearWaBanner();
    const onStatusPage = p === "/dashboard" || p === "/dashboard/return";
    if (!onStatusPage && s.notice) clearNotice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
            <ThemeToggle className="btn btn--secondary btn--sm btn--icon" />
            <ProfileMenu onLogout={logout} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {CONFIG.SHOW_PREVIEW_BAR && (
        <div className="devbar">
          <p className="devbar__label">Preview: jump to what a user sees right after logging in</p>
          <div className="devbar__row">
            {PREVIEW_LABELS.map((label, i) => {
              const on = i === 0 ? !s.started : s.started && i - 1 === s.stage;
              return (
                <button
                  key={label}
                  className={"qchip" + (on ? " is-on" : "")}
                  type="button"
                  onClick={() => {
                    jump(i);
                    navigate("/dashboard");
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="devbar__row" style={{ marginTop: 6 }}>
            <button
              className="qchip"
              type="button"
              onClick={() => {
                waDemo();
                navigate("/dashboard");
              }}
            >
              Demo: payslip arrives on WhatsApp
            </button>
            <button
              className="qchip"
              type="button"
              onClick={() => {
                payRejectDemo();
                navigate("/dashboard");
              }}
            >
              Demo: payment not verified
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
