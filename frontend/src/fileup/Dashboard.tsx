/* Dashboard: greeting, 5-step tracker, and one "current step" card
   for each of the seven statuses (the resume view). */

import { ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { CONFIG } from "./shared";
import { useFileUp } from "./store";
import ReviewContent from "./ReviewContent";
import SubmitForm from "./SubmitForm";
import { Ti, Tracker } from "./ui";

function firstName(): string {
  try {
    const n = (localStorage.getItem("USER_NAME") || "").trim().split(/\s+/)[0];
    if (n) return n;
  } catch {
    /* ignore */
  }
  return "Demo";
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { s } = useFileUp();
  const waitbar = useRef<HTMLDivElement>(null);

  // Animate the (prototype) "team is working" meter from elapsed -> 100%.
  useEffect(() => {
    if (s.stage !== 3) return;
    const fill = waitbar.current;
    if (!fill) return;
    const elapsed = Date.now() - s.submittedAt;
    const remain = Math.max(0, CONFIG.SIMULATE_TEAM_WAIT_MS - elapsed);
    fill.style.transition = "none";
    fill.style.width = Math.min(100, (elapsed / CONFIG.SIMULATE_TEAM_WAIT_MS) * 100) + "%";
    void fill.offsetWidth; // force reflow so the next transition runs
    fill.style.transition = "width " + remain + "ms linear";
    fill.style.width = "100%";
  }, [s.stage, s.submittedAt]);

  const nextBtn = (label: string, to: string) => (
    <button className="btn btn--primary" type="button" onClick={() => navigate(to)}>
      {label}
      <Ti name="ti-arrow-right" cls="i18" />
    </button>
  );

  let card: Card;
  const st = s.stage;

  // Steps 2 (Review) and 3 (Submit) are single screens: show their form here
  // directly, rather than an intro card with a Next button that opens a
  // separate page.
  if (st === 1 || st === 2) {
    return (
      <div className="view">
        <h1 className="greet">Welcome back, {firstName()}</h1>
        <p className="page-sub">Tax year 2025-26</p>
        <Tracker stage={st} />
        {st === 1 ? <ReviewContent /> : <SubmitForm />}
      </div>
    );
  }

  if (st === 0)
    card = {
      icon: "ti-upload",
      eyebrow: "Step 1 of 5",
      title: "Upload your documents",
      text: "Add your bank statements and payslip. Click Next to get started.",
      button: nextBtn("Next", "/dashboard/documents"),
    };
  else if (st === 3)
    card = {
      icon: "ti-circle-check",
      solid: true,
      eyebrow: "Step 3 of 5",
      title: "Your documents have been submitted",
      text: "We've forwarded them to our team. We will get back to you in a while.",
      extra: (
        <>
          <div className="wait">
            <div className="wait__label">
              <Ti name="ti-loader-2" cls="spin i16 c-accent" />
              Our team is preparing your return
            </div>
            <div className="meter">
              <div className="meter__fill" ref={waitbar} id="waitbar" />
            </div>
          </div>
          <Timeline
            items={[
              { icon: <Ti name="ti-circle-check" cls="i20 c-accent" />, text: "Documents submitted" },
              { icon: <Ti name="ti-loader-2" cls="spin i20 c-accent" />, text: "With our team" },
              { icon: <Ti name="ti-circle" cls="i20 c-gray" />, text: "Ready for your approval", muted: true },
            ]}
          />
        </>
      ),
    };
  else if (st === 4)
    card = {
      icon: "ti-file-check",
      eyebrow: "Step 4 of 5",
      title: "Your return is ready for approval",
      text: "Our team has prepared it. Review it and let us know if we can file.",
      button: nextBtn("Review and approve", "/dashboard/approval"),
    };
  else if (st === 5)
    card = {
      icon: "ti-building-community",
      eyebrow: "Step 5 of 5",
      title: "Your return is being filed",
      text: "Your documents are in the process of being filed. We will let you know once they are filed.",
      extra: (
        <Timeline
          items={[
            { icon: <Ti name="ti-circle-check" cls="i20 c-accent" />, text: "You approved the return" },
            { icon: <Ti name="ti-loader-2" cls="spin i20 c-accent" />, text: "Filing in progress" },
            { icon: <Ti name="ti-circle" cls="i20 c-gray" />, text: "Filed", muted: true },
          ]}
        />
      ),
    };
  else
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
      <h1 className="greet">Welcome back, {firstName()}</h1>
      <p className="page-sub">Tax year 2025-26</p>
      <Tracker stage={st} />
      <StageCard c={card} />
    </div>
  );
}
