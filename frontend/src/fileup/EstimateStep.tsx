/* Step 2 "Estimate": the documents are read one at a time (a card grows out
   of each row's icon into the stage, a scan line sweeps it, its values land
   in the ledger), then the tax is calculated and the estimate counts up.
   Timings follow the reference design (fileup-estimate-step2.html).

   A user returning to a finished estimate lands on the final state with no
   animation; so does anyone with reduced motion turned on. */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useFileUp } from "./store";
import { useWhatsApp } from "./whatsapp";
import { authToken, fetchTeamEta } from "./api";
import { buildEstimateRun, formatEta, type Found } from "./estimateRun";
import { Ti } from "./ui";
import "./EstimateStep.css";

type RowState = "wait" | "read" | "done";
type Phase = "working" | "calculating" | "ready";

const EASE = "transform .6s cubic-bezier(.2,.8,.2,1), opacity .25s";
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const fmt = (n: number) => "PKR " + Math.round(n).toLocaleString("en-US");
const CANCELLED = Symbol("cancelled");
// Used only when the backend can't be reached (demo mode): the team's usual turnaround.
const FALLBACK_SLA_HOURS = 24;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function EstimateStep({ eyebrow }: { eyebrow: string }) {
  const navigate = useNavigate();
  const { open: openWhatsApp } = useWhatsApp();
  const { s, finishEstimate } = useFileUp();

  // Snapshot the run when the screen opens; uploads can't change at this stage.
  const run = useMemo(() => buildEstimateRun(s), []); // eslint-disable-line react-hooks/exhaustive-deps
  const allFound = useMemo(() => run.docs.flatMap((d) => d.found), [run]);
  const { amount } = run.result;
  // Land on the finished state: a returning user, or reduced motion.
  const instant = useRef(s.estPhase >= 4 || prefersReducedMotion()).current;

  const [phase, setPhase] = useState<Phase>(instant ? "ready" : "working");
  const [rows, setRows] = useState<RowState[]>(run.docs.map(() => (instant ? "done" : "wait")));
  const [active, setActive] = useState<number | null>(null);
  const [cardDoc, setCardDoc] = useState(0);
  const [found, setFound] = useState<Found[]>(instant ? allFound : []);
  const [tip, setTip] = useState(0);
  const [tipShown, setTipShown] = useState(true);
  const [ledgerReady, setLedgerReady] = useState(instant);
  const [ledgerOpen, setLedgerOpen] = useState(!instant);
  const [shownAmount, setShownAmount] = useState(instant ? Math.abs(amount) : 0);
  const [eta, setEta] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ledgerBody = useRef<HTMLDivElement>(null);

  // The team's confirm-by time comes from the backend (team SLA).
  useEffect(() => {
    const from = s.submittedAt || Date.now();
    const token = authToken();
    const fallback = () => setEta(formatEta(new Date(from + FALLBACK_SLA_HOURS * 3600 * 1000)));
    if (!token) return fallback();
    fetchTeamEta(from, token)
      .then((d) => setEta(formatEta(d)))
      .catch(fallback);
  }, [s.submittedAt]);

  // FLIP: the transform that lays the stage card exactly over row i's icon box.
  function onIconTransform(i: number): string {
    const fc = cardRef.current!;
    fc.style.transition = "none";
    fc.style.transform = "none";
    const a = fc.getBoundingClientRect();
    const b = iconRefs.current[i]!.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    return `translate(${dx}px,${dy}px) scale(${b.width / a.width})`;
  }

  function collapseLedger(open: boolean) {
    const b = ledgerBody.current;
    if (!b) return;
    b.style.maxHeight = b.scrollHeight + "px";
    void b.offsetHeight;
    b.style.maxHeight = open ? b.scrollHeight + "px" : "0px";
    b.style.opacity = open ? "1" : "0";
    setLedgerOpen(open);
  }

  // Finished state with no animation: collapse the ledger without a transition.
  useEffect(() => {
    if (instant && ledgerBody.current) {
      ledgerBody.current.style.maxHeight = "0px";
      ledgerBody.current.style.opacity = "0";
    }
  }, [instant]);

  useEffect(() => {
    if (instant) {
      finishEstimate();
      return;
    }
    let cancelled = false;
    let finished = false;
    const step = async (ms: number) => {
      await wait(ms);
      if (cancelled) throw CANCELLED;
    };

    async function zoomIn(i: number) {
      const fc = cardRef.current!;
      setCardDoc(i);
      await frame();
      fc.style.transform = onIconTransform(i);
      fc.style.opacity = "1";
      void fc.offsetWidth;
      setActive(i);
      setRows((r) => r.map((x, k) => (k === i ? "read" : x)));
      fc.style.transition = EASE;
      fc.style.transform = "none";
      setTipShown(false);
      window.setTimeout(() => {
        setTip(i % run.tips.length);
        setTipShown(true);
      }, 300);
      await step(450);
      fc.classList.add("is-scan");
    }

    async function zoomOut(i: number) {
      const fc = cardRef.current!;
      fc.classList.remove("is-scan");
      const to = onIconTransform(i);
      fc.style.transform = "none";
      void fc.offsetWidth;
      fc.style.transition = EASE;
      fc.style.transform = to;
      await step(550);
      fc.style.opacity = "0";
      setRows((r) => r.map((x, k) => (k === i ? "done" : x)));
      setActive(null);
    }

    function countUp(end: number, ms: number) {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min((now - start) / ms, 1);
        setShownAmount(end * p);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    (async () => {
      try {
        await step(600);
        for (let i = 0; i < run.docs.length; i++) {
          await zoomIn(i);
          await step(550);
          for (const f of run.docs[i].found) {
            setFound((prev) => [...prev, f]);
            await step(550);
          }
          await step(400);
          await zoomOut(i);
          await step(350);
        }

        setPhase("calculating");
        await step(1600);

        setPhase("ready");
        finished = true;
        finishEstimate();
        countUp(Math.abs(amount), 800);

        await step(1000);
        setLedgerReady(true);
        collapseLedger(false);
      } catch (e) {
        if (e !== CANCELLED) throw e;
      }
    })();

    return () => {
      cancelled = true;
      // Leaving mid-animation: the estimate is still done; don't strand Home on "working".
      if (!finished) finishEstimate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLedger = () => ledgerReady && collapseLedger(!ledgerOpen);
  const onLedgerKey = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleLedger();
    }
  };

  const ready = phase === "ready";
  const n = run.docs.length;
  const card = run.docs[cardDoc];

  return (
    <section className="stage est2">
      <div className="est2__head">
        <div className="est2__spark">
          <Ti name="ti-sparkles" />
        </div>
        <div>
          <p className="est2__step">{eyebrow}</p>
          <h2 className="est2__title" aria-live="polite">
            {ready ? "Your estimate is ready" : "We're working out your estimate"}
          </h2>
        </div>
      </div>

      <div className="est2__wrap">
        <div className="est2__list">
          {run.docs.map((d, i) => {
            const st = rows[i];
            const cls =
              "est2__row" +
              (st === "read" ? " is-act" : st === "done" ? " is-done" : "") +
              (active !== null && active !== i ? " is-dim" : "");
            return (
              <div key={d.key} className={cls}>
                <div className="est2__ico" ref={(el) => (iconRefs.current[i] = el)}>
                  <Ti name={d.icon} />
                </div>
                <div className="est2__nm">{d.name}</div>
                <div className="est2__stt">
                  {st === "read" && <span className="est2__spin est2__spin--sm" />}
                  <span>{st === "wait" ? "Waiting" : st === "read" ? "Reading" : "Done"}</span>
                  <span className="est2__ok">
                    <Ti name="ti-check" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="est2__stage">
          <div className={"est2__cap" + (phase === "calculating" ? " is-calc" : "")} style={{ opacity: active !== null ? 0 : 1 }}>
            {phase === "working" && "Getting your documents ready…"}
            {phase === "calculating" && (
              <>
                <span className="est2__spin" />
                Calculating your tax for the year…
              </>
            )}
            {ready && (
              <>
                <Ti name="ti-circle-check" cls="est2__allok" />
                {n === 1 ? "Your document has been read" : `All ${n} documents read`}
              </>
            )}
          </div>
          <div className="est2__fc" ref={cardRef} aria-hidden="true">
            <div className="est2__bar" />
            <Ti name={card?.icon ?? "ti-file-text"} />
            <div className="est2__fcn">{card?.name}</div>
            <div className="est2__fcs">Reading…</div>
          </div>
        </div>
      </div>

      <div className={"est2__lg" + (ledgerReady ? " is-ready" : "") + (ledgerOpen ? " is-open" : "")}>
        <div
          className="est2__lgh"
          role={ledgerReady ? "button" : undefined}
          tabIndex={ledgerReady ? 0 : -1}
          aria-expanded={ledgerReady ? ledgerOpen : undefined}
          aria-controls="est2-ledger"
          onClick={toggleLedger}
          onKeyDown={onLedgerKey}
        >
          {ledgerReady ? (
            <>
              <span className="est2__lgt">What we found</span>
              <span className="est2__lgc">
                {" "}
                · {found.length} {found.length === 1 ? "item" : "items"}
              </span>
            </>
          ) : (
            <span>What we've found so far</span>
          )}
          <Ti name="ti-chevron-down" cls="est2__chev" />
        </div>
        <div className="est2__lgb" id="est2-ledger" ref={ledgerBody}>
          <div className="est2__ledger">
            {found.length ? (
              found.map(([label, value], i) => (
                <div key={i} className={"est2__ln" + (instant ? "" : " is-new")}>
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: "8px 0" }}>
                <div className="est2__shim" style={{ width: "70%" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={"est2__est" + (ready ? " is-ready" : "")}>
        <div className="est2__est-top">
          <span className={"est2__estl" + (phase === "calculating" ? " is-calc" : "")}>
            {ready
              ? amount < 0
                ? "Refund due"
                : "Remaining tax to pay"
              : phase === "calculating"
                ? "Calculating…"
                : "Your estimate will appear here"}
          </span>
          <span className="est2__pill" style={{ opacity: ready ? 1 : 0 }}>
            AI estimate
          </span>
        </div>
        {ready ? (
          <>
            <p className="est2__big">{fmt(shownAmount)}</p>
            <div className={"est2__brk" + (instant ? "" : " est2__fade")}>
              {run.result.rows.map(([label, value]) => (
                <div key={label} className="est2__brow">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "14px 0 6px" }}>
              <div className="est2__shim" style={{ width: "45%", height: 24 }} />
            </div>
            <div className="est2__shim" style={{ width: "80%", marginTop: 10 }} />
          </>
        )}
      </div>

      {!ready && (
        <div className="est2__tip">
          <Ti name="ti-bulb" />
          <p style={{ opacity: tipShown ? 1 : 0 }}>{run.tips[tip]}</p>
        </div>
      )}

      {ready && (
        <div className={instant ? "" : "est2__fade est2__fade--late"}>
          <p className="est2__note">Not final. Our team will confirm it by {eta || "…"}.</p>
          <div className="est2__confirm">
            <span className="est2__spin" />
            Our team is confirming it
          </div>
          <div className="est2__foot">
            <p>We'll message you on WhatsApp as soon as it's confirmed.</p>
            <div className="est2__actions">
              <button className="est2__btn-wa" type="button" onClick={openWhatsApp}>
                <Ti name="ti-brand-whatsapp" />
                Chat on WhatsApp
              </button>
              <button className="est2__btn-ghost" type="button" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
