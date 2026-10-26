/* ==========================================================
   FileUp app — shared config, types and constants.
   Ported from the reference app.js (mocked prototype data).

   Five tracker steps: Upload > Review > Submit > Approve > File
   Eight user-facing statuses (one per return, read from the backend):
     0 upload      user adds documents
     1 review      user checks what they uploaded
     2 submit      user sends documents to FileUp
     3 submitted   AI estimate (instant, not final) + our team confirms it
     4 approve     our team sent the final return: Confirm and file page
     5 payment     user approved, now pays the service fee
     6 filing      one step: first we confirm the payment (filePhase 0),
                   then we file the return (filePhase 1)
     7 filed       done, receipt available
   ========================================================== */

const query = typeof window !== "undefined" ? window.location.search : "";
function param(name: string, fallback: number): number {
  const m = new RegExp("[?&]" + name + "=(\\d+)").exec(query);
  return m ? parseInt(m[1], 10) : fallback;
}

export const CONFIG = {
  // true: the Continue button on the documents page works without uploads.
  // false (production): it stays muted until required documents are done.
  DEMO_UNLOCK_CONTINUE: true,
  // Prototype timers. In production these are real events:
  //   estimate        comes from the local model (progress over SSE/websocket)
  //   team wait        ends when the admin presses "Send for approval"
  //   payment verify   ends when the admin confirms the payment (within the
  //                    single "being filed" step: verifying -> filing)
  ESTIMATE_STEP_MS: param("est", 1200),
  SIMULATE_TEAM_WAIT_MS: param("wait", 30000),
  SIMULATE_VERIFY_MS: param("verify", 6000),
  // Admin queue (seeded cases): after a case is sent for approval, how long
  // until the taxpayer "approves and pays" and it moves to Payment Confirmation.
  SIMULATE_USER_PAY_MS: param("userpay", 12000),
  SHOW_PREVIEW_BAR: /[?&]preview/.test(query),
  // Admin queue waiting-time thresholds (hours): a case turns amber after
  // WAIT_AMBER_H and red ("Overdue") after WAIT_RED_H.
  WAIT_AMBER_H: 12,
  WAIT_RED_H: 24,
  // The one place the WhatsApp chat link lives. Replace per environment;
  // never hard-code it in a component.
  WHATSAPP_URL: "https://wa.me/923000000000",
  // Sample bank details for the payment page. Replace with the real account.
  ACCOUNT: { bank: "Sample Bank", title: "FileUp (sample)", number: "0000 0000 0000" },
};

// Sample numbers. In production: estimate from the model, final from the team.
export const AMOUNTS = { ESTIMATE: 126500, FINAL: 128300, FEE: 1000 };
// Prototype only. Validate coupons on the server (single-use, limits, expiry).
export const COUPONS: Record<string, number> = { WELCOME: 200, FREE: 1000 };

export const money = (n: number) => "PKR " + n.toLocaleString("en-US");

// The team's note, shown to the user on approval. The admin can override it.
export const DEFAULT_TEAM_NOTE =
  "We claimed your mobile phone tax. Everything else matched your documents.";

// preview bar labels: index 0 = not started, then one per stage
export const PREVIEW_LABELS = [
  "Not started", "Upload", "Review", "Submit", "Submitted", "Approve", "Payment", "Filing", "Filed",
];
// short titles used on the Home status card ("Step n of 5: <title>")
export const STEP_TITLES = [
  "Upload your documents",
  "Review your documents",
  "Submit your documents",
  "Waiting for our team",
  "Approve your return",
  "Pay the service fee",
  "Filing in progress",
  "Filed",
];
// the always-visible 5-step tracker
export const TRACKER = ["Upload", "Review", "Submit", "Approve", "File"];
// stage -> current tracker step (0..4)
export const TRACKER_INDEX = [0, 1, 2, 2, 3, 3, 4, 5];
// stage -> "Step n of 5"
export const STEP_NUMBER = [1, 2, 3, 3, 4, 4, 5, 5];

export const BANKS = ["HBL", "Meezan Bank", "UBL", "Bank Alfalah"]; // sample names

// The instant AI estimate: four visible steps, then the number.
export const ESTIMATE_LINES = [
  "Reading your documents",
  "Sending the content to our AI",
  "Applying the tax logic",
  "Thinking it through",
];
export const ESTIMATE_DONE = [
  "Documents extracted",
  "Content sent to our AI",
  "Tax logic applied",
  "Estimate ready",
];

export type DocId = "bank" | "pay" | "wh" | "asset";

export type DocMeta = { id: DocId; icon: string; title: string; required: boolean; slug: string };

export const DOCS: DocMeta[] = [
  { id: "bank", icon: "ti-building-bank", title: "Bank statements", required: true, slug: "bank-statements" },
  { id: "pay", icon: "ti-file-text", title: "Payslips / salary slips", required: true, slug: "payslip" },
  { id: "wh", icon: "ti-receipt-tax", title: "Withholding tax proofs", required: false, slug: "withholding-proofs" },
  { id: "asset", icon: "ti-message-circle", title: "Assets bought or sold", required: false, slug: "assets" },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
export const docById = (id: DocId) => DOCS.find((d) => d.id === id)!;

export type BankFile = { id: number; bank: string; name: string; done: boolean; wa?: boolean };
export type ChatMsg = { from: "them" | "me"; text: string };
export type Payment = { coupon: string | null; discount: number; shot: boolean; rejected: boolean };
export type Notice = { text: string; sub: string; tone: "ok" | "warn" } | null;

export type FileUpState = {
  stage: number; // 0..7
  started: boolean; // false until the user presses "Start filing"
  arrived: boolean; // show the "team sent your return" banner
  bankIdx: number;
  bank: { files: BankFile[]; confirmed: boolean };
  pay: { status: null | "scanning" | "done"; wa?: boolean };
  waBanner: string | null; // Home arrival banner: the document name, or null
  notice: Notice; // generic banner (payment confirmed / rejected)
  wh: { files: string[]; none: boolean };
  asset: { chat: ChatMsg[]; none: boolean; sent: boolean };
  submittedAt: number;
  asking: boolean;
  askSent: boolean;
  estPhase: number; // 0-3 working, 4 done
  estCounted: boolean; // whether the count-up has already played
  filePhase: number; // within "being filed": 0 verifying payment, 1 filing
  payment: Payment;
  approvedVersion: number | null;
  approvedAt: number | null;
  submitConsentAt: number | null;
  payConsentAt: number | null;
  // When the return was sent to the taxpayer for approval (entered "waiting
  // for user"); for the admin "Waiting for User" waiting time.
  sentAt: number | null;
  // Timestamps for the admin queues' waiting times: when the taxpayer paid
  // (entered "payment to verify"), when the payment was verified (entered
  // "filing"), and when the return was filed.
  payAt: number | null;
  verifiedAt: number | null;
  filedAt: number | null;
  // Set by the admin ("Send for approval"); the user sees these on the
  // Confirm and file page. Null until the admin sets them (fall back below).
  adminFinal: number | null;
  adminNote: string | null;
  rejectReason: string | null; // admin's reason when a payment is rejected
};

export const emptyPayment: Payment = { coupon: null, discount: 0, shot: false, rejected: false };

export const initialState: FileUpState = {
  stage: 0,
  started: false,
  arrived: false,
  bankIdx: 0,
  bank: { files: [], confirmed: false },
  pay: { status: null },
  waBanner: null,
  notice: null,
  wh: { files: [], none: false },
  asset: {
    chat: [{ from: "them", text: "Did you buy or sell any assets this tax year? Tell me in your own words." }],
    none: false,
    sent: false,
  },
  submittedAt: 0,
  asking: false,
  askSent: false,
  estPhase: 0,
  estCounted: false,
  filePhase: 0,
  payment: emptyPayment,
  approvedVersion: null,
  approvedAt: null,
  submitConsentAt: null,
  payConsentAt: null,
  sentAt: null,
  payAt: null,
  verifiedAt: null,
  filedAt: null,
  adminFinal: null,
  adminNote: null,
  rejectReason: null,
};

/* ---------- Payment helpers ---------- */

export const feeDue = (s: FileUpState) => Math.max(0, AMOUNTS.FEE - s.payment.discount);

// The final tax amount and team note shown to the user: the admin's values
// once set, otherwise the sample defaults.
export const finalAmount = (s: FileUpState) => s.adminFinal ?? AMOUNTS.FINAL;
export const teamNote = (s: FileUpState) => s.adminNote ?? DEFAULT_TEAM_NOTE;

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
