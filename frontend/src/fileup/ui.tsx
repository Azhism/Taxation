/* Small shared building blocks for the FileUp app pages. */

import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

import { TRACKER, TRACKER_INDEX } from "./shared";

export function Ti({ name, cls }: { name: string; cls?: string }) {
  return <i className={"ti " + name + (cls ? " " + cls : "")} aria-hidden="true" />;
}

export type Crumb = { text: string; to?: string };

export function Crumbs({ items }: { items: Crumb[] }) {
  const navigate = useNavigate();
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <Ti name="ti-chevron-right" cls="i16 c-subtle" />}
          {c.to ? (
            <button type="button" onClick={() => navigate(c.to!)}>
              {c.text}
            </button>
          ) : (
            <span className="is-current">{c.text}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{sub}</p>
    </>
  );
}

export function Tracker({ stage }: { stage: number }) {
  const cur = TRACKER_INDEX[stage];
  return (
    <div className="tracker" role="list" aria-label="Progress">
      {TRACKER.map((name, i) => {
        const state = i < cur ? "done" : i === cur ? "current" : "todo";
        return (
          <Fragment key={name}>
            <div className="tracker__step" role="listitem" aria-current={state === "current" ? "step" : undefined}>
              <span className={`tracker__dot is-${state}`}>
                {state === "done" ? <Ti name="ti-check" cls="i16" /> : i + 1}
              </span>
              <span className={`tracker__name is-${state}${state === "current" ? " is-current-name" : ""}`}>{name}</span>
            </div>
            {i < TRACKER.length - 1 && <div className={`tracker__line${i < cur ? " is-done" : ""}`} />}
          </Fragment>
        );
      })}
    </div>
  );
}
