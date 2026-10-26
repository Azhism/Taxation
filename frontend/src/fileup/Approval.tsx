/* Confirm and file (status 4). The return is already prepared and checked —
   the user only pays our service fee. The income tax figure is shown for
   information only (it is not paid through us), and reviewing documents is
   optional and never blocks paying. */

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { AMOUNTS, finalAmount, money } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";

const DOCS = [
  { key: "return", icon: "ti-file-text", title: "Tax return", desc: "What we'll file with FBR" },
  { key: "working", icon: "ti-calculator", title: "Our working", desc: "How we calculated your tax" },
  { key: "cert", icon: "ti-certificate", title: "Income certificate", desc: "Summary of your income" },
];

export default function Approval() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;

  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [askText, setAskText] = useState("");
  const [askError, setAskError] = useState("");

  // Seeing this page clears the dashboard "arrived" banner.
  useEffect(() => {
    store.clearArrived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (s.stage !== 4) return <Navigate to="/dashboard" replace />;

  function onPay() {
    if (processing) return;
    setProcessing(true);
    // Reviewing is never required; paying always works. Move on to payment.
    window.setTimeout(() => {
      store.approve(1);
      navigate("/dashboard/return/payment");
    }, 700);
  }

  function onAskSend() {
    if (!askText.trim()) {
      setAskError("Write what you would like us to change.");
      return;
    }
    store.askSend();
  }

  return (
    <div className="view cf">
      <h1 className="cf-head">Your return is ready to file</h1>
      <p className="cf-sub">
        Our team has checked everything. Have a look at your documents if you'd like, or file whenever you're ready.
      </p>

      {/* Income tax — shown for information only */}
      <section className="cf-tax">
        <div className="cf-tax__top">
          <span className="cf-tax__label">Income tax on your return</span>
          <span className="cf-pill">
            <Ti name="ti-checks" cls="i16" />
            Confirmed
          </span>
        </div>
        <div className="cf-tax__amount">{money(finalAmount(s))}</div>
      </section>

      {/* Documents — optional */}
      <div className="cf-secrow">
        <span className="cf-secrow__title">Your documents</span>
        <span className="cf-secrow__opt">Optional</span>
      </div>

      <div className="cf-docs">
        {DOCS.map((d) => {
          const done = !!viewed[d.key];
          return (
            <button
              key={d.key}
              type="button"
              className="cf-doc"
              onClick={() => setViewed((v) => ({ ...v, [d.key]: true }))}
            >
              <span className={"cf-doc__tile" + (done ? " cf-doc__tile--done" : "")}>
                <Ti name={done ? "ti-check" : d.icon} cls="i20" />
              </span>
              <span className="cf-doc__body">
                <span className="cf-doc__title">{d.title}</span>
                <span className="cf-doc__desc">{d.desc}</span>
              </span>
              <span className={"cf-review" + (done ? " cf-review--done" : "")}>{done ? "Viewed" : "Review"}</span>
            </button>
          );
        })}
      </div>

      {/* Our fee — the one thing the user pays */}
      <section className="cf-fee">
        <div className="cf-fee__main">
          <span className="cf-fee__label">Our fee</span>
          <div className="cf-fee__amt">{money(AMOUNTS.FEE)}</div>
        </div>
        <span className="cf-fee__icon">
          <Ti name="ti-receipt-2" cls="i20" />
        </span>
        <p className="cf-fee__line">A flat one-time fee for preparing and filing your return.</p>
      </section>

      <div className="cf-info">
        <Ti name="ti-clock" cls="i18" />
        <span>Your FBR acknowledgement appears here within 1 to 2 working days of filing.</span>
      </div>

      {/* Bottom action bar */}
      {s.askSent ? (
        <div className="cf-bar">
          <div className="sent">
            <Ti name="ti-circle-check" cls="i24 c-accent" />
            <div>
              <div className="sent__title">Sent to our team</div>
              <div className="sent__text">We'll update your return and send it back for approval.</div>
            </div>
          </div>
        </div>
      ) : s.asking ? (
        <div className="cf-bar">
          <div className="ask-title">What should we change?</div>
          <textarea
            className="textarea"
            rows={3}
            style={{ minHeight: 70 }}
            aria-label="What should we change?"
            placeholder="For example: I also sold a car in March"
            value={askText}
            onChange={(e) => {
              setAskText(e.target.value);
              if (e.target.value.trim()) setAskError("");
            }}
          />
          <p className="field-error" role="alert" style={{ marginTop: 6 }}>
            {askError}
          </p>
          <div className="actions">
            <button className="btn btn--primary" type="button" onClick={onAskSend}>
              Send to our team
            </button>
            <button className="btn btn--secondary" type="button" onClick={store.askCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="cf-bar">
          <button className="cf-pay" type="button" onClick={onPay}>
            {processing ? "Processing…" : "Pay now"}
          </button>
          <div className="cf-ask">
            <button className="cf-ask__link" type="button" onClick={store.askOpen}>
              Ask for changes
            </button>
            <span className="cf-ask__note"> · we reply within a few hours</span>
          </div>
        </div>
      )}
    </div>
  );
}
