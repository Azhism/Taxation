/* The documents list: one row per document, required progress, and a
   gated Continue button. */

import { type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { CONFIG, DOCS, bankReady, docStatus, payReady, requiredCount } from "./shared";
import { useFileUp } from "./store";
import { Crumbs, Ti } from "./ui";

export default function DocumentsList() {
  const navigate = useNavigate();
  const { s, docsContinue } = useFileUp();

  if (!s.started || s.stage > 2) return <Navigate to="/dashboard" replace />;

  const n = requiredCount(s);
  const todo = !bankReady(s) ? "bank" : !payReady(s) ? "pay" : null;
  const open = requiredCount(s) === 2 || CONFIG.DEMO_UNLOCK_CONTINUE;

  return (
    <div className="view">
      <Crumbs
        items={[
          { text: "Dashboard", to: "/dashboard" },
          { text: "2025-26 return", to: "/dashboard/return" },
          { text: "Documents" },
        ]}
      />

      <div className="docs-head">
        <h1 className="page-title">Your documents</h1>
        <span className="docs-count">{n} of 2 required</span>
      </div>

      <div className="meter meter--thin">
        <div className="meter__fill" style={{ width: n * 50 + "%" }} />
      </div>

      <div className="doclist">
        {DOCS.map((d) => {
          const status = docStatus(s, d.id);
          let right: ReactNode;
          if (status.kind === "empty") {
            right = (
              <button
                className={"btn btn--sm " + (d.id === todo ? "btn--primary" : "btn--secondary")}
                type="button"
                tabIndex={-1}
              >
                {status.text}
              </button>
            );
          } else if (status.kind === "busy") {
            right = (
              <span className="doc__status">
                <Ti name="ti-loader-2" cls="spin i18 c-accent" />
                {status.text}
              </span>
            );
          } else if (status.kind === "partial") {
            right = (
              <>
                <span className="doc__status doc__status--warn">{status.text}</span>
                <Ti name="ti-chevron-right" cls="i18 c-subtle" />
              </>
            );
          } else {
            right = (
              <>
                <span className="doc__status doc__status--done">
                  <Ti name="ti-circle-check" cls="i18" />
                  {status.text}
                </span>
                <Ti name="ti-chevron-right" cls="i18 c-subtle" />
              </>
            );
          }

          const goDoc = () => navigate("/dashboard/return/documents/" + d.slug);
          return (
            <div
              key={d.id}
              className="doc doc--link"
              role="button"
              tabIndex={0}
              onClick={goDoc}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goDoc();
                }
              }}
            >
              <span className="doc__icon">
                <Ti name={d.icon} cls="i20" />
              </span>
              <div className="doc__body">
                <div className="doc__name">{d.title}</div>
                <div className="doc__meta">{d.required ? "Required" : "Optional"}</div>
              </div>
              {right}
            </div>
          );
        })}
      </div>

      <div className="page-actions page-actions--end">
        <div className="page-actions__stack">
          <button
            className={"btn " + (open ? "btn--primary" : "btn--secondary")}
            type="button"
            onClick={() => {
              if (docsContinue()) navigate("/dashboard/return");
            }}
          >
            Continue
            <Ti name="ti-arrow-right" cls="i18" />
          </button>
          {CONFIG.DEMO_UNLOCK_CONTINUE && requiredCount(s) < 2 && (
            <span className="hint">
              Preview mode: Continue is unlocked. In the live app it waits for bank statements and payslip.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
