/* The review summary (step 2). Shown inline on the dashboard so reviewing
   is a single step, not an intro card followed by a separate page. */

import { useNavigate } from "react-router-dom";

import { uploadedSummary } from "./shared";
import { useFileUp } from "./store";
import { PageTitle, Ti } from "./ui";

export default function ReviewContent() {
  const navigate = useNavigate();
  const { s, reviewContinue } = useFileUp();

  return (
    <>
      <PageTitle title="Review your documents" sub="Check what you uploaded before you send it to us." />

      <div className="doclist">
        {uploadedSummary(s).map((x, i) => (
          <div className="doc" key={i}>
            <span className="doc__icon">
              <Ti name={x.d.icon} cls="i20" />
            </span>
            <div className="doc__body">
              <div className="doc__name">{x.d.title}</div>
              <div className="doc__meta">{x.meta}</div>
            </div>
            <button className="btn btn--secondary btn--sm" type="button">
              View
            </button>
          </div>
        ))}
      </div>

      <div className="page-actions">
        <button className="btn btn--secondary" type="button" onClick={() => navigate("/dashboard/documents")}>
          Back to documents
        </button>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            reviewContinue();
            navigate("/dashboard");
          }}
        >
          Looks good, continue
          <Ti name="ti-arrow-right" cls="i18" />
        </button>
      </div>
    </>
  );
}
