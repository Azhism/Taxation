/* The filing workflow page at /dashboard/return: breadcrumb, tracker and
   one "current step" card for each status. Steps 1 (Review) and 2 (Submit)
   render inline here. Only reachable once the user has started. */

import { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  AMOUNTS,
  ESTIMATE_DONE,
  ESTIMATE_LINES,
  STEP_NUMBER,
  feeDue,
  money,
} from "./shared";
import { useFileUp } from "./store";
import ReviewContent from "./ReviewContent";
import SubmitForm from "./SubmitForm";
import { CountUp, Crumbs, PageTitle, Ti, Tracker } from "./ui";

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

/* The instant AI estimate: four steps while the model works, then the
   number. The number is never final. */
function EstimateBlock({ phase }: { phase: number }) {
  return (
    <>
      <div className="tl tl--steps">
        {ESTIMATE_LINES.map((line, i) => {
          if (i < phase) return <div key={i} className="tl__item">{tlDone(ESTIMATE_DONE[i]).icon}<span>{ESTIMATE_DONE[i]}</span></div>;
          if (i === phase)
            return (
              <div key={i} className="tl__item">
                <Ti name="ti-loader-2" cls="spin i20 c-accent" />
                <span>{line}...</span>
              </div>
            );
          return (
            <div key={i} className="tl__item is-muted">
              <Ti name="ti-circle" cls="i20 c-gray" />
              <span>{line}</span>
            </div>
          );
        })}
      </div>
      {phase >= 4 && (
        <div className="result result--est">
          <div className="result__row">
            <span className="result__label">Estimated income tax</span>
            <span className="tag-ai">AI estimate</span>
          </div>
          <div className="result__value">
            <CountUp to={AMOUNTS.ESTIMATE} />
          </div>
          <p className="result__note">
            This is not final. Our team will check it and get back to you within a day.
          </p>
        </div>
      )}
    </>
  );
}

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

  if (!s.started) return <Navigate to="/dashboard" replace />;

  const crumbs = <Crumbs items={[{ text: "Dashboard", to: "/dashboard" }, { text: "2025-26 return" }]} />;

  // Steps 1 (Review) and 2 (Submit) render inline on this page; they bring
  // their own title, so show only the breadcrumb and tracker here.
  if (st === 1 || st === 2) {
    return (
      <div className="view">
        {crumbs}
        <Tracker stage={st} />
        {st === 1 ? <ReviewContent /> : <SubmitForm />}
      </div>
    );
  }

  const nextBtn = (label: string, to: string) => (
    <button className="btn btn--primary" type="button" onClick={() => navigate(to)}>
      {label}
      <Ti name="ti-arrow-right" cls="i18" />
    </button>
  );
  const n = "Step " + STEP_NUMBER[st] + " of 5";
  let card: Card;

  if (st === 0) {
    card = {
      icon: "ti-upload",
      eyebrow: n,
      title: "Upload your documents",
      text: "Add your bank statements and payslip. Click Next to get started.",
      button: nextBtn("Next", "/dashboard/return/documents"),
    };
  } else if (st === 3) {
    const ready = s.estPhase >= 4;
    card = {
      icon: "ti-sparkles",
      eyebrow: n,
      title: ready ? "Your estimate is ready" : "We're working out your estimate",
      text: ready ? "Our team will confirm it for you." : "This only takes a moment.",
      extra: (
        <>
          <EstimateBlock phase={s.estPhase} />
          {ready && (
            <>
              <div className="stage__sep" />
              <Timeline
                items={[
                  tlDone("Documents submitted"),
                  tlDone("AI estimate ready"),
                  tlBusy("Our team is confirming it"),
                  tlTodo("You review and approve"),
                ]}
              />
            </>
          )}
        </>
      ),
    };
  } else if (st === 4) {
    card = {
      icon: "ti-file-check",
      eyebrow: n,
      title: "Your return is ready for approval",
      text: "Our team has prepared it. Review it and let us know if we can file.",
      button: nextBtn("Review and approve", "/dashboard/return/approval"),
    };
  } else if (st === 5) {
    card = {
      icon: "ti-credit-card",
      eyebrow: n,
      title: "Pay the service fee",
      text: "Your return is approved. Pay the fee to file it.",
      button: nextBtn("Pay " + money(feeDue(s)), "/dashboard/return/payment"),
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
      {st === 4 && s.arrived && (
        <div className="banner" role="status">
          <Ti name="ti-bell-ringing" cls="i20 c-accent" />
          <span>
            <strong>Our team has sent your return.</strong> It's ready for your approval.
          </span>
        </div>
      )}
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
