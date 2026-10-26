/* A flagged (low-confidence) line the reviewer must resolve. "Ask AI why"
   posts a question into the chat; "Mark as checked" clears the flag — the card
   turns white and the header pill goes green. */

import { money } from "../shared";
import { Ti } from "../ui";
import { type LineItem } from "./adminData";

export default function FlagCard({
  item,
  checked,
  onAskWhy,
  onCheck,
}: {
  item: LineItem;
  checked: boolean;
  onAskWhy: () => void;
  onCheck: () => void;
}) {
  const amount = item.amount != null ? money(item.amount) : "Not applied";

  return (
    <section className={"adm-flagcard" + (checked ? " adm-flagcard--done" : "")}>
      <span className="adm-flagcard__icon">
        <Ti name={checked ? "ti-circle-check" : "ti-flag"} cls="i20" />
      </span>
      <div className="adm-flagcard__body">
        <div className="adm-flagcard__head">
          <span className="adm-flagcard__name">{item.label}</span>
          <span className="adm-flagcard__amt">{amount}</span>
        </div>
        {item.reason && <p className="adm-flagcard__reason">{item.reason}</p>}
        <div className="adm-flagcard__actions">
          <button className="btn btn--secondary btn--sm" type="button" onClick={onAskWhy}>
            <Ti name="ti-message-circle" cls="i16" /> Ask AI why
          </button>
          {checked ? (
            <span className="adm-flagcard__done-tag">
              <Ti name="ti-check" cls="i16" /> Checked
            </span>
          ) : (
            <button className="btn btn--secondary btn--sm" type="button" onClick={onCheck}>
              <Ti name="ti-check" cls="i16" /> Mark as checked
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
