/* What the Step 2 estimate screen plays: one entry per uploaded document
   with the values found in it, rotating tips, and the result.

   The document list comes from the user's real uploads. The found values and
   the result are SAMPLE figures for now: the backend extracts raw text but
   doesn't yet turn it into fields or run the tax calculation. When it does,
   replace sampleFound() and sampleResult() with the backend's per-document
   fields and estimate; the screen only reads the EstimateRun shape. */

import { AMOUNTS, FileUpState, money } from "./shared";

export type Found = [label: string, value: string];
export type RunDoc = { key: string; name: string; icon: string; found: Found[] };
export type EstimateResult = { amount: number; rows: Found[] }; // amount < 0 = refund
export type EstimateRun = { docs: RunDoc[]; tips: string[]; result: EstimateResult };

export const TIPS = [
  "The tax your employer cuts every month already counts toward your yearly total.",
  "Tax already cut on your bank profit counts toward what you owe.",
  "Being on the Active Taxpayer List usually means lower tax on bank profit.",
  "Tax deducted on your mobile bills can be adjusted against what you owe.",
];

const stripExt = (name: string) => name.replace(/\.[^.]+$/, "");

function sampleFound(kind: "bank" | "pay" | "wh", nth: number): Found[] {
  if (kind === "pay") {
    return [
      ["Monthly salary", "PKR 200,000"],
      ["Tax cut by employer (so far)", "PKR 96,000"],
    ];
  }
  if (kind === "bank") {
    return nth === 0
      ? [
          ["Profit on savings", "PKR 63,300"],
          ["Tax already cut on profit", "PKR 9,500"],
        ]
      : [["Account activity", "Checked"]];
  }
  return [["Phone tax (adjustable)", "PKR 2,500"]];
}

function sampleResult(): EstimateResult {
  const total = AMOUNTS.ESTIMATE;
  const deducted = AMOUNTS.ESTIMATE_DEDUCTED;
  return {
    amount: total - deducted,
    rows: [
      ["Taxable income", "PKR 2,400,000"],
      ["Total tax for the year", money(total)],
      ["Already deducted (salary, bank, phone)", "− " + money(deducted)],
    ],
  };
}

export function buildEstimateRun(s: FileUpState): EstimateRun {
  const docs: RunDoc[] = [];
  if (s.pay.status) {
    docs.push({
      key: "pay",
      name: s.pay.file ? stripExt(s.pay.file.name) : "Payslip",
      icon: "ti-file-text",
      found: sampleFound("pay", 0),
    });
  }
  s.bank.files.forEach((f, i) =>
    docs.push({ key: "bank-" + f.id, name: f.bank, icon: "ti-building-bank", found: sampleFound("bank", i) }),
  );
  s.wh.files.forEach((f) =>
    docs.push({ key: "wh-" + f.id, name: stripExt(f.name), icon: "ti-receipt-tax", found: sampleFound("wh", 0) }),
  );

  // Preview mode lets people submit with nothing uploaded; show sample documents.
  if (!docs.length) {
    docs.push(
      { key: "s-pay", name: "Payslip", icon: "ti-file-text", found: sampleFound("pay", 0) },
      { key: "s-hbl", name: "HBL statement", icon: "ti-building-bank", found: sampleFound("bank", 0) },
      { key: "s-mzn", name: "Meezan statement", icon: "ti-building-bank", found: sampleFound("bank", 1) },
      { key: "s-ph", name: "Phone bills", icon: "ti-device-mobile", found: sampleFound("wh", 0) },
    );
  }
  return { docs, tips: TIPS, result: sampleResult() };
}

// "today, 6 PM" / "tomorrow, 6 PM" / "Mon 3 Nov, 6 PM"
export function formatEta(eta: Date, now = new Date()): string {
  const time = eta.toLocaleTimeString("en-US", { hour: "numeric", minute: eta.getMinutes() ? "2-digit" : undefined });
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(eta) - day(now)) / 86400000);
  if (diff === 0) return "today, " + time;
  if (diff === 1) return "tomorrow, " + time;
  const date = eta.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return date + ", " + time;
}
