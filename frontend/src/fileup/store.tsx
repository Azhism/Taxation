/* ==========================================================
   FileUp app store — React port of the app.js mock state and
   actions. State is held in context and mirrored to localStorage
   so a reload resumes the user on their current step. Everything
   here is mocked; swap the bodies for real API calls later.
   ========================================================== */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { BANKS, CONFIG, FileUpState, initialState, bankReady, payReady } from "./shared";

const STORAGE_KEY = "FILEUP_STATE";

function load(): FileUpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt/blocked storage */
  }
  return initialState;
}

type Store = {
  s: FileUpState;
  addBank: () => void;
  setBankConfirmed: (v: boolean) => void;
  payUpload: () => void;
  whAdd: () => void;
  whRemove: (i: number) => void;
  whNone: () => void;
  assetSend: (text: string) => void;
  assetNone: () => void;
  docsContinue: () => boolean; // returns whether the gate allowed it
  reviewContinue: () => void;
  setStage: (n: number) => void;
  submit: () => void;
  approve: (version: number) => void;
  askOpen: () => void;
  askCancel: () => void;
  askSend: () => void;
  jump: (i: number) => void;
  clearArrived: () => void;
  resetAll: () => void;
};

const Ctx = createContext<Store | null>(null);

export function FileUpProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<FileUpState>(load);
  const waitTimer = useRef<number | undefined>(undefined);
  const nextId = useRef(1);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const promoteToApproval = () =>
    setS((prev) => (prev.stage === 3 ? { ...prev, stage: 4, arrived: true } : prev));

  const scheduleWait = (ms: number) => {
    window.clearTimeout(waitTimer.current);
    waitTimer.current = window.setTimeout(promoteToApproval, Math.max(0, ms));
  };

  // Resume the simulated team wait after a reload.
  useEffect(() => {
    if (s.stage === 3) {
      const remain = CONFIG.SIMULATE_TEAM_WAIT_MS - (Date.now() - (s.submittedAt || Date.now()));
      if (remain <= 0) promoteToApproval();
      else scheduleWait(remain);
    }
    return () => window.clearTimeout(waitTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ensureSampleDocs(state: FileUpState): FileUpState {
    let ns = state;
    if (!ns.bank.files.length) {
      ns = {
        ...ns,
        bank: {
          confirmed: true,
          files: [
            { id: nextId.current++, bank: "HBL", name: "hbl-statement.pdf", done: true },
            { id: nextId.current++, bank: "Meezan Bank", name: "meezan-statement.pdf", done: true },
          ],
        },
      };
    }
    if (!ns.pay.status) ns = { ...ns, pay: { status: "done" } };
    return ns;
  }

  const store: Store = {
    s,

    addBank: () => {
      const id = nextId.current++;
      setS((prev) => {
        const b = BANKS[prev.bankIdx % BANKS.length];
        const name = b.toLowerCase().replace(/\s/g, "-") + "-statement.pdf";
        return {
          ...prev,
          bankIdx: prev.bankIdx + 1,
          bank: { confirmed: false, files: [...prev.bank.files, { id, bank: b, name, done: false }] },
        };
      });
      // mocked extraction delay
      window.setTimeout(() => {
        setS((prev) => ({
          ...prev,
          bank: { ...prev.bank, files: prev.bank.files.map((f) => (f.id === id ? { ...f, done: true } : f)) },
        }));
      }, 2200);
    },

    setBankConfirmed: (v) => setS((prev) => ({ ...prev, bank: { ...prev.bank, confirmed: v } })),

    payUpload: () => {
      setS((prev) => ({ ...prev, pay: { status: "scanning" } }));
      window.setTimeout(() => setS((prev) => ({ ...prev, pay: { status: "done" } })), 2200);
    },

    whAdd: () =>
      setS((prev) => ({ ...prev, wh: { none: false, files: [...prev.wh.files, "Tax proof " + (prev.wh.files.length + 1)] } })),

    whRemove: (i) =>
      setS((prev) => ({ ...prev, wh: { ...prev.wh, files: prev.wh.files.filter((_, idx) => idx !== i) } })),

    whNone: () => setS((prev) => ({ ...prev, wh: { ...prev.wh, none: true } })),

    assetSend: (text) => {
      setS((prev) => ({
        ...prev,
        asset: { ...prev.asset, none: false, sent: true, chat: [...prev.asset.chat, { from: "me", text }] },
      }));
      // In production, send `text` to the assistant and render its follow-up here.
      window.setTimeout(() => {
        setS((prev) => ({
          ...prev,
          asset: {
            ...prev.asset,
            chat: [...prev.asset.chat, { from: "them", text: "Thanks, noted. What was the amount and the date?" }],
          },
        }));
      }, 700);
    },

    assetNone: () =>
      setS((prev) => ({
        ...prev,
        asset: {
          ...prev.asset,
          none: true,
          sent: false,
          chat: [
            ...prev.asset.chat,
            { from: "me", text: "Nothing to report" },
            { from: "them", text: "Got it, nothing to report." },
          ],
        },
      })),

    docsContinue: () => {
      // requiredCount uses current state; read from a snapshot
      const ok = (bankReady(s) && payReady(s)) || CONFIG.DEMO_UNLOCK_CONTINUE;
      if (!ok) return false;
      setS((prev) => ({ ...prev, stage: Math.max(prev.stage, 1) }));
      return true;
    },

    reviewContinue: () => setS((prev) => ({ ...prev, stage: Math.max(prev.stage, 2) })),

    setStage: (n) => setS((prev) => ({ ...prev, stage: Math.max(0, Math.min(6, n)) })),

    submit: () => {
      const at = Date.now();
      setS((prev) => ({ ...prev, stage: 3, submittedAt: at, submitConsentAt: at, arrived: false }));
      scheduleWait(CONFIG.SIMULATE_TEAM_WAIT_MS);
    },

    approve: (version) =>
      setS((prev) => ({ ...prev, stage: 5, approvedVersion: version, approvedAt: Date.now(), asking: false, askSent: false })),

    askOpen: () => setS((prev) => ({ ...prev, asking: true })),
    askCancel: () => setS((prev) => ({ ...prev, asking: false })),
    askSend: () => setS((prev) => ({ ...prev, asking: false, askSent: true })),

    jump: (i) => {
      window.clearTimeout(waitTimer.current);
      setS((prev) => {
        let ns: FileUpState = { ...prev, stage: i, arrived: false, asking: false, askSent: false };
        if (i >= 1) ns = ensureSampleDocs(ns);
        if (i === 3) ns = { ...ns, submittedAt: Date.now() };
        return ns;
      });
      if (i === 3) scheduleWait(CONFIG.SIMULATE_TEAM_WAIT_MS);
    },

    clearArrived: () => setS((prev) => (prev.arrived ? { ...prev, arrived: false } : prev)),

    resetAll: () => {
      window.clearTimeout(waitTimer.current);
      nextId.current = 1;
      setS(initialState);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useFileUp(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFileUp must be used within <FileUpProvider>");
  return ctx;
}
