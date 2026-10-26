/* One page per document (bank statements, payslip, withholding proofs,
   assets chat). Which one is chosen by the route. */

import { ReactNode, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { DocId, docById } from "./shared";
import { useFileUp } from "./store";
import { Crumbs, PageTitle, Ti } from "./ui";

function FileRow({
  icon,
  name,
  sub,
  done,
  extra,
}: {
  icon: string;
  name: string;
  sub: string;
  done: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="frow">
      <Ti name={icon} cls="i20 c-accent" />
      <div className="frow__body">
        <div className="frow__name">{name}</div>
        <div className="frow__sub">{sub}</div>
      </div>
      {done ? (
        <span className="frow__status frow__status--done">
          <Ti name="ti-circle-check" cls="i16" />
          Extracted
        </span>
      ) : (
        <span className="frow__status">
          <Ti name="ti-loader-2" cls="spin i16 c-accent" />
          Scanning...
        </span>
      )}
      {extra}
    </div>
  );
}

function DropZone({
  onActivate,
  label,
  small,
}: {
  onActivate: () => void;
  label: ReactNode;
  small?: boolean;
}) {
  const common = {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
  if (small) {
    return (
      <div className="dz dz--sm" {...common}>
        <Ti name="ti-plus" cls="i16 c-accent" /> {label}
      </div>
    );
  }
  return (
    <div className="dz" {...common}>
      <Ti name="ti-cloud-upload" cls="dz__icon" />
      <div>{label}</div>
      <div className="dz__hint">PDF, PNG, or JPG</div>
    </div>
  );
}

function DoneButton() {
  const navigate = useNavigate();
  return (
    <div className="page-actions page-actions--end">
      <button className="btn btn--primary btn--sm" type="button" onClick={() => navigate("/dashboard/documents")}>
        Done
      </button>
    </div>
  );
}

export default function DocumentPage({ docId }: { docId: DocId }) {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;
  const d = docById(docId);

  const chatRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  const [msgPlaceholder, setMsgPlaceholder] = useState(
    "For example: I sold a car in March for PKR 2.5 million",
  );

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [s.asset.chat.length]);

  if (s.stage > 2) return <Navigate to="/dashboard" replace />;

  const head = (
    <>
      <Crumbs
        items={[
          { text: "Dashboard", to: "/dashboard" },
          { text: "Documents", to: "/dashboard/documents" },
          { text: d.title },
        ]}
      />
    </>
  );

  function sendMessage() {
    const v = msg.trim();
    if (!v) {
      setMsgPlaceholder("Type a message first");
      return;
    }
    store.assetSend(v);
    setMsg("");
  }

  return (
    <div className="view">
      {head}

      {docId === "bank" && (
        <>
          <PageTitle title={d.title} sub="Add one for each of your banks." />
          {!s.bank.files.length ? (
            <DropZone
              onActivate={store.addBank}
              label={
                <>
                  Drop a statement or <strong>browse</strong>
                </>
              }
            />
          ) : (
            <>
              <div className="stack">
                {s.bank.files.map((f) => (
                  <FileRow key={f.id} icon="ti-file-type-pdf" name={f.bank} sub={f.name} done={f.done} />
                ))}
              </div>
              <DropZone onActivate={store.addBank} label="Add another bank" small />
              <label className="consent" style={{ marginTop: 14 }}>
                <input
                  type="checkbox"
                  checked={s.bank.confirmed}
                  onChange={(e) => store.setBankConfirmed(e.target.checked)}
                />
                These are all my bank accounts
              </label>
            </>
          )}
          <DoneButton />
        </>
      )}

      {docId === "pay" && (
        <>
          <PageTitle title={d.title} sub="Your most recent one." />
          {!s.pay.status ? (
            <DropZone
              onActivate={store.payUpload}
              label={
                <>
                  Drop a file or <strong>browse</strong>
                </>
              }
            />
          ) : (
            <>
              <FileRow icon="ti-file-type-pdf" name="Payslip" sub="payslip.pdf" done={s.pay.status === "done"} />
              <div style={{ marginTop: 8 }}>
                <button className="btn btn--secondary btn--sm" type="button" onClick={store.payUpload}>
                  Replace
                </button>
              </div>
            </>
          )}
          <DoneButton />
        </>
      )}

      {docId === "wh" && (
        <>
          <PageTitle title={d.title} sub="For example, mobile phone tax. Add as many as you need." />
          {s.wh.files.length ? (
            <>
              <div className="stack">
                {s.wh.files.map((f, i) => (
                  <FileRow
                    key={i}
                    icon="ti-file-type-pdf"
                    name={f}
                    sub="Added"
                    done
                    extra={
                      <button
                        className="frow__x"
                        type="button"
                        aria-label="Remove"
                        onClick={() => store.whRemove(i)}
                      >
                        <Ti name="ti-x" cls="i16" />
                      </button>
                    }
                  />
                ))}
              </div>
              <DropZone onActivate={store.whAdd} label="Add another" small />
            </>
          ) : (
            <DropZone
              onActivate={store.whAdd}
              label={
                <>
                  Drop files or <strong>browse</strong>
                </>
              }
            />
          )}
          <div className="page-actions">
            {s.wh.files.length ? (
              <span />
            ) : (
              <button
                className="btn btn--secondary btn--sm"
                type="button"
                onClick={() => {
                  store.whNone();
                  navigate("/dashboard/documents");
                }}
              >
                Nothing to add
              </button>
            )}
            <button
              className="btn btn--primary btn--sm"
              type="button"
              onClick={() => navigate("/dashboard/documents")}
            >
              Done
            </button>
          </div>
        </>
      )}

      {docId === "asset" && (
        <>
          <PageTitle title={d.title} sub="Optional. Chat with us in your own words." />
          <div className="chat" ref={chatRef}>
            {s.asset.chat.map((m, i) => (
              <div key={i} className={"bub bub--" + m.from}>
                {m.text}
              </div>
            ))}
          </div>
          {!s.asset.sent && !s.asset.none && (
            <div className="qchips">
              <button className="qchip" type="button" onClick={() => store.assetSend("I bought a vehicle")}>
                Bought a vehicle
              </button>
              <button className="qchip" type="button" onClick={() => store.assetSend("I sold a property")}>
                Sold property
              </button>
              <button className="qchip" type="button" onClick={store.assetNone}>
                Nothing to report
              </button>
            </div>
          )}
          <div className="composer">
            <textarea
              className="textarea"
              rows={1}
              aria-label="Message"
              placeholder={msgPlaceholder}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className="send" type="button" aria-label="Send" onClick={sendMessage}>
              <Ti name="ti-arrow-up" cls="i18" />
            </button>
          </div>
          <DoneButton />
        </>
      )}
    </div>
  );
}
