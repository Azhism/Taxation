/* Review return — the reviewer's screen for one taxpayer. Their only job:
   resolve the flagged item, confirm the number, send for approval.

   The AI is the only source of the number, so there's no "AI vs rules"
   comparison — the page explains how the AI reached the figure (TraceTable),
   lets the reviewer ask the AI about it (TaxpayerChat), and flags the
   low-confidence items (FlagCard). The connected return (id "live") drives the
   taxpayer's live screens; seeded calc cases behave the same, mocked. */

import { ReactNode, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { money, teamNote } from "../shared";
import { useFileUp } from "../store";
import { Crumbs, Ti } from "../ui";
import FlagCard from "./FlagCard";
import TaxpayerChat, { type ChatHandle } from "./TaxpayerChat";
import TraceTable from "./TraceTable";
import { adminStatus, flaggedItems, liveTrace, toneClass, traceDocs, type AiTrace, type LineItem } from "./adminData";

export default function AdminCase() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { id = "live" } = useParams();

  // The connected return.
  if (id === "live") {
    const s = store.s;
    if (!s.started || s.stage < 3) return <Empty crumbTo="/admin/area/calc" title="Not submitted yet" text="The taxpayer is still preparing their documents. This case appears here once they submit." />;
    if (s.stage > 4) return <MovedOn label={adminStatus(s).label} hint={adminStatus(s).hint} />;
    return (
      <ReviewPage
        key="live"
        name="Demo User"
        cnic="42101-xxxxxxx-9"
        year="2025-26"
        trace={liveTrace(s)}
        initiallySent={s.stage >= 4}
        onSend={(final) => store.adminSendForApproval(final, teamNote(s))}
        onDone={() => navigate("/admin/area/calc")}
      />
    );
  }

  // A seeded case.
  const mock = store.adminCases.find((c) => c.id === id);
  if (!mock) {
    return <Empty crumbTo="/admin" title="This case is no longer here" text="It may already have moved on. Go back to the launcher to find it." />;
  }
  if (mock.area !== "calc" || !mock.trace) {
    return <MovedOn label="Already under way" hint="This return is further along. Open it from its own queue to act on it." />;
  }
  return (
    <ReviewPage
      key={mock.id}
      name={mock.name}
      cnic={mock.cnic}
      year={mock.year}
      trace={mock.trace}
      initiallySent={false}
      onSend={() => {}}
      onDone={() => {
        store.adminCaseSend(mock.id);
        navigate("/admin/area/calc");
      }}
    />
  );
}

/* ---------- The review page ---------- */

function questionFor(item: LineItem): string {
  if (item.status === "not_applied") return "Why wasn't " + item.label.toLowerCase() + " applied?";
  return "Why is " + item.label.toLowerCase() + " low confidence?";
}

function ReviewPage({
  name,
  cnic,
  year,
  trace,
  initiallySent,
  onSend,
  onDone,
}: {
  name: string;
  cnic: string;
  year: string;
  trace: AiTrace;
  initiallySent: boolean;
  onSend: (finalAmount: number) => void;
  onDone: () => void;
}) {
  const flagged = flaggedItems(trace);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finalStr, setFinalStr] = useState(String(trace.estimate));
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(initiallySent);
  const [sentAmount, setSentAmount] = useState(trace.estimate);
  const chatRef = useRef<ChatHandle>(null);

  const checkedCount = flagged.filter((f) => checked[f.label]).length;
  const allChecked = checkedCount >= flagged.length;
  const remaining = flagged.length - checkedCount;

  const pill =
    flagged.length === 0 || allChecked ? (
      <span className="status status--done">{flagged.length ? "Checked" : "Ready to send"}</span>
    ) : (
      <span className="status status--attention">
        {remaining} item{remaining > 1 ? "s" : ""} need{remaining > 1 ? "" : "s"} review
      </span>
    );

  function parseFinal(): number | null {
    const n = parseInt(finalStr.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function onSendClick() {
    if (flagged.length && !allChecked) {
      setErr("Check the flagged item first.");
      return;
    }
    const n = parseFinal();
    if (!n) {
      setErr("Enter the final tax amount.");
      return;
    }
    setErr("");
    onSend(n);
    setSentAmount(n);
    setSent(true);
  }

  const header = (
    <section className="stage adm-head">
      <div className="stage__head">
        <div>
          <p className="stage__eyebrow">
            CNIC {cnic} · Tax year {year}
          </p>
          <h1 className="stage__title">{name}</h1>
        </div>
        {pill}
      </div>
    </section>
  );

  return (
    <div className="view">
      <Crumbs items={[{ text: "All areas", to: "/admin" }, { text: "Tax Calculation", to: "/admin/area/calc" }, { text: name }]} />
      {header}

      {sent ? (
        <section className="panel">
          <div className="result">
            <div className="result__row">
              <span className="result__label">Sent for approval</span>
              <span className="tag-ok">
                <Ti name="ti-checks" cls="i16" /> Done
              </span>
            </div>
            <div className="result__value">{money(sentAmount)}</div>
            <p className="result__note">The taxpayer is notified here and on WhatsApp.</p>
          </div>
          <div className="adm-actions" style={{ marginTop: 14 }}>
            <button className="btn btn--primary" type="button" onClick={onDone}>
              Back to Tax Calculation
            </button>
          </div>
        </section>
      ) : (
        <>
          {flagged.map((item) => (
            <FlagCard
              key={item.label}
              item={item}
              checked={!!checked[item.label]}
              onAskWhy={() => chatRef.current?.ask(questionFor(item))}
              onCheck={() => setChecked((c) => ({ ...c, [item.label]: true }))}
            />
          ))}

          <section className="panel">
            <h2 className="panel__title">How the AI got {money(trace.estimate)}</h2>
            <TraceTable trace={trace} onOpenDoc={() => { /* opens the source file in production */ }} />
          </section>

          <TaxpayerChat ref={chatRef} taxpayerName={name} trace={trace} />

          <section className="panel">
            <h2 className="panel__title">Final return</h2>
            <label className="section-label" htmlFor="adm-final">
              Final income tax
            </label>
            <div className="adm-final-input">
              <span className="adm-final-input__prefix">PKR</span>
              <input
                id="adm-final"
                className="input"
                inputMode="numeric"
                value={finalStr}
                onChange={(e) => {
                  setFinalStr(e.target.value);
                  if (err) setErr("");
                }}
              />
            </div>
            <p className="hint">AI estimate was {money(trace.estimate)}.</p>
          </section>

          <div className="adm-send">
            <button className="btn btn--primary" type="button" onClick={onSendClick}>
              Send for approval
              <Ti name="ti-send" cls="i18" />
            </button>
            <span className="hint">The taxpayer is notified here and on WhatsApp.</span>
          </div>
          {err && (
            <p className="field-error" role="alert">
              {err}
            </p>
          )}

          <DocumentsSection trace={trace} />
        </>
      )}
    </div>
  );
}

function DocumentsSection({ trace }: { trace: AiTrace }) {
  const docs = traceDocs(trace);
  return (
    <details className="panel adm-docs-collapse">
      <summary className="adm-docs-summary">
        <span className="adm-docs-summary__label">
          Documents · {docs.length} uploaded
        </span>
        <Ti name="ti-chevron-down" cls="i18 c-subtle adm-docs-chev" />
      </summary>
      <div className="doclist adm-docs-collapse__list">
        {docs.map((d) => (
          <div className="doc" key={d.name}>
            <span className="doc__icon">
              <Ti name={d.icon} cls="i20" />
            </span>
            <div className="doc__body">
              <div className="doc__name">{d.name}</div>
            </div>
            <button className="btn btn--secondary btn--sm" type="button" aria-label={"View " + d.name}>
              <Ti name="ti-eye" cls="i16" /> View file
            </button>
          </div>
        ))}
      </div>
    </details>
  );
}

/* ---------- Small states ---------- */

function Empty({ crumbTo, title, text }: { crumbTo: string; title: string; text: string }) {
  return (
    <div className="view">
      <Crumbs items={[{ text: "All areas", to: "/admin" }, { text: title }]} />
      <section className="panel">
        <div className="adm-empty">
          <Ti name="ti-clock" cls="i24 c-subtle" />
          <div>
            <div className="adm-empty__title">{title}</div>
            <div className="adm-empty__text">{text}</div>
          </div>
        </div>
      </section>
      <CrumbBack to={crumbTo} />
    </div>
  );
}

function MovedOn({ label, hint }: { label: string; hint: string }): ReactNode {
  return (
    <div className="view">
      <Crumbs items={[{ text: "All areas", to: "/admin" }, { text: "Review return" }]} />
      <section className="stage adm-head">
        <div className="stage__head">
          <h1 className="stage__title">Demo User</h1>
          <span className={toneClass.wait}>{label}</span>
        </div>
        <p className="stage__text stage__text--tight">{hint}</p>
      </section>
    </div>
  );
}

function CrumbBack({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <div className="adm-actions" style={{ marginTop: 14 }}>
      <button className="btn btn--secondary" type="button" onClick={() => navigate(to)}>
        Back
      </button>
    </div>
  );
}
