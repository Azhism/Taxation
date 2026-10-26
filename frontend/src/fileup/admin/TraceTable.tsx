/* "How the AI got PKR X" — the trace behind the estimate, step by step.
   Low-confidence rows are tinted; if the lines don't add up to the total, an
   "Other, not itemised" row shows the gap; the last row is the AI estimate. */

import { money } from "../shared";
import { Ti } from "../ui";
import { DOC_ICON, tracedSum, type AiTrace, type LineItem } from "./adminData";

function ConfidencePill({ level }: { level: "high" | "low" }) {
  return (
    <span className={"adm-conf adm-conf--" + level}>{level === "high" ? "High" : "Low"}</span>
  );
}

function amountText(li: LineItem): string {
  if (li.amount != null) return money(li.amount);
  if (li.status === "not_applied") return "Not applied";
  return "—";
}

export default function TraceTable({
  trace,
  onOpenDoc,
}: {
  trace: AiTrace;
  onOpenDoc?: (docId: string | undefined, name: string) => void;
}) {
  const gap = trace.estimate - tracedSum(trace);

  return (
    <div className="adm-trace">
      <div className="adm-trace__scroll">
        <table className="adm-trace__table">
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Amount</th>
              <th scope="col">Found in</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {trace.lineItems.map((li) => (
              <tr key={li.label} className={li.confidence === "low" ? "adm-trace__row--low" : undefined}>
                <th scope="row">{li.label}</th>
                <td className="adm-trace__amt">{amountText(li)}</td>
                <td>
                  {li.source.docType === "calculated" ? (
                    <span className="adm-found">
                      <Ti name={DOC_ICON.calculated} cls="i16 c-subtle" /> {li.source.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="adm-found adm-found--link"
                      aria-label={"Open " + li.source.name}
                      onClick={() => onOpenDoc?.(li.source.docId, li.source.name)}
                    >
                      <Ti name={DOC_ICON[li.source.docType]} cls="i16" /> {li.source.name}
                    </button>
                  )}
                </td>
                <td>
                  <ConfidencePill level={li.confidence} />
                </td>
              </tr>
            ))}

            {gap !== 0 && (
              <tr className="adm-trace__row--low">
                <th scope="row">Other, not itemised</th>
                <td className="adm-trace__amt">{money(gap)}</td>
                <td>
                  <span className="adm-found">
                    <Ti name="ti-help-circle" cls="i16 c-subtle" /> No source
                  </span>
                </td>
                <td>
                  <ConfidencePill level="low" />
                </td>
              </tr>
            )}

            <tr className="adm-trace__row--total">
              <th scope="row">Total (AI estimate)</th>
              <td className="adm-trace__amt">{money(trace.estimate)}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
