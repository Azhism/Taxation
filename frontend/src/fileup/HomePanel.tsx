/* The status-driven panel under the Home status card. Its title and rows
   change with the return's status, but it always looks and animates like
   the "What you'll need" panel. No tax amount is shown here except the
   "What you owe" breakdown once the return is approved. */

import { ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { AMOUNTS, DOCS, docStatus, finalAmount, money, teamNote, type DocId } from "./shared";
import { useFileUp } from "./store";
import { Ti } from "./ui";

type ChipKind = "default" | "done" | "todo" | "spin";

function Chip({ icon, kind = "default" }: { icon?: string; kind?: ChipKind }) {
  const cls = "doc__icon" + (kind === "done" ? " doc__icon--done" : kind === "todo" ? " doc__icon--todo" : "");
  return <span className={cls}>{kind === "spin" ? <Ti name="ti-loader-2" cls="spin i20" /> : <Ti name={icon!} cls="i20" />}</span>;
}

/* One panel row: a lead (icon chip or avatar), name, one meta line, and an
   optional right-hand node (status text, amount, or a PDF button). */
function Row({
  lead,
  name,
  meta,
  right,
  onClick,
}: {
  lead: ReactNode;
  name: string;
  meta: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const link = !!onClick;
  return (
    <div
      className={"need__item" + (link ? " need__item--link" : "")}
      {...(link
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (e: ReactKeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!();
              }
            },
          }
        : {})}
    >
      {lead}
      <div className="doc__body">
        <div className="doc__name need__name">{name}</div>
        <div className="doc__meta">{meta}</div>
      </div>
      {right && <div className="need__right">{right}</div>}
      {link && <Ti name="ti-chevron-right" cls="i18 c-subtle" />}
    </div>
  );
}

const PdfBtn = () => (
  <button className="btn btn--secondary btn--sm" type="button">
    <Ti name="ti-download" cls="i16" /> PDF
  </button>
);

export default function HomePanel() {
  const navigate = useNavigate();
  const { s } = useFileUp();
  const st = s.stage;

  let title: string;
  let rows: ReactNode;

  if (!s.started) {
    title = "What you'll need";
    rows = (
      <>
        <Row lead={<Chip icon="ti-building-bank" />} name="Bank statements" meta="One for each of your banks" />
        <Row lead={<Chip icon="ti-file-text" />} name="Payslips / salary slips" meta="Last 12 months, required" />
        <Row lead={<Chip icon="ti-receipt-tax" />} name="Withholding tax proofs" meta="If you have any" />
        <Row lead={<Chip icon="ti-message-circle" />} name="Assets you bought or sold" meta="If you have any" />
      </>
    );
  } else if (st <= 2) {
    // "Your documents" — live status; rows link to the document page only in upload.
    title = "Your documents";

    const rightFor = (id: DocId, required: boolean): ReactNode => {
      const status = docStatus(s, id);
      if (status.kind === "done")
        return (
          <span className="c-ok">
            <Ti name="ti-circle-check" cls="i18 c-ok" /> {status.text}
          </span>
        );
      if (status.kind === "busy")
        return (
          <span>
            <Ti name="ti-loader-2" cls="spin i18 c-accent" /> {status.text}
          </span>
        );
      if (status.kind === "partial") return <span className="c-warn">{status.text}</span>;
      return required ? <span className="c-accent need__todo">To do</span> : <span>Optional</span>;
    };

    rows = DOCS.map((d) => (
      <Row
        key={d.id}
        lead={<Chip icon={d.icon} />}
        name={d.title}
        meta={d.required ? "Required" : "Optional"}
        right={rightFor(d.id, d.required)}
        onClick={st === 0 ? () => navigate("/dashboard/return/documents/" + d.slug) : undefined}
      />
    ));
  } else if (st === 3) {
    const ready = s.estPhase >= 4;
    title = "What happens next";
    rows = (
      <>
        <Row lead={<Chip icon="ti-check" kind="done" />} name="Documents submitted" meta="Sent to our team" />
        {ready ? (
          <Row lead={<Chip icon="ti-sparkles" kind="done" />} name="AI estimate ready" meta="Our team is checking it" />
        ) : (
          <Row lead={<Chip kind="spin" />} name="Working out your AI estimate" meta="This only takes a moment" />
        )}
        {ready ? (
          <Row lead={<Chip kind="spin" />} name="Our team is confirming it" meta="We'll notify you here and on WhatsApp" />
        ) : (
          <Row lead={<Chip icon="ti-user-check" kind="todo" />} name="Our team confirms it" meta="We'll notify you here and on WhatsApp" />
        )}
        <Row lead={<Chip icon="ti-user-check" kind="todo" />} name="You review and approve" meta="Nothing is filed without your approval" />
      </>
    );
  } else if (st === 4) {
    title = "Ready for your review";
    rows = (
      <>
        <Row lead={<span className="note__av">FU</span>} name="Note from our team" meta={teamNote(s)} />
        <Row lead={<Chip icon="ti-file-text" />} name="Tax return" meta="Draft to be filed" right={<PdfBtn />} />
        <Row lead={<Chip icon="ti-calculator" />} name="Our working" meta="How we calculated it" right={<PdfBtn />} />
        <Row lead={<Chip icon="ti-certificate" />} name="Income certificate" meta="Summary of your income" right={<PdfBtn />} />
      </>
    );
  } else if (st === 5) {
    title = "What you owe";
    rows = (
      <>
        <Row lead={<Chip icon="ti-receipt-tax" />} name="Income tax" meta="Paid to FBR. Confirmed by our team" right={money(finalAmount(s))} />
        <Row lead={<Chip icon="ti-credit-card" />} name="FileUp service fee" meta="Paid to us to file your return" right={money(AMOUNTS.FEE)} />
        {s.payment.coupon && (
          <Row lead={<Chip icon="ti-discount-2" kind="done" />} name={"Coupon " + s.payment.coupon} meta="Applied" right={"- " + money(s.payment.discount)} />
        )}
      </>
    );
  } else if (st === 6) {
    const filing = s.filePhase >= 1;
    title = "What happens next";
    rows = filing ? (
      <>
        <Row lead={<Chip icon="ti-check" kind="done" />} name="You approved the return" meta="Thank you" />
        <Row lead={<Chip icon="ti-check" kind="done" />} name="Payment verified" meta="Thank you" />
        <Row lead={<Chip kind="spin" />} name="We're filing your return" meta="We will let you know on WhatsApp and here" />
        <Row lead={<Chip icon="ti-flag-check" kind="todo" />} name="Filed" meta="Your receipt will appear here" />
      </>
    ) : (
      <>
        <Row lead={<Chip icon="ti-check" kind="done" />} name="You approved the return" meta="Thank you" />
        <Row lead={<Chip kind="spin" />} name="Verifying your payment" meta="We will let you know on WhatsApp and here" />
        <Row lead={<Chip icon="ti-building-community" kind="todo" />} name="We file your return" meta="Then your receipt appears here" />
        <Row lead={<Chip icon="ti-flag-check" kind="todo" />} name="Filed" meta="Your receipt will appear here" />
      </>
    );
  } else {
    title = "Your records";
    rows = (
      <>
        <Row lead={<Chip icon="ti-receipt-2" />} name="Filing receipt" meta="Proof that your return was filed" right={<PdfBtn />} />
        <Row lead={<Chip icon="ti-file-text" />} name="Tax return" meta="As filed" right={<PdfBtn />} />
        <Row lead={<Chip icon="ti-calculator" />} name="Our working" meta="How we calculated it" right={<PdfBtn />} />
        <Row lead={<Chip icon="ti-certificate" />} name="Income certificate" meta="Summary of your income" right={<PdfBtn />} />
      </>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>
      <div className="need">{rows}</div>
    </section>
  );
}
