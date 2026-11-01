/* The assets page: a short chat where the user tells us, in their own
   words, about assets bought or sold. The other documents are uploaded in
   dropdowns on the Upload step (see DocumentsList + DocUploader). */

import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { docById } from "./shared";
import { useFileUp } from "./store";
import { WaHint } from "./whatsapp";
import { Crumbs, PageTitle, Ti } from "./ui";

export default function DocumentPage() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s } = store;
  const d = docById("asset");

  const chatRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  const [msgPlaceholder, setMsgPlaceholder] = useState(
    "For example: I sold a car in March for PKR 2.5 million",
  );

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [s.asset.chat.length]);

  if (!s.started || s.stage > 2) return <Navigate to="/dashboard" replace />;

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
      <Crumbs
        items={[
          { text: "Dashboard", to: "/dashboard" },
          { text: "2025-26 return", to: "/dashboard/return" },
          { text: d.title },
        ]}
      />

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
      <WaHint text="Prefer to talk? Tell us on WhatsApp instead." />
      <div className="page-actions page-actions--end">
        <button className="btn btn--primary btn--sm" type="button" onClick={() => navigate("/dashboard/return")}>
          Done
        </button>
      </div>
    </div>
  );
}
