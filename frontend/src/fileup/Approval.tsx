/* Step 3 "Approve" (status 4), shown right on the return page — no separate
   screen to click through to. The team has confirmed the return: the user
   sees what's left to pay FBR (paid from their own bank app, not through us),
   can look over the documents (optional), ticks one consent box and pays our
   fee to file.

   The same screen opens from the Pay step's Review button (mode "review"):
   the return is already approved there, so the box starts ticked and the
   button goes straight to payment. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AMOUNTS, feeDue, finalAmount, money, teamNote } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";

const DOCS = [
  { key: "return", icon: "ti-file-certificate", title: "Tax return", desc: "What we'll file with FBR" },
  { key: "working", icon: "ti-calculator", title: "Our working", desc: "How we calculated your tax" },
  { key: "cert", icon: "ti-file-text", title: "Income certificate", desc: "Summary of your income" },
];

const NEXT = [
  "You pay the fee by bank transfer and upload a screenshot.",
  "We file your return with FBR within 1 to 2 working days.",
  "Your FBR acknowledgement appears here, and we send it to you on WhatsApp.",
];

export default function Approval({
  eyebrow,
  mode = "approve",
  onClose,
}: {
  eyebrow: string;
  mode?: "approve" | "review";
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;
  const reviewing = mode === "review";

  const [consent, setConsent] = useState(reviewing);
  const [consentError, setConsentError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [askText, setAskText] = useState("");
  const [askError, setAskError] = useState("");

  // Remaining tax to pay FBR, and how it moved from the AI estimate.
  const total = finalAmount(s);
  const remaining = total - AMOUNTS.FINAL_DEDUCTED;
  const diff = remaining - (AMOUNTS.ESTIMATE - AMOUNTS.ESTIMATE_DEDUCTED);
  const due = feeDue(s);

  function onPay() {
    if (processing) return;
    if (!consent) {
      setConsentError("Tick the box to continue.");
      return;
    }
    if (reviewing) {
      navigate("/dashboard/return/payment");
      return;
    }
    setProcessing(true);
    window.setTimeout(() => {
      store.approve(1);
      navigate("/dashboard/return/payment");
    }, 700);
  }

  function onApplyCoupon() {
    const err = store.couponApply(code);
    setCouponError(err);
    if (!err) setCouponOpen(false);
  }

  function onAskSend() {
    if (!askText.trim()) {
      setAskError("Write what you would like us to change.");
      return;
    }
    store.askSend();
  }

  return (
    <section className="stage cf">
      <p className="stage__eyebrow">{eyebrow}</p>
      <h2 className="cf-head">Your return is ready to file</h2>
      <p className="cf-sub">Our team has checked everything. Look over your documents if you'd like, then approve.</p>

      {/* What's left to pay FBR — paid from the user's bank app, not through us */}
      <section className="cf-tax">
        <div className="cf-tax__top">
          <span className="cf-tax__label">{remaining < 0 ? "Refund due" : "Remaining tax to pay"}</span>
          <span className="cf-pill">
            <Ti name="ti-checks" cls="i16" />
            Confirmed by our team
          </span>
        </div>
        <div className="cf-tax__amount">{money(Math.abs(remaining))}</div>
        {diff !== 0 && (
          <p className="cf-diff">
            <Ti name={diff > 0 ? "ti-arrow-up-right" : "ti-arrow-down-right"} cls="i16" />
            {money(Math.abs(diff))} {diff > 0 ? "more" : "less"} than your estimate. {teamNote(s)}
          </p>
        )}
        <div className="cf-brk">
          <div className="cf-brk__row">
            <span>Total tax for the year</span>
            <span>{money(total)}</span>
          </div>
          <div className="cf-brk__row">
            <span>Already deducted (salary, bank, phone)</span>
            <span>− {money(AMOUNTS.FINAL_DEDUCTED)}</span>
          </div>
        </div>
        <p className="cf-psid">
          <Ti name="ti-info-circle" cls="i16" />
          You'll pay this to FBR from your bank app. We'll send you the payment ID (PSID) on WhatsApp.
        </p>
      </section>

      {/* Documents — optional */}
      <div className="cf-secrow">
        <span className="cf-secrow__title">Your documents</span>
        <span className="cf-secrow__opt">Optional</span>
      </div>
      <div className="cf-docs">
        {DOCS.map((d) => (
          <div key={d.key} className="cf-doc">
            <span className="cf-doc__tile">
              <Ti name={d.icon} cls="i20" />
            </span>
            <span className="cf-doc__body">
              <span className="cf-doc__title">{d.title}</span>
              <span className="cf-doc__desc">{d.desc}</span>
            </span>
            <button className="cf-review" type="button">
              View
            </button>
          </div>
        ))}
      </div>

      {/* Our fee — the one thing paid through FileUp */}
      <section className="cf-fee">
        <div className="cf-fee__main">
          <span className="cf-fee__label">FileUp fee</span>
          <span className="cf-fee__line">One-time, for preparing and filing your return</span>
        </div>
        <div className="cf-fee__amt">{money(due)}</div>
        <div className="cf-fee__coupon">
          {s.payment.coupon ? (
            <span className="cf-coupon__on">
              <Ti name="ti-discount-2" cls="i16" />
              Coupon {s.payment.coupon} · − {money(s.payment.discount)}
              <button className="cf-link" type="button" onClick={store.couponRemove}>
                Remove
              </button>
            </span>
          ) : couponOpen ? (
            <div className="cf-coupon">
              <input
                className="input"
                aria-label="Coupon code"
                placeholder="Enter code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (couponError) setCouponError("");
                }}
              />
              <button className="btn btn--secondary btn--sm" type="button" onClick={onApplyCoupon}>
                Apply
              </button>
            </div>
          ) : (
            <button className="cf-link" type="button" onClick={() => setCouponOpen(true)}>
              <Ti name="ti-ticket" cls="i16" />
              Have a coupon?
            </button>
          )}
          {couponError && <p className="field-error">{couponError}</p>}
        </div>
      </section>

      {s.askSent ? (
        <div className="sent">
          <Ti name="ti-circle-check" cls="i24 c-accent" />
          <div>
            <div className="sent__title">Sent to our team</div>
            <div className="sent__text">We'll update your return and send it back for approval.</div>
          </div>
        </div>
      ) : s.asking ? (
        <div className="cf-askbox">
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
        <>
          <label className="cf-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError("");
              }}
            />
            <span>
              I've checked my details and authorise FileUp to file my return with <strong>FBR</strong>.
            </span>
          </label>
          <p className="field-error" role="alert">
            {consentError}
          </p>
          <button className="cf-pay" type="button" onClick={onPay}>
            {processing ? "Processing…" : due > 0 ? `Pay ${money(due)} and file` : "File my return"}
          </button>
          <div className="cf-ask">
            <button className="cf-ask__link" type="button" onClick={store.askOpen}>
              Ask for changes
            </button>
            <span className="cf-ask__note"> · we reply within a few hours</span>
          </div>
          {reviewing && onClose && (
            <div className="cf-ask">
              <button className="cf-ask__link" type="button" onClick={onClose}>
                Close review
              </button>
            </div>
          )}
        </>
      )}

      <div className="cf-next">
        <div className="cf-next__title">What happens next</div>
        <ol>
          {NEXT.map((t, i) => (
            <li key={i}>
              <span className="cf-next__n">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
