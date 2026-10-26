/* The submit form (step 3). Shown inline on the dashboard so submitting
   is a single step, not an intro card followed by a separate page. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { uploadedSummary } from "./shared";
import { useFileUp } from "./store";
import { PageTitle, Ti } from "./ui";

export default function SubmitForm() {
  const navigate = useNavigate();
  const { s, submit, setStage } = useFileUp();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  function onSubmit() {
    if (!consent) {
      setError("Tick the box to submit.");
      return;
    }
    submit();
    navigate("/dashboard/return");
  }

  return (
    <>
      <PageTitle title="Submit your documents" sub="We'll read them and work out your estimate straight away." />

      <div className="summary">
        {uploadedSummary(s).map((x, i) => (
          <div className="summary__item" key={i}>
            <Ti name="ti-circle-check" cls="i18 c-accent" />
            <span>{x.d.title}</span>
          </div>
        ))}
      </div>

      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setError("");
          }}
        />
        I confirm these documents are mine and are correct, and I agree to send them to FileUp.
      </label>
      <p className="field-error" role="alert">
        {error}
      </p>

      <div className="page-actions">
        <button
          className="btn btn--secondary"
          type="button"
          onClick={() => {
            setStage(1); // back to the review step (shown on the workflow page)
            navigate("/dashboard/return");
          }}
        >
          Back
        </button>
        <button className="btn btn--primary" type="button" onClick={onSubmit} disabled={!consent}>
          Submit to FileUp
          <Ti name="ti-send" cls="i18" />
        </button>
      </div>
    </>
  );
}
