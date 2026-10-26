/* Approval: the only place a tax result is shown to the user. They
   approve to file, or ask the team for changes. */

import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { REFUND } from "./shared";
import { useFileUp } from "./store";
import { Crumbs, PageTitle, Ti } from "./ui";

function DownloadRow({ icon, name, sub }: { icon: string; name: string; sub: string }) {
  return (
    <div className="doc">
      <span className="doc__icon">
        <Ti name={icon} cls="i20" />
      </span>
      <div className="doc__body">
        <div className="doc__name">{name}</div>
        <div className="doc__meta">{sub}</div>
      </div>
      <button className="btn btn--secondary btn--sm" type="button">
        <Ti name="ti-download" cls="i16" /> PDF
      </button>
    </div>
  );
}

export default function Approval() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;

  const [consent, setConsent] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [askText, setAskText] = useState("");
  const [askError, setAskError] = useState("");

  // Seeing the approval page clears the dashboard "arrived" banner.
  useEffect(() => {
    store.clearArrived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (s.stage !== 4) return <Navigate to="/dashboard" replace />;

  function onApprove() {
    if (!consent) {
      setApproveError("Tick the box to approve.");
      return;
    }
    store.approve(1); // single mocked version
    navigate("/dashboard");
  }

  function onAskSend() {
    if (!askText.trim()) {
      setAskError("Write what you would like us to change.");
      return;
    }
    store.askSend();
  }

  let actionArea: ReactNode;
  if (s.askSent) {
    actionArea = (
      <div className="sent">
        <Ti name="ti-circle-check" cls="i24 c-accent" />
        <div>
          <div className="sent__title">Sent to our team</div>
          <div className="sent__text">We'll update your return and send it back for approval.</div>
        </div>
      </div>
    );
  } else if (s.asking) {
    actionArea = (
      <>
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
      </>
    );
  } else {
    actionArea = (
      <>
        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setApproveError("");
            }}
          />
          I have reviewed these documents and approve FileUp to file my return.
        </label>
        <p className="field-error" role="alert">
          {approveError}
        </p>
        <div className="actions">
          <button className="btn btn--primary" type="button" onClick={onApprove}>
            Approve and file
            <Ti name="ti-arrow-right" cls="i18" />
          </button>
          <button className="btn btn--secondary" type="button" onClick={store.askOpen}>
            Ask for changes
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="view">
      <Crumbs items={[{ text: "Dashboard", to: "/dashboard" }, { text: "Approval" }]} />
      <PageTitle title="Your return is ready" sub="Our team prepared this from your documents. Review it, then approve." />

      <div className="result">
        <div className="result__label">Your result</div>
        <div className="result__value">
          PKR {REFUND.toLocaleString("en-US")} <span className="result__unit">refund due</span>
        </div>
      </div>

      <div className="note">
        <span className="note__av">FU</span>
        <div>
          <div className="note__label">Note from our team</div>
          <div className="note__text">We claimed your mobile phone tax. Everything else matched your documents.</div>
        </div>
      </div>

      <div className="doclist" style={{ marginBottom: 16 }}>
        <DownloadRow icon="ti-file-text" name="Tax return" sub="Draft to be filed" />
        <DownloadRow icon="ti-calculator" name="Our working" sub="How we calculated it" />
        <DownloadRow icon="ti-certificate" name="Income certificate" sub="Summary of your income" />
      </div>

      {actionArea}

      <p className="hint" style={{ marginTop: 14 }}>
        Sample values
      </p>
    </div>
  );
}
