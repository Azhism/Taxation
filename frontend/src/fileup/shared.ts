/* ==========================================================
   FileUp app — shared config, types and constants.
   Ported from the reference app.js (mocked prototype data).
   ========================================================== */

const query = typeof window !== "undefined" ? window.location.search : "";
const waitParam = /[?&]wait=(\d+)/.exec(query);

export const CONFIG = {
  // true: the Continue button on the documents page works without uploads.
  // false (production): it stays muted until required documents are done.
  DEMO_UNLOCK_CONTINUE: true,
  // Prototype only: fake "our team is working" delay. In production the
  // status changes when the admin presses "Send for approval".
  SIMULATE_TEAM_WAIT_MS: waitParam ? parseInt(waitParam[1], 10) : 30000,
  SHOW_PREVIEW_BAR: /[?&]preview/.test(query),
};

export const REFUND = 18400; // sample amount shown on the approval page

// stage index -> label (7 statuses)
export const STAGE_LABELS = ["Upload", "Review", "Submit", "Submitted", "Approve", "Filing", "Filed"];
// the always-visible 5-step tracker
export const TRACKER = ["Upload", "Review", "Submit", "Approve", "File"];
// stage -> current tracker step
export const TRACKER_INDEX = [0, 1, 2, 2, 3, 4, 5];

export const BANKS = ["HBL", "Meezan Bank", "UBL", "Bank Alfalah"]; // sample names

export type DocId = "bank" | "pay" | "wh" | "asset";

export type DocMeta = { id: DocId; icon: string; title: string; required: boolean; slug: string };

export const DOCS: DocMeta[] = [
  { id: "bank", icon: "ti-building-bank", title: "Bank statements", required: true, slug: "bank-statements" },
  { id: "pay", icon: "ti-file-text", title: "Payslip", required: true, slug: "payslip" },
  { id: "wh", icon: "ti-receipt-tax", title: "Withholding tax proofs", required: false, slug: "withholding-proofs" },
  { id: "asset", icon: "ti-message-circle", title: "Assets bought or sold", required: false, slug: "assets" },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
export const docById = (id: DocId) => DOCS.find((d) => d.id === id)!;

export type BankFile = { id: number; bank: string; name: string; done: boolean };
export type ChatMsg = { from: "them" | "me"; text: string };

export type FileUpState = {
  stage: number; // 0..6
  arrived: boolean; // show the "team sent your return" banner
  bankIdx: number;
  bank: { files: BankFile[]; confirmed: boolean };
  pay: { status: null | "scanning" | "done" };
  wh: { files: string[]; none: boolean };
  asset: { chat: ChatMsg[]; none: boolean; sent: boolean };
  submittedAt: number;
  asking: boolean;
  askSent: boolean;
  approvedVersion: number | null;
  approvedAt: number | null;
  submitConsentAt: number | null;
};

export const initialState: FileUpState = {
  stage: 0,
  arrived: false,
  bankIdx: 0,
  bank: { files: [], confirmed: false },
  pay: { status: null },
  wh: { files: [], none: false },
  asset: {
    chat: [{ from: "them", text: "Did you buy or sell any assets this tax year? Tell me in your own words." }],
    none: false,
    sent: false,
  },
  submittedAt: 0,
  asking: false,
  askSent: false,
  approvedVersion: null,
  approvedAt: null,
  submitConsentAt: null,
};

/* ---------- Derived document status helpers ---------- */

export const bankReady = (s: FileUpState) =>
  s.bank.files.length > 0 && s.bank.files.every((x) => x.done) && s.bank.confirmed;

export const payReady = (s: FileUpState) => s.pay.status === "done";

export const requiredCount = (s: FileUpState) => (bankReady(s) ? 1 : 0) + (payReady(s) ? 1 : 0);

export type DocStatus = { kind: "empty" | "busy" | "partial" | "done"; text: string };

export function docStatus(s: FileUpState, id: DocId): DocStatus {
  if (id === "bank") {
    const f = s.bank.files;
    if (!f.length) return { kind: "empty", text: "Upload" };
    if (f.some((x) => !x.done)) return { kind: "busy", text: "Scanning..." };
    return bankReady(s) ? { kind: "done", text: f.length + " added" } : { kind: "partial", text: "Confirm banks" };
  }
  if (id === "pay") {
    if (s.pay.status === "scanning") return { kind: "busy", text: "Scanning..." };
    if (s.pay.status === "done") return { kind: "done", text: "Added" };
    return { kind: "empty", text: "Upload" };
  }
  if (id === "wh") {
    if (s.wh.none) return { kind: "done", text: "Nothing to add" };
    if (s.wh.files.length) return { kind: "done", text: s.wh.files.length + " added" };
    return { kind: "empty", text: "Add" };
  }
  if (s.asset.none) return { kind: "done", text: "Nothing to report" };
  if (s.asset.sent) return { kind: "done", text: "Added" };
  return { kind: "empty", text: "Add" };
}

export type UploadedItem = { d: DocMeta; meta: string };

export function uploadedSummary(s: FileUpState): UploadedItem[] {
  const out: UploadedItem[] = [];
  if (s.bank.files.length) out.push({ d: DOCS[0], meta: s.bank.files.map((f) => f.name).join(", ") });
  if (s.pay.status) out.push({ d: DOCS[1], meta: "payslip.pdf" });
  if (s.wh.files.length) out.push({ d: DOCS[2], meta: s.wh.files.join(", ") });
  if (s.asset.sent || s.asset.none)
    out.push({ d: DOCS[3], meta: s.asset.none ? "Nothing to report" : "Note from your chat" });
  return out;
}
