/* ==========================================================
   Admin panel — mocked data and queue helpers.

   The admin panel acts on the SAME mocked return as the user app
   (one shared FileUpState), so the admin's actions drive the user's
   live screens. That connected return is injected into whichever
   queue matches its status (see areaRows). The other rows here are
   sample data to swap for real API responses later.

   Four work areas map onto the return statuses:
     calc     Tax Calculation     needs review          (stage 3)
     payment  Payment Confirmation payment to verify     (stage 6, filePhase 0)
     filing   FBR Filing          approved + paid        (stage 6, filePhase 1)
     filed    Filed Users         filed                  (stage 7)
   ========================================================== */

import { AMOUNTS, CONFIG, feeDue, finalAmount, type FileUpState } from "../shared";

export type AdminTone = "idle" | "review" | "wait" | "action" | "done";

export type AdminStatus = { label: string; tone: AdminTone; hint: string };

// Map the shared return's stage to what the admin sees and can do.
export function adminStatus(s: FileUpState): AdminStatus {
  const st = s.stage;
  if (!s.started || st < 3)
    return { label: "Not submitted", tone: "idle", hint: "The taxpayer is still preparing their documents." };
  if (st === 3)
    return { label: "Needs review", tone: "review", hint: "Review the return, set the final amount, and send it for approval." };
  if (st === 4)
    return { label: "Awaiting approval", tone: "wait", hint: "Sent to the taxpayer. Waiting for them to approve." };
  if (st === 5)
    return s.payment.rejected
      ? { label: "Payment rejected", tone: "wait", hint: "The taxpayer needs to upload a clearer payment screenshot." }
      : { label: "Awaiting payment", tone: "wait", hint: "Waiting for the taxpayer to pay the service fee." };
  if (st === 6)
    return s.filePhase < 1
      ? { label: "Payment to verify", tone: "action", hint: "Check the payment screenshot, then verify or reject it." }
      : { label: "Filing", tone: "action", hint: "Payment confirmed. File on IRIS and upload the receipt." };
  return { label: "Filed", tone: "done", hint: "The return is filed and the receipt is available." };
}

// Admin status pill tone -> existing user-app status pill class.
export const toneClass: Record<AdminTone, string> = {
  idle: "status",
  review: "status status--attention",
  wait: "status status--active",
  action: "status status--attention",
  done: "status status--done",
};

/* ---------- Work areas ---------- */

// "waiting" (returns sent for approval, awaiting the taxpayer) lives under Tax
// Calculation as a third tile — it is not one of the four main launcher areas.
export type AdminArea = "calc" | "payment" | "filing" | "filed" | "waiting";

export type AreaMeta = { title: string; icon: string; unit: string; desc: string };

export const AREA_META: Record<AdminArea, AreaMeta> = {
  calc: {
    title: "Tax Calculation",
    icon: "ti-calculator",
    unit: "to review",
    desc: "Check the AI's numbers and send each return for approval.",
  },
  waiting: {
    title: "Waiting for User",
    icon: "ti-clock",
    unit: "waiting",
    desc: "Returns sent for approval. Waiting for the taxpayer to approve.",
  },
  payment: {
    title: "Payment Confirmation",
    icon: "ti-receipt-2",
    unit: "to verify",
    desc: "Match each payment in the bank account, then verify it.",
  },
  filing: {
    title: "FBR Filing",
    icon: "ti-building-community",
    unit: "to file",
    desc: "File approved and paid returns, then upload the receipt.",
  },
  filed: {
    title: "Filed Users",
    icon: "ti-flag-check",
    unit: "filed",
    desc: "Everyone we have filed for, with their receipts.",
  },
};

export const AREA_ORDER: AdminArea[] = ["calc", "payment", "filing", "filed"];

/* Tax Calculation splits into two: returns the taxpayer sent back for changes,
   and new returns whose tax still needs working out. */
export type CalcSub = "changes" | "new";

export const CALC_SUB_META: Record<CalcSub, AreaMeta> = {
  changes: {
    title: "Review Changes",
    icon: "ti-arrow-back-up",
    unit: "to review",
    desc: "Returns the taxpayer sent back with changes to make.",
  },
  new: {
    title: "Calculate Tax",
    icon: "ti-calculator",
    unit: "to calculate",
    desc: "New returns — check the AI's numbers and send for approval.",
  },
};

export const CALC_SUB_ORDER: CalcSub[] = ["changes", "new"];

// Split the Tax Calculation rows: "changes" are the ones sent back for changes,
// "new" are everything else.
export function calcSubRows(rows: AdminRow[], sub: CalcSub): AdminRow[] {
  const asked = (r: AdminRow) => r.flags.includes("asked_changes");
  return rows.filter((r) => (sub === "changes" ? asked(r) : !asked(r)));
}

/* ---------- Flags ---------- */

export type AdminFlag = "low_confidence" | "model_rules_differ" | "asked_changes" | "whatsapp_doc";

export const FLAG_LABELS: Record<AdminFlag, string> = {
  low_confidence: "Low confidence",
  model_rules_differ: "Model and rules differ",
  asked_changes: "Taxpayer asked for changes",
  whatsapp_doc: "Sent a document on WhatsApp",
};

export const FLAG_ICONS: Record<AdminFlag, string> = {
  low_confidence: "ti-alert-triangle",
  model_rules_differ: "ti-arrows-diff",
  asked_changes: "ti-arrow-back-up",
  whatsapp_doc: "ti-brand-whatsapp",
};

/* ---------- Case data (sample) ---------- */

export type AdminCaseData = {
  id: string;
  name: string;
  cnic: string; // already masked — never a full CNIC, never a phone number
  year: string;
  area: AdminArea;
  since: number; // epoch ms the case entered its current area (for waiting time)
  aiEstimate: number;
  rulesCalc: number;
  finalTax: number;
  method: "Manual" | "RPA";
  flags: AdminFlag[];
  coupon?: string | null;
  txnId?: string;
  amountDue?: number;
  filedAt?: number;
  note?: string; // status note for the "Waiting for User" list
  trace?: AiTrace; // the AI's explanation, for the review screen (calc cases)
};

const H = 3600_000;
const MIN = 60_000;

// Seed the queue relative to "now" so the waiting times read sensibly. Swap
// this for the real returns API. CNICs are stored already masked.
export function seedAdminCases(): AdminCaseData[] {
  const now = Date.now();
  return [
    // --- Tax Calculation (needs review) ---
    {
      id: "c-ayesha", name: "Ayesha Khan", cnic: "42101-xxxxxxx-2", year: "2025-26", area: "calc",
      since: now - 27 * H, aiEstimate: 142300, rulesCalc: 139800, finalTax: 142300, method: "Manual",
      flags: ["low_confidence"],
      trace: {
        estimate: 142300,
        lineItems: [
          { label: "Annual gross salary", amount: 3900000, base: true, confidence: "high",
            source: { docType: "payslip", docId: "pay", name: "Payslip · Zenith Foods" } },
          { label: "Tax on salary (FBR slabs)", amount: 138000, confidence: "high",
            source: { docType: "calculated", name: "From salary above" } },
          { label: "Tax on profit on debt", amount: 2500, confidence: "high",
            source: { docType: "bank", docId: "bank", name: "Bank statements" } },
          { label: "Capital gains tax on property", amount: null, status: "not_applied", confidence: "low",
            reason: "A property sale was mentioned, but no sale value or date was found in the documents.",
            source: { docType: "withholding", docId: "wh", name: "Property documents" } },
        ],
      },
    },
    {
      id: "c-bilal", name: "Bilal Ahmed", cnic: "35202-xxxxxxx-7", year: "2025-26", area: "calc",
      since: now - 14 * H, aiEstimate: 88400, rulesCalc: 88400, finalTax: 90100, method: "RPA",
      flags: ["asked_changes", "low_confidence"],
      trace: {
        estimate: 88400,
        lineItems: [
          { label: "Annual gross salary", amount: 2400000, base: true, confidence: "high",
            source: { docType: "payslip", docId: "pay", name: "Payslip · Orient Textiles" } },
          { label: "Tax on salary (FBR slabs)", amount: 86600, confidence: "high",
            source: { docType: "calculated", name: "From salary above" } },
          { label: "Tax on profit on debt", amount: 1800, confidence: "high",
            source: { docType: "bank", docId: "bank", name: "Bank statements" } },
          { label: "Donation tax credit", amount: null, status: "not_applied", confidence: "low",
            reason: "The taxpayer mentioned a charity donation, but no receipt was uploaded.",
            source: { docType: "withholding", docId: "wh", name: "Donation receipt" } },
        ],
      },
    },
    {
      id: "c-hira", name: "Hira Siddiqui", cnic: "42201-xxxxxxx-5", year: "2025-26", area: "calc",
      since: now - 40 * MIN, aiEstimate: 65200, rulesCalc: 65200, finalTax: 65200, method: "Manual",
      flags: ["whatsapp_doc"],
      trace: {
        estimate: 65200,
        lineItems: [
          { label: "Annual gross salary", amount: 1800000, base: true, confidence: "high",
            source: { docType: "payslip", docId: "pay", name: "Payslip · Systems Ltd" } },
          { label: "Tax on salary (FBR slabs)", amount: 63400, confidence: "high",
            source: { docType: "calculated", name: "From salary above" } },
          { label: "Tax on profit on debt", amount: 1800, confidence: "high",
            source: { docType: "bank", docId: "bank", name: "Bank statements" } },
        ],
      },
    },
    // --- Waiting for User (sent for approval, awaiting the taxpayer) ---
    {
      id: "c-rabia", name: "Rabia Aslam", cnic: "42101-xxxxxxx-6", year: "2025-26", area: "waiting",
      since: now - 5 * H, aiEstimate: 112400, rulesCalc: 0, finalTax: 114200, method: "Manual",
      flags: [], note: "Awaiting approval",
    },
    {
      id: "c-danish", name: "Danish Raza", cnic: "35202-xxxxxxx-3", year: "2025-26", area: "waiting",
      since: now - 28 * H, aiEstimate: 73500, rulesCalc: 0, finalTax: 73500, method: "RPA",
      flags: [], note: "Awaiting approval",
    },
    // --- Payment Confirmation (payment to verify) ---
    {
      id: "c-usman", name: "Usman Tariq", cnic: "61101-xxxxxxx-4", year: "2025-26", area: "payment",
      since: now - 26 * H, aiEstimate: 0, rulesCalc: 0, finalTax: 154000, method: "Manual",
      flags: [], coupon: "WELCOME", txnId: "TXN-7731-PK", amountDue: 800,
    },
    {
      id: "c-nadia", name: "Nadia Pervez", cnic: "42101-xxxxxxx-8", year: "2025-26", area: "payment",
      since: now - 35 * MIN, aiEstimate: 0, rulesCalc: 0, finalTax: 97600, method: "RPA",
      flags: ["whatsapp_doc"], coupon: null, txnId: "TXN-7744-PK", amountDue: 1000,
    },
    // --- FBR Filing (approved + paid, ready to file) ---
    {
      id: "c-faisal", name: "Faisal Iqbal", cnic: "35201-xxxxxxx-1", year: "2025-26", area: "filing",
      since: now - 13 * H, aiEstimate: 0, rulesCalc: 0, finalTax: 203400, method: "Manual", flags: [],
    },
    {
      id: "c-sana", name: "Sana Malik", cnic: "61101-xxxxxxx-9", year: "2025-26", area: "filing",
      since: now - 20 * MIN, aiEstimate: 0, rulesCalc: 0, finalTax: 118900, method: "RPA", flags: [],
    },
    // --- Filed Users ---
    {
      id: "c-zain", name: "Zain Abbas", cnic: "42101-xxxxxxx-3", year: "2025-26", area: "filed",
      since: now - 2 * H, filedAt: now - 2 * H, aiEstimate: 0, rulesCalc: 0, finalTax: 131200, method: "Manual", flags: [],
    },
    {
      id: "c-maria", name: "Maria Yousaf", cnic: "35202-xxxxxxx-6", year: "2025-26", area: "filed",
      since: now - 5 * 24 * H, filedAt: now - 5 * 24 * H, aiEstimate: 0, rulesCalc: 0, finalTax: 76400, method: "RPA", flags: [],
    },
    {
      id: "c-omar", name: "Omar Sheikh", cnic: "42201-xxxxxxx-0", year: "2025-26", area: "filed",
      since: now - 12 * 24 * H, filedAt: now - 12 * 24 * H, aiEstimate: 0, rulesCalc: 0, finalTax: 159000, method: "Manual", flags: [],
    },
  ];
}

/* ---------- The connected return as a queue row ---------- */

export type AdminRow = {
  id: string; // "live" for the connected return, else the case id
  live: boolean;
  name: string;
  cnic: string;
  year: string;
  area: AdminArea;
  since: number;
  aiEstimate: number;
  rulesCalc: number;
  finalTax: number;
  method: "Manual" | "RPA";
  flags: AdminFlag[];
  coupon?: string | null;
  txnId?: string;
  amountDue?: number;
  filedAt?: number;
  note?: string;
};

// Which queue the connected return sits in right now, if any. Statuses the
// taxpayer owns (preparing, awaiting approval, awaiting payment) are not in
// any admin queue.
export function liveArea(s: FileUpState): AdminArea | null {
  if (!s.started) return null;
  if (s.stage === 3) return "calc";
  if (s.stage === 4) return "waiting"; // sent for approval, awaiting the taxpayer
  if (s.stage === 6) return s.filePhase < 1 ? "payment" : "filing";
  if (s.stage === 7) return "filed";
  return null;
}

function liveRow(s: FileUpState, area: AdminArea): AdminRow {
  const since =
    area === "calc" ? s.submittedAt || Date.now() :
    area === "waiting" ? s.sentAt || s.submittedAt || Date.now() :
    area === "payment" ? s.payAt || s.approvedAt || Date.now() :
    area === "filing" ? s.verifiedAt || s.payAt || Date.now() :
    s.filedAt || Date.now();
  const flags: AdminFlag[] = [];
  if (area === "calc") flags.push("low_confidence"); // the mobile-phone item is flagged
  if (s.pay?.wa) flags.push("whatsapp_doc");
  return {
    id: "live", live: true, name: "Demo User", cnic: "42101-xxxxxxx-9", year: "2025-26", area, since,
    aiEstimate: AMOUNTS.ESTIMATE, rulesCalc: AMOUNTS.ESTIMATE, finalTax: finalAmount(s), method: "Manual",
    flags, coupon: s.payment.coupon, txnId: "TXN-4821-PK", amountDue: feeDue(s), filedAt: s.filedAt ?? undefined,
    note: area === "waiting" ? adminStatus(s).label : undefined,
  };
}

function toRow(c: AdminCaseData): AdminRow {
  return { ...c, live: false };
}

// The rows in one area: the sample cases plus the connected return when it
// belongs here. Both the launcher counts and the area lists read this, so a
// count can never disagree with its list. Filed sorts newest first; the work
// queues sort oldest first (the longest wait is most urgent).
export function areaRows(s: FileUpState, cases: AdminCaseData[], area: AdminArea): AdminRow[] {
  const rows = cases.filter((c) => c.area === area).map(toRow);
  if (liveArea(s) === area) rows.push(liveRow(s, area));
  rows.sort((a, b) => (area === "filed" ? (b.filedAt ?? b.since) - (a.filedAt ?? a.since) : a.since - b.since));
  return rows;
}

/* ---------- Waiting-time formatting ---------- */

export type WaitTone = "normal" | "amber" | "red";

export function waitTone(since: number, now = Date.now()): WaitTone {
  const h = (now - since) / H;
  if (h >= CONFIG.WAIT_RED_H) return "red";
  if (h >= CONFIG.WAIT_AMBER_H) return "amber";
  return "normal";
}

// The chip on a queue row. Red cases read "Overdue · 26 h".
export function waitChip(since: number, now = Date.now()): { text: string; tone: WaitTone } {
  const tone = waitTone(since, now);
  const h = (now - since) / H;
  const base = h < 1 ? Math.max(1, Math.round(h * 60)) + " m" : Math.round(h) + " h";
  return { text: tone === "red" ? "Overdue · " + Math.round(h) + " h" : base, tone };
}

// "Oldest 26 h" (or minutes when under an hour) for the tile detail lines.
export function oldestLabel(rows: AdminRow[], minutesUnderHour: boolean, now = Date.now()): string {
  if (!rows.length) return "Nothing waiting";
  const oldest = Math.min(...rows.map((r) => r.since));
  const h = (now - oldest) / H;
  if (minutesUnderHour && h < 1) return "Oldest " + Math.max(1, Math.round(h * 60)) + " m";
  return "Oldest " + Math.max(1, Math.round(h)) + " h";
}

export function filedTodayCount(rows: AdminRow[], now = Date.now()): number {
  const d = new Date(now);
  return rows.filter((r) => {
    if (!r.filedAt) return false;
    const f = new Date(r.filedAt);
    return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth() && f.getDate() === d.getDate();
  }).length;
}

/* ==========================================================
   The AI's explanation — the only source of the number. There is no
   separate rules engine: the review screen shows how the AI reached the
   figure, document by document, and flags the low-confidence items.
   ========================================================== */

export type Confidence = "high" | "low";

export type LineSource = {
  // "calculated" means derived from another line, not read from a document.
  docType: "payslip" | "bank" | "withholding" | "calculated";
  docId?: string;
  name: string;
};

export type LineItem = {
  label: string;
  amount: number | null; // null when the AI did not apply this item
  status?: "not_applied";
  reason?: string; // why it wasn't applied / needs a look (shown on low items)
  base?: boolean; // a context figure (e.g. gross salary), not summed into the total
  source: LineSource;
  confidence: Confidence;
};

export type AiTrace = { estimate: number; lineItems: LineItem[] };

export const DOC_ICON: Record<LineSource["docType"], string> = {
  payslip: "ti-file-text",
  bank: "ti-building-bank",
  withholding: "ti-receipt-tax",
  calculated: "ti-calculator",
};

// The line items that actually add toward the total: not context rows, and not
// items the AI left out.
export function tracedSum(t: AiTrace): number {
  return t.lineItems
    .filter((li) => !li.base && li.status !== "not_applied" && li.amount != null)
    .reduce((n, li) => n + (li.amount as number), 0);
}

// Any low-confidence line — these are what the reviewer must resolve.
export function flaggedItems(t: AiTrace): LineItem[] {
  return t.lineItems.filter((li) => li.confidence === "low");
}

// The documents behind a trace, for the collapsible "Documents" section:
// unique by name, skipping calculated-only rows.
export function traceDocs(t: AiTrace): { name: string; icon: string; docId?: string }[] {
  const seen = new Set<string>();
  const out: { name: string; icon: string; docId?: string }[] = [];
  for (const li of t.lineItems) {
    if (li.source.docType === "calculated" || seen.has(li.source.name)) continue;
    seen.add(li.source.name);
    out.push({ name: li.source.name, icon: DOC_ICON[li.source.docType], docId: li.source.docId });
  }
  return out;
}

// The connected return's trace. In production this comes from the AI run.
export function liveTrace(s: FileUpState): AiTrace {
  void s;
  return {
    estimate: AMOUNTS.ESTIMATE, // 126,500
    lineItems: [
      { label: "Annual gross salary", amount: 3600000, base: true, confidence: "high",
        source: { docType: "payslip", docId: "pay", name: "Payslip · Acme (Pvt) Ltd" } },
      { label: "Tax on salary (FBR slabs)", amount: 124700, confidence: "high",
        source: { docType: "calculated", name: "From salary above" } },
      { label: "Tax on profit on debt", amount: 1800, confidence: "high",
        source: { docType: "bank", docId: "bank", name: "Bank statements" } },
      { label: "Mobile phone advance tax", amount: null, status: "not_applied", confidence: "low",
        reason: "Section 236 certificate for PKR 1,800 found; unsure if it duplicates the bank profit tax.",
        source: { docType: "withholding", docId: "wh", name: "Withholding certificate" } },
    ],
  };
}
