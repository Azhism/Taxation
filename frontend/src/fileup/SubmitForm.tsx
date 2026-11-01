/* The submit block at the bottom of the Upload step: one consent tick and
   the Submit button, on the same screen as the documents list. */

import { useState } from "react";

import { CONFIG, bankReady, needsAttention, payReady, slotFilesOf } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";

export default function SubmitForm() {
  const { s, submit } = useFileUp();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const files = slotFilesOf(s);
  const scanning = files.some((f) => !f.done && !needsAttention(f));
  const required = bankReady(s) && payReady(s);

  function onSubmit() {
    if (scanning) return setError("Wait for your documents to finish uploading.");
    if (!required && !CONFIG.DEMO_UNLOCK_CONTINUE) return setError("Add your bank statements and payslip first.");
    if (!consent) return setError("Tick the box to submit.");
    submit();
  }

  return (
    <div className="submit-block">
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

      <div className="page-actions page-actions--end">
        <div className="page-actions__stack">
          <button className="btn btn--primary" type="button" onClick={onSubmit} disabled={!consent || scanning}>
            Submit to FileUp
            <Ti name="ti-send" cls="i18" />
          </button>
          {scanning && <span className="hint">Waiting for your documents to finish uploading...</span>}
        </div>
      </div>
    </div>
  );
}
