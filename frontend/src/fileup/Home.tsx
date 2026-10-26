/* Home: the first screen after login. Shows the state of the user's
   2025-26 return and one button that starts or resumes the filing
   workflow. The workflow itself lives under /dashboard/return. */

import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { AMOUNTS, STEP_TITLES, TRACKER, TRACKER_INDEX, feeDue, money } from "./shared";
import { useFileUp } from "./store";
import HomePanel from "./HomePanel";
import { WhatsAppCard } from "./whatsapp";
import { Ti } from "./ui";

function firstName(): string {
  try {
    const n = (localStorage.getItem("USER_NAME") || "").trim().split(/\s+/)[0];
    if (n) return n;
  } catch {
    /* ignore */
  }
  return "Demo";
}

export default function Home() {
  const navigate = useNavigate();
  const { s, start } = useFileUp();
  const st = s.stage;

  let pill: string;
  let pillClass = "status";
  let text: string;
  let button: ReactNode;
  let extra: ReactNode = null;
  let fine: string | null = null;

  const primary = (label: string, to: string, onClick?: () => void) => (
    <button
      className="btn btn--primary"
      type="button"
      onClick={() => {
        onClick?.();
        navigate(to);
      }}
    >
      {label}
      <Ti name="ti-arrow-right" cls="i18" />
    </button>
  );
  const secondary = (label: string, to: string) => (
    <button className="btn btn--secondary" type="button" onClick={() => navigate(to)}>
      {label}
    </button>
  );
  const downloadBtn = (
    <button className="btn btn--primary" type="button">
      <Ti name="ti-download" cls="i18" />
      Download receipt
    </button>
  );

  if (!s.started) {
    pill = "Not started";
    text = "Upload your documents, we prepare your return, and you approve it before we file.";
    button = primary("Start filing", "/dashboard/return", start);
  } else if (st <= 2) {
    pill = "In progress";
    pillClass += " status--active";
    text = "Step " + (st + 1) + " of 5: " + STEP_TITLES[st];
    button = primary("Continue", "/dashboard/return");
  } else if (st === 3) {
    const ready = s.estPhase >= 4;
    pill = ready ? "With our team" : "Working on it";
    pillClass += " status--active";
    text = ready
      ? "Your documents are with our team. We will get back to you in a while."
      : "We're working out your estimate.";
    if (ready) {
      extra = (
        <div className="estline">
          <Ti name="ti-sparkles" cls="i18 c-accent" />
          <span className="estline__label">Your AI estimate</span>
          <span className="estline__value">{money(AMOUNTS.ESTIMATE)}</span>
          <span className="tag-muted">Not final</span>
        </div>
      );
    }
    button = secondary("View status", "/dashboard/return");
  } else if (st === 4) {
    pill = "Needs your approval";
    pillClass += " status--attention";
    text = "Our team has prepared your return. Review it and let us know if we can file.";
    button = primary("Review and approve", "/dashboard/return/approval");
  } else if (st === 5) {
    pill = s.payment.rejected ? "Payment not verified" : "Payment needed";
    pillClass += " status--attention";
    text = s.payment.rejected
      ? "We couldn't verify your payment. Upload a clearer screenshot."
      : "Your return is approved. Pay the service fee to file it.";
    button = primary("Pay " + money(feeDue(s)), "/dashboard/return/payment");
  } else if (st === 6) {
    pill = "Being filed";
    pillClass += " status--active";
    text = "We've received your payment and we're filing your return. We'll let you know once it's filed.";
    button = secondary("View status", "/dashboard/return");
  } else {
    pill = "Filed";
    pillClass += " status--done";
    text = "We've filed your return. Your receipt is ready.";
    button = downloadBtn;
  }

  const cur = TRACKER_INDEX[st];

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
      {s.waBanner && (
        <div className="banner banner--wa" role="status">
          <Ti name="ti-brand-whatsapp" cls="i20" />
          <span>
            <strong>{s.waBanner} received on WhatsApp.</strong> It's been added to your documents.
          </span>
        </div>
      )}

      <h1 className="greet">Welcome back, {firstName()}</h1>
      <p className="page-sub">Here's where your tax return stands.</p>

      <section className="stage">
        <div className="stage__head">
          <div>
            <p className="stage__eyebrow">Tax year 2025-26</p>
            <h2 className="stage__title">Your tax return</h2>
          </div>
          <span className={pillClass}>{pill}</span>
        </div>
        <p className="stage__text">{text}</p>
        {s.started && (
          <div className="segbar" aria-hidden="true">
            {TRACKER.map((_, i) => {
              const on = i < cur || st === 7;
              const now = i === cur && st < 7;
              return <span key={i} className={"segbar__seg" + (on ? " is-on" : "") + (now ? " is-now" : "")} />;
            })}
          </div>
        )}
        {extra}
        <div className="stage__actions">{button}</div>
        {fine && <p className="fine">{fine}</p>}
      </section>

      <HomePanel />

      <WhatsAppCard />
    </div>
  );
}
