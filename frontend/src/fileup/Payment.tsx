/* Payment (status 5): pay the FileUp service fee by bank transfer, then
   upload a screenshot. A coupon can reduce or clear the fee. Payment is
   manual — the admin verifies each screenshot (prototype simulates it).
   The income tax is paid to FBR separately, not here. */

import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { AMOUNTS, CONFIG, feeDue, money } from "./shared";
import { useFileUp } from "./store";
import { Crumbs, PageTitle, Ti } from "./ui";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(value);
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="acct__row">
      <div>
        <div className="acct__label">{label}</div>
        <div>{value}</div>
      </div>
      <button className="btn btn--secondary btn--sm" type="button" onClick={copy}>
        <Ti name={copied ? "ti-check" : "ti-copy"} cls="i16" /> {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;

  const [code, setCode] = useState(s.payment.coupon || "");
  const [couponError, setCouponError] = useState("");
  const [shotError, setShotError] = useState("");
  const dzRef = useRef<HTMLDivElement>(null);

  if (s.stage !== 5) return <Navigate to="/dashboard" replace />;

  const due = feeDue(s);
  const A = CONFIG.ACCOUNT;

  function onApply() {
    const err = store.couponApply(code);
    setCouponError(err);
    if (err) shake(dzRef.current); // input lives in the coupon row; shake reuses the helper
  }

  function shake(el: HTMLElement | null) {
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  function onSubmit() {
    if (due > 0 && !s.payment.shot) {
      setShotError("Upload your payment screenshot to continue.");
      shake(dzRef.current);
      return;
    }
    store.paySubmit();
    navigate("/dashboard/return");
  }

  return (
    <div className="view">
      <Crumbs
        items={[
          { text: "Dashboard", to: "/dashboard" },
          { text: "2025-26 return", to: "/dashboard/return" },
          { text: "Confirm and file", to: "/dashboard/return/approval" },
          { text: "Payment" },
        ]}
      />

      {s.payment.rejected && (
        <div className="alert" role="alert">
          <Ti name="ti-alert-circle" cls="i20" />
          <span>
            <strong>We couldn't verify your payment.</strong> Upload a clearer screenshot and try again.
          </span>
        </div>
      )}

      <PageTitle title="Pay the service fee" sub="Send the fee to our account, then upload a screenshot." />

      <div className="fees">
        <div className="fees__row">
          <span>Service fee</span>
          <span>{money(AMOUNTS.FEE)}</span>
        </div>
        {s.payment.coupon && (
          <div className="fees__row">
            <span className="c-ok fees__coupon">
              <Ti name="ti-discount-2" cls="i16" />
              Coupon {s.payment.coupon}
              <button
                className="btn btn--text"
                type="button"
                onClick={() => {
                  store.couponRemove();
                  setCode("");
                  setCouponError("");
                }}
              >
                Remove
              </button>
            </span>
            <span className="c-ok">- {money(s.payment.discount)}</span>
          </div>
        )}
        <div className="fees__row">
          <strong>You pay</strong>
          <span className="fees__total">{money(due)}</span>
        </div>
      </div>

      <div className="acct">
        <div className="section-label">Pay to this account</div>
        <CopyRow label="Bank" value={A.bank} />
        <CopyRow label="Account title" value={A.title} />
        <CopyRow label="Account number" value={A.number} />
      </div>

      <div className="section-label">Have a coupon?</div>
      <div className="coupon">
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
        <button className="btn btn--secondary" type="button" onClick={onApply}>
          Apply
        </button>
      </div>
      <p className="field-error" role="alert">
        {couponError}
      </p>

      {due > 0 && (
        <>
          <div className="section-label">Payment screenshot</div>
          {s.payment.shot ? (
            <div className="frow">
              <Ti name="ti-photo" cls="i20 c-accent" />
              <div className="frow__body">
                <div className="frow__name">payment-screenshot.jpg</div>
                <div className="frow__sub">Uploaded</div>
              </div>
              <span className="frow__status frow__status--done">
                <Ti name="ti-circle-check" cls="i16" />
                Ready
              </span>
              <button className="frow__x" type="button" aria-label="Remove screenshot" onClick={store.shotRemove}>
                <Ti name="ti-x" cls="i16" />
              </button>
            </div>
          ) : (
            <div
              className="dz"
              ref={dzRef}
              role="button"
              tabIndex={0}
              onClick={() => {
                setShotError("");
                store.shotAdd();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShotError("");
                  store.shotAdd();
                }
              }}
            >
              <Ti name="ti-cloud-upload" cls="dz__icon" />
              <div>
                Drop a screenshot or <strong>browse</strong>
              </div>
              <div className="dz__hint">PDF, PNG, or JPG</div>
            </div>
          )}
          <p className="field-error" role="alert">
            {shotError}
          </p>

          <div className="section-label">
            Transaction ID <span className="optional">(optional)</span>
          </div>
          <input className="input" aria-label="Transaction ID" placeholder="From your bank app" />
        </>
      )}

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => navigate("/dashboard/return/approval")}>
          Back
        </button>
        <button className="btn btn--primary" type="button" onClick={onSubmit}>
          {due > 0 ? "Submit payment" : "File now"}
          <Ti name="ti-arrow-right" cls="i18" />
        </button>
      </div>

      <p className="hint" style={{ marginTop: 12 }}>
        Sample account details and coupons.
      </p>
    </div>
  );
}
