/* A small chat scoped to one taxpayer's return. It answers only from the AI
   trace for this taxpayer, shows the calculation step by step, cites which
   document each number came from, and says when it can't find a source.

   This is a mocked responder built from the trace so the answer always matches
   the number on screen. In production, each send posts { taxpayerId, lineItems,
   document fields, conversation } to the AI and renders its reply here. */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { money } from "../shared";
import { Ti } from "../ui";
import { flaggedItems, tracedSum, type AiTrace, type LineItem } from "./adminData";

export type ChatHandle = { ask: (question: string) => void };

type ChatTable = { rows: { label: string; amount: string }[]; total?: { label: string; amount: string } };
type Msg = { from: "me" | "ai"; text: string; table?: ChatTable };

const firstName = (name: string) => name.split(/\s+/)[0] || name;

// Build the AI's reply from this taxpayer's trace. Always grounded in the
// figures on screen; never invents a source.
function buildAnswer(q: string, trace: AiTrace, name: string): Msg {
  const ql = q.toLowerCase();
  const who = firstName(name);
  const summed = trace.lineItems.filter((li) => !li.base && li.status !== "not_applied" && li.amount != null);
  const low: LineItem | undefined = flaggedItems(trace)[0];
  const salary = trace.lineItems.find((li) => li.base);

  // A low / not-applied item.
  if (low && (ql.includes("why") || ql.includes(firstName(low.label).toLowerCase()))) {
    return {
      from: "ai",
      text:
        low.label +
        ": " +
        (low.reason ?? "I can't point to a source for this part.") +
        " I left it out because I can't confirm it from " +
        who +
        "'s documents.",
    };
  }

  // Where a number came from (salary / source).
  if (salary && (ql.includes("salary") || ql.includes("income") || ql.includes("where"))) {
    return { from: "ai", text: "The salary of " + money(salary.amount as number) + " comes from " + salary.source.name + "." };
  }

  // How the total was reached.
  if (/how|get|got|breakdown|calculat|total|estimate|add/.test(ql)) {
    const rows = summed.map((li) => ({ label: li.label, amount: money(li.amount as number) }));
    const gap = trace.estimate - tracedSum(trace);
    if (gap !== 0) rows.push({ label: "Other, not itemised", amount: money(gap) });
    return {
      from: "ai",
      text: "I added up the tax lines from " + who + "'s documents to reach " + money(trace.estimate) + ".",
      table: { rows, total: { label: "Total (AI estimate)", amount: money(trace.estimate) } },
    };
  }

  // Scoped fallback — don't guess.
  return {
    from: "ai",
    text:
      "I can only answer from " +
      who +
      "'s documents and the figures above. I can't point to a source for that, so I'd rather not guess.",
  };
}

function Bubble({ msg }: { msg: Msg }) {
  return (
    <div className={"adm-bub adm-bub--" + (msg.from === "me" ? "me" : "ai")}>
      <span className="adm-bub__text">{msg.text}</span>
      {msg.table && (
        <table className="adm-bub__table">
          <tbody>
            {msg.table.rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.amount}</td>
              </tr>
            ))}
            {msg.table.total && (
              <tr className="adm-bub__total">
                <td>{msg.table.total.label}</td>
                <td>{msg.table.total.amount}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const TaxpayerChat = forwardRef<ChatHandle, { taxpayerName: string; trace: AiTrace }>(function TaxpayerChat(
  { taxpayerName, trace },
  ref,
) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const low = flaggedItems(trace)[0];
  const chips = [
    "How did you get " + money(trace.estimate) + "?",
    ...(low ? ["Why wasn't " + low.label.toLowerCase() + " applied?"] : []),
    "Where did the salary come from?",
  ].slice(0, 3);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }

  function send(text: string) {
    const q = text.trim();
    if (!q) {
      setErr("Type a question first.");
      return;
    }
    setErr("");
    setInput("");
    setMessages((m) => [...m, { from: "me", text: q }]);
    setThinking(true);
    scrollToBottom();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      setMessages((m) => {
        try {
          return [...m, buildAnswer(q, trace, taxpayerName)];
        } catch {
          return [...m, { from: "ai", text: "Couldn't get an answer. Try again." }];
        }
      });
      scrollToBottom();
    }, 900);
  }

  useImperativeHandle(ref, () => ({
    ask(question: string) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      send(question);
    },
  }));

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <section className="panel adm-chat" ref={cardRef} aria-label={"Ask AI about " + taxpayerName + "'s return"}>
      <h2 className="panel__title">Ask AI about {firstName(taxpayerName)}'s return</h2>

      <div className="adm-chat__list" ref={listRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="adm-chat__empty">Ask about any number and I'll show where it came from.</p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {thinking && (
          <div className="adm-bub adm-bub--ai adm-bub--think">
            <Ti name="ti-loader-2" cls="spin i16" /> Thinking…
          </div>
        )}
      </div>

      <div className="adm-chat__chips">
        {chips.map((c) => (
          <button key={c} className="qchip" type="button" onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>

      <form
        className="adm-chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="input"
          value={input}
          placeholder="Type a question"
          aria-label={"Ask a question about " + taxpayerName + "'s return"}
          onChange={(e) => {
            setInput(e.target.value);
            if (err) setErr("");
          }}
        />
        <button className="btn btn--primary btn--icon" type="submit" aria-label="Send question">
          <Ti name="ti-send" cls="i18" />
        </button>
      </form>
      {err && (
        <p className="field-error" role="alert">
          {err}
        </p>
      )}
    </section>
  );
});

export default TaxpayerChat;
