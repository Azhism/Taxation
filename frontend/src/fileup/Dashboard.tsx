/* The filing workflow page at /dashboard/return: breadcrumb, tracker and
   one "current step" card for each status. The Upload step holds the
   documents list and the submit form, so uploading and submitting happen on
   one screen. Only reachable once the user has started. */

import { ReactNode, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { STEP_NUMBER, STEP_COUNT, feeDue, money } from "./shared";
import { useFileUp } from "./store";
import DocumentsList from "./DocumentsList";
import SubmitForm from "./SubmitForm";
import EstimateStep from "./EstimateStep";
import Approval from "./Approval";
import { Crumbs, PageTitle, Ti, Tracker } from "./ui";

type TlItem = { icon: ReactNode; text: string; muted?: boolean };

function Timeline({ items }: { items: TlItem[] }) {
  return (
    <div className="tl">
      {items.map((it, i) => (
        <div key={i} className={"tl__item" + (it.muted ? " is-muted" : "")}>
          {it.icon}
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}

const tlDone = (text: string): TlItem => ({ icon: <Ti name="ti-circle-check" cls="i20 c-accent" />, text });
const tlBusy = (text: string): TlItem => ({ icon: <Ti name="ti-loader-2" cls="spin i20 c-accent" />, text });
const tlTodo = (text: string): TlItem => ({ icon: <Ti name="ti-circle" cls="i20 c-gray" />, text, muted: true });

type Card = {
  icon: string;
  solid?: boolean;
  eyebrow: string;
  title: string;
  text: string;
  extra?: ReactNode;
  button?: ReactNode;
};

function StageCard({ c }: { c: Card }) {
  return (
    <section className="stage">
      <div className={"stage__icon" + (c.solid ? " stage__icon--solid" : "")}>
        <Ti name={c.icon} cls="i24" />
      </div>
      <p className="stage__eyebrow">{c.eyebrow}</p>
      <h2 className="stage__title">{c.title}</h2>
      <p className={"stage__text" + (c.button ? "" : " stage__text--tight")}>{c.text}</p>
      {c.extra}
      {c.button && <div className="stage__actions">{c.button}</div>}
    </section>
  );
}

export default function ReturnPage() {
  const navigate = useNavigate();
  const { s } = useFileUp();
  const st = s.stage;
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!s.started) return <Navigate to="/dashboard" replace />;

  const crumbs = <Crumbs items={[{ text: "Dashboard", to: "/dashboard" }, { text: "2025-26 return" }]} />;

  const nextBtn = (label: string, to: string) => (
    <button className="btn btn--primary" type="button" onClick={() => navigate(to)}>
      {label}
      <Ti name="ti-arrow-right" cls="i18" />
    </button>
  );
  const n = "Step " + STEP_NUMBER[st] + " of " + STEP_COUNT;

  // Steps 2 (estimate) and 3 (approve) bring their own card, shown right here;
  // so does the Pay step's Review, which reopens the approve screen.
  const reviewing = st === 5 && reviewOpen;
  if (st === 3 || st === 4 || reviewing) {
    return (
      <div className="view">
        {crumbs}
        <PageTitle title="Your 2025-26 return" sub="Follow the steps to file." />
        <Tracker stage={st} />
        {st === 3 ? (
          <EstimateStep eyebrow={n} />
        ) : (
          <Approval
            eyebrow={n}
            mode={reviewing ? "review" : "approve"}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </div>
    );
  }

  let card: Card;

  // Stages 1 and 2 (the old separate Review and Submit screens) show as Upload.
  if (st <= 2) {
    card = {
      icon: "ti-upload",
      eyebrow: n,
      title: "Upload your documents",
      text: "Add your bank statements and payslip, then submit them to us.",
      extra: (
        <>
          <DocumentsList />
          <SubmitForm />
        </>
      ),
    };
  } else if (st === 5) {
    card = {
      icon: "ti-credit-card",
      eyebrow: n,
      title: "Pay the service fee",
      text: "Your return is approved. Pay the " + money(feeDue(s)) + " fee to file it.",
      // Review reopens the approve screen right here; Pay now goes to payment.
      button: (
        <div className="stage__split">
          <button className="btn btn--secondary" type="button" onClick={() => setReviewOpen(true)}>
            Review
          </button>
          {nextBtn("Pay now", "/dashboard/return/payment")}
        </div>
      ),
    };
  } else if (st === 6) {
    const filing = s.filePhase >= 1;
    card = {
      icon: "ti-building-community",
      eyebrow: n,
      title: "Your return is being filed",
      text: filing
        ? "Your payment is confirmed and we're filing your return. We will let you know once it's filed."
        : "We've received your payment and we're confirming it. We will let you know once your return is filed.",
      extra: (
        <Timeline
          items={
            filing
              ? [
                  tlDone("You approved the return"),
                  tlDone("Payment verified"),
                  tlBusy("Filing in progress"),
                  tlTodo("Filed"),
                ]
              : [
                  tlDone("You approved the return"),
                  tlBusy("Verifying your payment"),
                  tlTodo("Filing in progress"),
                  tlTodo("Filed"),
                ]
          }
        />
      ),
    };
  } else {
    card = {
      icon: "ti-check",
      solid: true,
      eyebrow: "Complete",
      title: "Your return is filed",
      text: "We've filed it for you. Keep the receipt for your records.",
      button: (
        <button className="btn btn--primary" type="button">
          <Ti name="ti-download" cls="i18" />
          Download receipt
        </button>
      ),
    };
  }

  return (
    <div className="view">
      {s.notice && (
        <div className={"banner banner--" + s.notice.tone} role="status">
          <Ti name={s.notice.tone === "warn" ? "ti-alert-circle" : "ti-circle-check"} cls="i20" />
          <span>
            <strong>{s.notice.text}</strong> {s.notice.sub}
          </span>
        </div>
      )}
      {crumbs}
      <PageTitle title="Your 2025-26 return" sub="Follow the steps to file." />
      <Tracker stage={st} />
      <StageCard c={card} />
    </div>
  );
}
