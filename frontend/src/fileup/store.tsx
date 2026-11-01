/* ==========================================================
   FileUp app store — React port of the app.js mock state and
   actions. State is held in context and mirrored to localStorage
   so a reload resumes the user on their current step. Everything
   here is mocked; swap the bodies for real API calls later.

   In production the prototype timers become real events:
     estimate       -> progress stream from the local model
     team wait       -> admin presses "Send for approval"
     payment verify  -> admin confirms the payment
   ========================================================== */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import {
  AMOUNTS,
  COUPONS,
  CONFIG,
  FileUpState,
  UpFile,
  UploadSlot,
  emptyPayment,
  initialState,
} from "./shared";
import { seedAdminCases, type AdminCaseData } from "./admin/adminData";
import { authToken, fetchExtraction, retryExtraction, uploadDocument, type Extraction } from "./api";

const STORAGE_KEY = "FILEUP_STATE";

function load(): FileUpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = { ...initialState, ...JSON.parse(raw) } as FileUpState;
      // Older saves kept withholding proofs as plain names.
      const wh = saved.wh.files as unknown[];
      if (wh.some((f) => typeof f === "string")) {
        saved.wh = {
          ...saved.wh,
          files: wh.map((f, i) => (typeof f === "string" ? { id: i + 1, name: f, done: true } : (f as UpFile))),
        };
      }
      return saved;
    }
  } catch {
    /* ignore corrupt/blocked storage */
  }
  return initialState;
}

// Applies `update` to the file list of one upload slot. The payslip slot
// holds a single file, and its status is derived from that file.
function withSlotFiles(prev: FileUpState, slot: UploadSlot, update: (files: UpFile[]) => UpFile[]): FileUpState {
  if (slot === "bank") {
    return { ...prev, bank: { ...prev.bank, files: update(prev.bank.files) as FileUpState["bank"]["files"] } };
  }
  if (slot === "wh") {
    return { ...prev, wh: { ...prev.wh, files: update(prev.wh.files) } };
  }
  const file = update(prev.pay.file ? [prev.pay.file] : []).pop();
  const status = !file
    ? null
    : file.done
      ? "done"
      : file.status === "needs_password" || file.status === "failed"
        ? "attention"
        : "scanning";
  return { ...prev, pay: { status, file } };
}

const slotFiles = (s: FileUpState, slot: UploadSlot): UpFile[] =>
  slot === "bank" ? s.bank.files : slot === "wh" ? s.wh.files : s.pay.file ? [s.pay.file] : [];

// What a finished extraction means for the file row.
function fromExtraction(e: Extraction): Partial<UpFile> {
  const status = e.status === "done" ? "done" : e.status === "needs_password" ? "needs_password" : "failed";
  return {
    status,
    done: status === "done",
    method: e.method,
    confidence: e.confidence == null ? null : Number(e.confidence),
    error: e.error,
  };
}

const POLL_MS = 1500;
const POLL_MAX = 240; // ~6 minutes; long scanned PDFs take a while

const REDUCE =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Store = {
  s: FileUpState;
  // Uploads to the backend and tracks extraction; in demo mode (no login)
  // the files are only listed, never sent.
  uploadFiles: (slot: UploadSlot, files: File[]) => void;
  removeFile: (slot: UploadSlot, id: number) => void;
  unlockFile: (slot: UploadSlot, id: number, password: string) => Promise<void>;
  whNone: () => void;
  assetSend: (text: string) => void;
  assetNone: () => void;
  start: () => void;
  submit: () => void;
  approve: (version: number) => void;
  askOpen: () => void;
  askCancel: () => void;
  askSend: () => void;
  couponApply: (code: string) => string; // returns "" on success, else an error
  couponRemove: () => void;
  shotAdd: () => void;
  shotRemove: () => void;
  paySubmit: () => void;
  markEstCounted: () => void;
  finishEstimate: () => void; // the estimate screen finished (or was left early)
  // Admin actions — the "real events" the prototype timers stand in for.
  adminSendForApproval: (final: number, note: string) => void;
  adminVerifyPayment: () => void;
  adminRejectPayment: (reason: string) => void;
  adminMarkFiled: () => void;
  // The other returns in the admin queues (mocked). The connected return is
  // injected into its matching queue at read time (see adminData.areaRows).
  adminCases: AdminCaseData[];
  adminCaseSend: (id: string) => void; // Tax Calculation: sent for approval
  adminCaseVerify: (id: string) => void; // Payment: verified -> FBR Filing
  adminCaseFile: (id: string) => void; // FBR Filing: filed -> Filed Users
  jump: (i: number) => void;
  waDemo: () => void;
  payRejectDemo: () => void;
  clearArrived: () => void;
  clearWaBanner: () => void;
  clearNotice: () => void;
  resetAll: () => void;
};

const Ctx = createContext<Store | null>(null);

export function FileUpProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<FileUpState>(load);
  // The queue of other returns the admin works through. Seeded fresh each
  // mount (relative to now) so the waiting times read sensibly; not persisted.
  const [adminCases, setAdminCases] = useState<AdminCaseData[]>(seedAdminCases);
  const waitTimer = useRef<number | undefined>(undefined);
  const verifyTimer = useRef<number | undefined>(undefined);
  const estTimers = useRef<number[]>([]);
  const nextId = useRef(1);
  // Per-case timers for the seeded queue: a sent case "waits for the user",
  // then the taxpayer "approves and pays" and it moves to Payment Confirmation.
  const caseTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  /* ---------- Document uploads ---------- */
  const patchFile = (slot: UploadSlot, id: number, patch: Partial<UpFile>) =>
    setS((prev) =>
      slotFiles(prev, slot).some((f) => f.id === id)
        ? withSlotFiles(prev, slot, (fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))
        : prev,
    );

  // Polls the backend until extraction finishes, then records the outcome.
  const pollExtraction = (slot: UploadSlot, id: number, docId: number, attempt = 0) => {
    const token = authToken();
    if (!token) return;
    fetchExtraction(docId, token)
      .then((e) => {
        if ((e.status === "pending" || e.status === "processing") && attempt < POLL_MAX) {
          window.setTimeout(() => pollExtraction(slot, id, docId, attempt + 1), POLL_MS);
        } else if (e.status === "pending" || e.status === "processing") {
          patchFile(slot, id, { status: "failed", error: "Reading this file is taking too long." });
        } else {
          patchFile(slot, id, fromExtraction(e));
        }
      })
      .catch((err: Error) => patchFile(slot, id, { status: "failed", error: err.message }));
  };

  // After a reload: keep polling files that were mid-extraction; an upload
  // that never reached the server can't be resumed.
  useEffect(() => {
    (["bank", "pay", "wh"] as UploadSlot[]).forEach((slot) =>
      slotFiles(s, slot).forEach((f) => {
        if (f.status !== "scanning") return;
        if (f.docId) pollExtraction(slot, f.id, f.docId);
        else patchFile(slot, f.id, { status: "failed", error: "Upload was interrupted. Remove it and try again." });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Timers (prototype only) ---------- */
  const clearEstimate = () => {
    estTimers.current.forEach((t) => window.clearTimeout(t));
    estTimers.current = [];
  };

  // The instant AI estimate. The Step 2 screen (EstimateStep) plays the
  // reading/calculating sequence and calls finishEstimate when it's done.
  const startEstimate = () => {
    clearEstimate();
    if (REDUCE) {
      setS((prev) => ({ ...prev, estPhase: 4, estCounted: true }));
      return;
    }
    setS((prev) => ({ ...prev, estPhase: 0, estCounted: false }));
  };

  const promoteToApproval = () =>
    setS((prev) => (prev.stage === 3 ? { ...prev, stage: 4, arrived: true, sentAt: Date.now() } : prev));

  const scheduleWait = (ms: number) => {
    window.clearTimeout(waitTimer.current);
    waitTimer.current = window.setTimeout(promoteToApproval, Math.max(0, ms));
  };

  // Within the single "being filed" step, confirm the payment, then file:
  // filePhase 0 (verifying) -> filePhase 1 (filing). The admin does this in
  // production; here a timer stands in.
  const scheduleVerify = (ms: number) => {
    window.clearTimeout(verifyTimer.current);
    verifyTimer.current = window.setTimeout(() => {
      setS((prev) =>
        prev.stage === 6 && prev.filePhase < 1 ? { ...prev, filePhase: 1, verifiedAt: Date.now() } : prev,
      );
    }, Math.max(0, ms));
  };

  const stopTimers = () => {
    window.clearTimeout(waitTimer.current);
    window.clearTimeout(verifyTimer.current);
    clearEstimate();
  };

  const clearCaseTimer = (id: string) => {
    if (caseTimers.current[id]) {
      window.clearTimeout(caseTimers.current[id]);
      delete caseTimers.current[id];
    }
  };

  // After a seeded case is sent for approval it sits in "Waiting for User";
  // this stands in for the taxpayer approving and paying, which moves it on to
  // Payment Confirmation.
  const scheduleUserPay = (id: string) => {
    clearCaseTimer(id);
    caseTimers.current[id] = window.setTimeout(() => {
      delete caseTimers.current[id];
      setAdminCases((cs) =>
        cs.map((c) =>
          c.id === id && c.area === "waiting"
            ? {
                ...c,
                area: "payment",
                since: Date.now(),
                note: undefined,
                flags: [],
                amountDue: AMOUNTS.FEE,
                coupon: null,
                txnId: "TXN-" + (4000 + Math.floor(Math.random() * 5000)) + "-PK",
              }
            : c,
        ),
      );
    }, CONFIG.SIMULATE_USER_PAY_MS);
  };

  // Resume the simulated waits after a reload.
  useEffect(() => {
    if (s.stage === 3) {
      if (s.estPhase < 4) startEstimate();
      const remain = CONFIG.SIMULATE_TEAM_WAIT_MS - (Date.now() - (s.submittedAt || Date.now()));
      if (remain <= 0) promoteToApproval();
      else scheduleWait(remain);
    }
    if (s.stage === 6 && s.filePhase < 1) scheduleVerify(CONFIG.SIMULATE_VERIFY_MS);
    return () => {
      stopTimers();
      Object.values(caseTimers.current).forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ensureSampleDocs(state: FileUpState): FileUpState {
    let ns = state;
    if (!ns.bank.files.length) {
      ns = {
        ...ns,
        bank: {
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

    uploadFiles: (slot, files) => {
      const token = authToken();
      // The payslip slot holds one file: only the last one picked counts.
      for (const file of slot === "pay" ? files.slice(-1) : files) {
        // Unique across reloads (nextId restarts at 1 each mount).
        const id = Date.now() * 100 + (nextId.current++ % 100);
        const entry: UpFile & { bank?: string } = { id, name: file.name, done: false, status: "scanning" };
        if (slot === "bank") entry.bank = file.name.replace(/\.[^.]+$/, "");
        setS((prev) => {
          const ns = withSlotFiles(prev, slot, (fs) => (slot === "pay" ? [entry] : [...fs, entry]));
          if (slot === "wh") return { ...ns, wh: { ...ns.wh, none: false } };
          return ns;
        });

        if (!token) {
          // Demo mode: mocked extraction delay.
          window.setTimeout(() => patchFile(slot, id, { done: true, status: "done" }), 2200);
          continue;
        }
        uploadDocument(file, token)
          .then((docId) => {
            patchFile(slot, id, { docId });
            pollExtraction(slot, id, docId);
          })
          .catch((err: Error) => patchFile(slot, id, { status: "failed", error: err.message }));
      }
    },

    removeFile: (slot, id) => setS((prev) => withSlotFiles(prev, slot, (fs) => fs.filter((f) => f.id !== id))),

    unlockFile: async (slot, id, password) => {
      const token = authToken();
      const file = slotFiles(s, slot).find((f) => f.id === id);
      if (!token || !file?.docId) return;
      patchFile(slot, id, { status: "scanning", error: null });
      try {
        patchFile(slot, id, fromExtraction(await retryExtraction(file.docId, token, password)));
      } catch (err) {
        patchFile(slot, id, { status: "failed", error: (err as Error).message });
      }
    },

    start: () => setS((prev) => ({ ...prev, started: true, stage: 0 })),


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

    // Submit: starts the instant AI estimate, then waits for our team.
    submit: () => {
      const at = Date.now();
      setS((prev) => ({ ...prev, stage: 3, submittedAt: at, submitConsentAt: at, arrived: false }));
      startEstimate();
      scheduleWait(CONFIG.SIMULATE_TEAM_WAIT_MS);
    },

    // Confirm and file: approve the final return, then go and pay the fee.
    approve: (version) =>
      setS((prev) => ({
        ...prev,
        stage: 5,
        approvedVersion: version,
        approvedAt: Date.now(),
        payConsentAt: Date.now(),
        payment: emptyPayment,
        asking: false,
        askSent: false,
      })),

    askOpen: () => setS((prev) => ({ ...prev, asking: true })),
    askCancel: () => setS((prev) => ({ ...prev, asking: false })),
    askSend: () => setS((prev) => ({ ...prev, asking: false, askSent: true })),

    // Validate on the server in production (single use, limits, expiry).
    couponApply: (code) => {
      const v = code.trim().toUpperCase();
      if (!v) return "Enter a code first.";
      if (!Object.prototype.hasOwnProperty.call(COUPONS, v)) return "That code isn't valid.";
      setS((prev) => ({
        ...prev,
        payment: { ...prev.payment, coupon: v, discount: Math.min(COUPONS[v], AMOUNTS.FEE) },
      }));
      return "";
    },
    couponRemove: () => setS((prev) => ({ ...prev, payment: { ...prev.payment, coupon: null, discount: 0 } })),
    shotAdd: () => setS((prev) => ({ ...prev, payment: { ...prev.payment, shot: true } })),
    shotRemove: () => setS((prev) => ({ ...prev, payment: { ...prev.payment, shot: false } })),

    // Submit payment: payment confirmation and filing are one step. The
    // return goes to "being filed", which first verifies the payment
    // (filePhase 0) and then files it (filePhase 1).
    paySubmit: () => {
      setS((prev) => ({
        ...prev,
        stage: 6,
        filePhase: 0,
        payAt: Date.now(),
        payment: { ...prev.payment, rejected: false },
        notice: { text: "Payment received.", sub: "We're confirming it and filing your return.", tone: "ok" },
      }));
      scheduleVerify(CONFIG.SIMULATE_VERIFY_MS);
    },

    markEstCounted: () => setS((prev) => (prev.estCounted ? prev : { ...prev, estCounted: true })),

    finishEstimate: () =>
      setS((prev) =>
        prev.stage === 3 && (prev.estPhase < 4 || !prev.estCounted) ? { ...prev, estPhase: 4, estCounted: true } : prev,
      ),

    // --- Admin actions (drive the same return) ---

    // Submitted -> awaiting approval, with the final amount and team note.
    adminSendForApproval: (final, note) => {
      window.clearTimeout(waitTimer.current);
      setS((prev) =>
        prev.stage === 3
          ? { ...prev, stage: 4, arrived: true, sentAt: Date.now(), adminFinal: final, adminNote: note }
          : { ...prev, adminFinal: final, adminNote: note },
      );
    },

    // Within "being filed": confirm the payment (filePhase 0 -> 1).
    adminVerifyPayment: () => {
      window.clearTimeout(verifyTimer.current);
      setS((prev) =>
        prev.stage === 6 && prev.filePhase < 1 ? { ...prev, filePhase: 1, verifiedAt: Date.now() } : prev,
      );
    },

    // Reject the payment: back to the payment page with a "not verified" flag.
    adminRejectPayment: (reason) => {
      window.clearTimeout(verifyTimer.current);
      setS((prev) =>
        prev.stage === 6
          ? {
              ...prev,
              stage: 5,
              filePhase: 0,
              payment: { ...prev.payment, rejected: true, shot: false },
              rejectReason: reason,
              notice: {
                text: "We couldn't verify your payment.",
                sub: "Upload a clearer screenshot and try again.",
                tone: "warn",
              },
            }
          : prev,
      );
    },

    // Filing -> filed (receipt uploaded).
    adminMarkFiled: () => setS((prev) => (prev.stage === 6 ? { ...prev, stage: 7, filedAt: Date.now() } : prev)),

    // --- Other queued returns (mocked; see adminData.seedAdminCases) ---
    // The whole pipeline is linked: sending for approval moves a case to
    // Waiting for User (and schedules the taxpayer "paying"); verifying moves
    // it to FBR Filing; filing moves it to Filed. Counts update everywhere.
    adminCases,
    adminCaseSend: (id) => {
      setAdminCases((cs) =>
        cs.map((c) => (c.id === id ? { ...c, area: "waiting", since: Date.now(), note: "Awaiting approval" } : c)),
      );
      scheduleUserPay(id);
    },
    adminCaseVerify: (id) => {
      clearCaseTimer(id);
      setAdminCases((cs) => cs.map((c) => (c.id === id ? { ...c, area: "filing", since: Date.now() } : c)));
    },
    adminCaseFile: (id) => {
      clearCaseTimer(id);
      setAdminCases((cs) =>
        cs.map((c) => (c.id === id ? { ...c, area: "filed", since: Date.now(), filedAt: Date.now() } : c)),
      );
    },

    jump: (i) => {
      // Preview bar: index 0 = not started, index i>0 => started at stage i-1.
      stopTimers();
      const started = i > 0;
      const stage = i > 0 ? i - 1 : 0;
      setS((prev) => {
        let ns: FileUpState = {
          ...prev,
          started,
          stage,
          arrived: false,
          asking: false,
          askSent: false,
          notice: null,
          waBanner: null,
          filePhase: stage === 6 ? 1 : 0,
          payment: emptyPayment,
        };
        if (stage >= 1) ns = ensureSampleDocs(ns);
        if (stage >= 3) ns = { ...ns, estPhase: 4, estCounted: true };
        else ns = { ...ns, estPhase: 0, estCounted: false };
        if (started && stage === 3) ns = { ...ns, submittedAt: Date.now() };
        return ns;
      });
      if (started && stage === 3) scheduleWait(CONFIG.SIMULATE_TEAM_WAIT_MS);
    },

    // Preview/demo only: simulate a payslip arriving on WhatsApp. It attaches
    // to the open return (while editable) and raises the Home arrival banner.
    waDemo: () =>
      setS((prev) => {
        const started = true;
        const stage = prev.started && prev.stage <= 2 ? prev.stage : 0;
        return {
          ...prev,
          started,
          stage,
          pay: { status: "done", wa: true },
          notice: null,
          waBanner: "Payslip",
        };
      }),

    // Preview/demo only: simulate the team rejecting a payment screenshot.
    payRejectDemo: () =>
      setS((prev) => {
        let ns = ensureSampleDocs({ ...prev, started: true, stage: 5, estPhase: 4, estCounted: true });
        return {
          ...ns,
          payment: { coupon: null, discount: 0, shot: false, rejected: true },
          waBanner: null,
          notice: { text: "We couldn't verify your payment.", sub: "Upload a clearer screenshot and try again.", tone: "warn" },
        };
      }),

    clearArrived: () => setS((prev) => (prev.arrived ? { ...prev, arrived: false } : prev)),
    clearWaBanner: () => setS((prev) => (prev.waBanner ? { ...prev, waBanner: null } : prev)),
    clearNotice: () => setS((prev) => (prev.notice ? { ...prev, notice: null } : prev)),

    resetAll: () => {
      stopTimers();
      Object.values(caseTimers.current).forEach((t) => window.clearTimeout(t));
      caseTimers.current = {};
      nextId.current = 1;
      setS(initialState);
      setAdminCases(seedAdminCases());
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
