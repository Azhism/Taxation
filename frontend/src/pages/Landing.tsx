import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ThemeToggle } from "../ThemeToggle";
import "./Landing.css";

/* --- Animated "Your tax overview" card ---------------------------------- */

type CardState = {
  step: 1 | 2 | 3;
  salaryIn: boolean;
  salaryDone: boolean;
  bankIn: boolean;
  bankDone: boolean;
  barFill: number; // 0–100, drives the scan progress bar width
  insightIn: boolean;
  refund: number;
  cardIn: boolean;
};

const FINAL: CardState = {
  step: 3,
  salaryIn: true,
  salaryDone: true,
  bankIn: true,
  bankDone: true,
  barFill: 100,
  insightIn: true,
  refund: 18400,
  cardIn: true,
};

const RESET: CardState = {
  step: 1,
  salaryIn: false,
  salaryDone: false,
  bankIn: false,
  bankDone: false,
  barFill: 0,
  insightIn: false,
  refund: 0,
  cardIn: true,
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hidden = (shown: boolean) => ({
  opacity: shown ? 1 : 0,
  transform: shown ? "translateY(0)" : "translateY(10px)",
});

const OverviewCard = () => {
  // Initial render is the final state, so the card never looks broken
  // (no-JS / reduced-motion fallback). When motion is allowed, the effect
  // rewinds to RESET and runs the loop.
  const [reduced] = useState(prefersReducedMotion);
  const [s, setS] = useState<CardState>(() => (prefersReducedMotion() ? FINAL : RESET));

  useEffect(() => {
    if (reduced) return;

    let timers: number[] = [];
    let rafs: number[] = [];
    const addT = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    // Drive a 0→1 value over `dur` ms via rAF (avoids CSS transition-trigger gotchas).
    const animate = (dur: number, ease: (t: number) => number, cb: (v: number) => void) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        cb(ease(t));
        if (t < 1) rafs.push(requestAnimationFrame(tick));
      };
      rafs.push(requestAnimationFrame(tick));
    };
    const linear = (t: number) => t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const runCycle = () => {
      // Previous cycle's timers/rAFs have all fired by now; drop the stale ids.
      timers.length = 0;
      rafs.length = 0;

      setS(RESET);
      addT(() => setS((p) => ({ ...p, salaryIn: true })), 400);
      addT(() => setS((p) => ({ ...p, salaryDone: true, step: 2 })), 1500);
      addT(() => {
        setS((p) => ({ ...p, bankIn: true }));
        animate(2400, linear, (v) => setS((p) => ({ ...p, barFill: v * 100 })));
      }, 1900);
      addT(() => setS((p) => ({ ...p, bankDone: true, step: 3 })), 4400);
      addT(() => {
        setS((p) => ({ ...p, insightIn: true }));
        animate(1300, easeOut, (v) => setS((p) => ({ ...p, refund: Math.round(v * 18400) })));
      }, 4800);
      addT(() => setS((p) => ({ ...p, cardIn: false })), 10200);
      addT(runCycle, 10900);
    };

    runCycle();

    return () => {
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
    };
  }, [reduced]);

  return (
    <div className="overview" id="overview" aria-hidden="true" style={{ opacity: s.cardIn ? 1 : 0 }}>
      <div className="overview__head">
        <div>
          <p className="overview__label">Your tax overview</p>
          <p className="overview__year">Tax year 2025-26</p>
        </div>
        <span className="badge">
          <i className="ti ti-sparkles" aria-hidden="true"></i>
          AI-assisted
        </span>
      </div>

      <div className="progress">
        <span className={`progress__seg${s.step >= 1 ? " is-on" : ""}`} id="sb1"></span>
        <span className={`progress__seg${s.step >= 2 ? " is-on" : ""}`} id="sb2"></span>
        <span className={`progress__seg${s.step >= 3 ? " is-on" : ""}`} id="sb3"></span>
        <span className="progress__label" id="stepLbl">
          Step {s.step} of 3
        </span>
      </div>

      <div className="file" id="r1" style={hidden(s.salaryIn)}>
        <i className="ti ti-file-type-pdf file__icon"></i>
        <span className="file__name">Salary slip.pdf</span>
        <span className="file__status">
          {s.salaryDone ? (
            <>
              <i className="ti ti-circle-check" id="i1"></i>
              <span id="t1">Extracted</span>
            </>
          ) : (
            <>
              <i className="ti ti-loader-2 spin" id="i1"></i>
              <span id="t1">Uploading...</span>
            </>
          )}
        </span>
      </div>

      <div className="file file--scan" id="r2" style={hidden(s.bankIn)}>
        <div className="file__row">
          <i className="ti ti-photo file__icon"></i>
          <span className="file__name">Bank statement.jpg</span>
          <span className="file__status">
            {s.bankDone ? (
              <>
                <i className="ti ti-circle-check" id="i2"></i>
                <span id="t2">Extracted</span>
              </>
            ) : (
              <>
                <i className="ti ti-loader-2 spin" id="i2"></i>
                <span id="t2">Scanning...</span>
              </>
            )}
          </span>
        </div>
        <div className="scanbar">
          <span id="bar" style={{ width: `${s.barFill}%` }}></span>
        </div>
      </div>

      <div className="insight" id="ins" style={hidden(s.insightIn)}>
        <p className="insight__label">AI found 2 possible credits</p>
        <p className="insight__amount">
          <strong id="amt">PKR {s.refund.toLocaleString("en-US")}</strong>
          <span>estimated refund</span>
        </p>
        <ul className="chips">
          <li>Employer contributions</li>
          <li>Donations</li>
        </ul>
        <p className="insight__note">Estimate only</p>
      </div>

      <div className="overview__foot">
        <span>
          <i className="ti ti-lock" aria-hidden="true"></i>Encrypted
        </span>
        <span>FBR-ready output</span>
      </div>
    </div>
  );
};

/* --- Landing page ------------------------------------------------------- */

const Landing = () => {
  return (
    <div className="fileup-landing">
      <header className="nav">
        <div className="container nav__inner">
          <Link className="brand" to="/" aria-label="FileUp home">
            <span className="brand__mark">
              <i className="ti ti-shield-check" aria-hidden="true"></i>
            </span>
            <span className="brand__text">
              <span className="brand__name">FileUp</span>
              <span className="brand__tag">Pakistan tax filing assistant</span>
            </span>
          </Link>

          <nav className="nav__links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#trust">Trust</a>
            <button className="lang" type="button" aria-label="Switch language">
              EN | اردو
            </button>
            <ThemeToggle className="lang lang--icon" />
          </nav>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero__copy">
            <p className="pill">
              <i className="ti ti-shield-check" aria-hidden="true"></i>
              Built for Pakistan&apos;s salaried individuals
            </p>
            <h1>Your FBR tax return, done in minutes</h1>
            <p className="lede">
              Upload your salary slip, confirm a few details, and get a return ready to review before you file. No
              accountant needed.
            </p>

            <div className="cta-stack">
              <Link className="btn btn--primary" to="/signup">
                Get started
                <i className="ti ti-arrow-right" aria-hidden="true"></i>
              </Link>
              <Link className="btn btn--secondary" to="/login">
                Login
              </Link>
            </div>

            <p className="fineprint">Free to start &middot; About 15 minutes &middot; Delete your data anytime</p>
          </div>

          <OverviewCard />

          <p className="sr-only">
            Illustration of the FileUp dashboard: a salary slip and a bank statement are processed, then the app shows
            an estimated refund of PKR 18,400 that you confirm before filing.
          </p>
        </section>

        <section className="how container" id="how" aria-label="How it works">
          <h2 className="how__title">How it works</h2>
          <div className="steps">
          <article className="step" tabIndex={0}>
            <span className="step__icon">
              <i className="ti ti-upload" aria-hidden="true"></i>
            </span>
            <h2>1. Upload</h2>
            <p>Salary slip and bank statement, photo or PDF.</p>
          </article>
          <article className="step" tabIndex={0}>
            <span className="step__icon">
              <i className="ti ti-list-check" aria-hidden="true"></i>
            </span>
            <h2>2. Review</h2>
            <p>Confirm what we found and answer a few questions.</p>
          </article>
          <article className="step" tabIndex={0}>
            <span className="step__icon">
              <i className="ti ti-send" aria-hidden="true"></i>
            </span>
            <h2>3. File</h2>
            <p>Get an FBR-ready return to submit on IRIS.</p>
          </article>
          </div>
        </section>
      </main>

      <footer className="trust" id="trust">
        <ul className="container trust__list">
          <li>
            <i className="ti ti-lock" aria-hidden="true"></i>Encrypted in transit and at rest
          </li>
          <li>
            <i className="ti ti-trash" aria-hidden="true"></i>Delete your documents anytime
          </li>
          <li>
            <i className="ti ti-info-circle" aria-hidden="true"></i>Not covered: business and rental income
          </li>
        </ul>
      </footer>
    </div>
  );
};

export default Landing;
