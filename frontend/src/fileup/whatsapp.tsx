/* WhatsApp as a core channel (UI). The chat link lives in one config value
   (CONFIG.WHATSAPP_URL) — never hard-coded in a component. On mobile "Open
   WhatsApp" deep-links to the chat; on desktop it opens the link and shows a
   QR so the user can continue on their phone. The real inbound/outbound
   integration is backend work (see the spec, Part 2) and is not here. */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { CONFIG } from "./shared";
import { Ti } from "./ui";

type WhatsApp = { open: () => void };
const Ctx = createContext<WhatsApp | null>(null);

function openChat() {
  try {
    window.open(CONFIG.WHATSAPP_URL, "_blank", "noopener,noreferrer");
  } catch {
    /* popups may be blocked; the dialog still offers the link */
  }
}

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [showQR, setShowQR] = useState(false);

  const open = () => {
    openChat();
    const isMobile =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 560px)").matches;
    if (!isMobile) setShowQR(true); // desktop: also show a QR to continue on phone
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {showQR && <WhatsAppDialog onClose={() => setShowQR(false)} />}
    </Ctx.Provider>
  );
}

export function useWhatsApp(): WhatsApp {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWhatsApp must be used within <WhatsAppProvider>");
  return c;
}

function WhatsAppDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(CONFIG.WHATSAPP_URL);

  return (
    <div className="wa-overlay" role="dialog" aria-modal="true" aria-label="Continue on WhatsApp" onClick={onClose}>
      <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wa-modal__title">Scan to continue on your phone</div>
        <p className="wa-modal__text">We opened WhatsApp in a new tab. Or scan this code to chat from your phone.</p>
        <img className="wa-modal__qr" src={qr} alt="QR code that links to our WhatsApp chat" width={180} height={180} />
        <p className="wa-modal__link">{CONFIG.WHATSAPP_URL}</p>
        <div className="wa-modal__actions">
          <button className="wa-btn" type="button" onClick={openChat}>
            <Ti name="ti-brand-whatsapp" cls="i18" />
            Open WhatsApp
          </button>
          <button className="btn btn--secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* The card shown on Home in every status (below the status card + panel). */
export function WhatsAppCard() {
  const { open } = useWhatsApp();
  return (
    <section className="wa-card">
      <span className="wa-card__icon">
        <Ti name="ti-brand-whatsapp" />
      </span>
      <div className="wa-card__body">
        <div className="wa-card__title">Chat with us on WhatsApp</div>
        <p className="wa-card__text">Ask a question or send your documents. Anything you send appears here.</p>
      </div>
      <button className="wa-btn" type="button" onClick={open}>
        <Ti name="ti-brand-whatsapp" cls="i18" />
        Open WhatsApp
      </button>
    </section>
  );
}

/* The hint row under each document page's upload area. */
export function WaHint({ text }: { text: string }) {
  const { open } = useWhatsApp();
  return (
    <div className="wa-hint">
      <Ti name="ti-brand-whatsapp" />
      <span>{text}</span>
      <button className="wa-btn wa-btn--sm" type="button" onClick={open}>
        <Ti name="ti-brand-whatsapp" cls="i16" />
        Open WhatsApp
      </button>
    </div>
  );
}

/* The small "WhatsApp" pill shown next to a file that arrived on WhatsApp. */
export function WaPill() {
  return (
    <span className="wa-pill">
      <Ti name="ti-brand-whatsapp" />
      WhatsApp
    </span>
  );
}
