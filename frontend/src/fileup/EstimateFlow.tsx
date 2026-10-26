/* ==========================================================
   The "AI estimate" flow: two screens shown right after the
   user finishes Review (step 2 of 5), before our team confirms
   the return.

   Screen 1 ("Preparing your estimate") walks a 5-step checklist
   and auto-advances to screen 2 ("Your estimate is ready"),
   which shows the AI number and what happens next.

   This file is a self-contained, light-theme demo rendered at
   /estimate. The number is an AI estimate, never final; our team
   reviews it and gets back within a day, and the user pays only
   the service fee later.

   In production: drive the checklist from real backend progress
   (don't pad), and feed the real estimate into the amount. This
   screen carries no payment step and no 5-step return stepper.
   ========================================================== */

import { useEffect, useRef, useState } from "react";

import "./EstimateFlow.css";

// The five loading steps, in order. Exactly five — no more.
const STEPS = [
  "Documents uploaded",
  "Content extracted",
  "Content sent to AI",
  "AI calculating tax",
  "Estimate ready",
];

// The estimate shown (demo value). In production this comes from the model.
const ESTIMATE = "PKR 126,500";

// Demo timing. In production, each tick follows real backend progress.
const STEP_MS = 1100; // steps complete ~1.1s apart
const HOLD_MS = 800; // pause after the last step before fading to screen 2

const reduceMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Spinner() {
  return <i className="ti ti-loader-2 est-spin" aria-hidden="true" />;
}

/* ---------- Screen 1: loading ---------- */

function Loading({ onDone }: { onDone: () => void }) {
  // `done` = how many steps have completed (0..5). The step at index
  // `done` is the active one; once done === STEPS.length all are complete.
  const [done, setDone] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduceMotion) {
      setDone(STEPS.length);
      const t = window.setTimeout(onDone, HOLD_MS);
      timers.current.push(t);
      return () => timers.current.forEach((x) => window.clearTimeout(x));
    }
    // Complete one step every STEP_MS, then hold briefly and advance.
    for (let i = 1; i <= STEPS.length; i++) {
      timers.current.push(window.setTimeout(() => setDone(i), STEP_MS * i));
    }
    timers.current.push(window.setTimeout(onDone, STEP_MS * STEPS.length + HOLD_MS));
    return () => timers.current.forEach((x) => window.clearTimeout(x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="est-card est-fade">
      <div className="est-tile est-tile--teal">
        <i className="ti ti-sparkles" aria-hidden="true" />
      </div>

      <h1 className="est-h">Preparing your estimate</h1>
      <p className="est-sub">Please keep this page open.</p>

      <div className="est-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="est-bar__fill" style={{ width: pct + "%" }} />
      </div>

      <ol className="est-steps">
        {STEPS.map((label, i) => {
          const state = i < done ? "done" : i === done ? "active" : "pending";
          return (
            <li key={label} className={"est-step est-step--" + state}>
              {state === "done" ? (
                <i className="ti ti-circle-check" aria-hidden="true" />
              ) : state === "active" ? (
                <Spinner />
              ) : (
                <i className="ti ti-circle" aria-hidden="true" />
              )}
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Screen 2: estimate ready ---------- */

function Estimate() {
  return (
    <div className="est-card est-fade">
      <div className="est-tile est-tile--ok">
        <i className="ti ti-check" aria-hidden="true" />
      </div>

      <h1 className="est-h">Your estimate is ready</h1>

      <div className="est-amount">
        <div className="est-amount__top">
          <span className="est-amount__label">Estimated income tax</span>
          <span className="est-pill">AI estimate · not final</span>
        </div>
        <div className="est-amount__value">{ESTIMATE}</div>
      </div>

      <div className="est-alert" role="note">
        <i className="ti ti-alert-triangle" aria-hidden="true" />
        <p>
          <strong>AI can make mistakes.</strong> Don't rely on this blindly. Our team will review it and get back to
          you within a day.
        </p>
      </div>

      <div className="est-tl">
        <div className="est-tl__row">
          <div className="est-tl__rail">
            <span className="est-dot est-dot--done">
              <i className="ti ti-check" aria-hidden="true" />
            </span>
            <span className="est-connector est-connector--teal" />
          </div>
          <div className="est-tl__body">
            <div className="est-tl__title">AI estimate ready</div>
            <div className="est-tl__sub">Done</div>
          </div>
        </div>

        <div className="est-tl__row">
          <div className="est-tl__rail">
            <span className="est-dot est-dot--busy">
              <Spinner />
            </span>
            <span className="est-connector est-connector--gray" />
          </div>
          <div className="est-tl__body">
            <div className="est-tl__title">Our team confirms it</div>
            <div className="est-tl__sub">In progress · usually within a day</div>
          </div>
        </div>

        <div className="est-tl__row">
          <div className="est-tl__rail">
            <span className="est-dot est-dot--todo" />
          </div>
          <div className="est-tl__body">
            <div className="est-tl__title est-tl__title--muted">You review and file</div>
            <div className="est-tl__sub">Our fee is PKR 1,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Flow (loading -> estimate) + demo Replay ---------- */

export default function EstimateFlow() {
  const [screen, setScreen] = useState<"loading" | "estimate">("loading");
  // Bump to remount the loading screen on Replay.
  const [run, setRun] = useState(0);

  function replay() {
    setScreen("loading");
    setRun((n) => n + 1);
  }

  return (
    <div className="est est-page">
      {screen === "loading" ? (
        <Loading key={run} onDone={() => setScreen("estimate")} />
      ) : (
        <Estimate />
      )}

      {/* Demo only: restart the flow from the loading screen. */}
      <button type="button" className="est-replay" onClick={replay}>
        <i className="ti ti-refresh" aria-hidden="true" />
        Replay
      </button>
    </div>
  );
}
