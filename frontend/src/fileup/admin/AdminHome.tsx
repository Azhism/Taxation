/* Admin launcher — four large tiles, one per work area. Counts come from the
   same areaRows() the lists use, so a tile can never disagree with its list.
   Each tile is a button; the whole card is focusable and opens its area. */

import { useNavigate } from "react-router-dom";

import { CONFIG } from "../shared";
import { useFileUp } from "../store";
import { Ti } from "../ui";
import { AREA_META, AREA_ORDER, areaRows, type AdminArea } from "./adminData";

export default function AdminHome() {
  const navigate = useNavigate();
  const { s, adminCases } = useFileUp();

  const rowsByArea = Object.fromEntries(AREA_ORDER.map((a) => [a, areaRows(s, adminCases, a)])) as Record<
    AdminArea,
    ReturnType<typeof areaRows>
  >;

  // "Waiting for User" lives under Tax Calculation, so its rows count toward
  // the Tax Calculation tile (which matches that mini-launcher's three tiles).
  const waitingCount = areaRows(s, adminCases, "waiting").length;

  // WhatsApp "unread": returns where a document arrived on WhatsApp.
  const unread = AREA_ORDER.reduce(
    (n, a) => n + rowsByArea[a].filter((r) => r.flags.includes("whatsapp_doc")).length,
    0,
  );

  return (
    <div className="view">
      <h1 className="page-title">All areas</h1>
      <p className="page-sub">Pick a queue. Counts update as returns move through.</p>

      <div className="adm-tiles">
        {AREA_ORDER.map((area, i) => {
          const meta = AREA_META[area];
          const rows = rowsByArea[area];
          const count = area === "calc" ? rows.length + waitingCount : rows.length;
          return (
            <button
              key={area}
              className="adm-tile"
              type="button"
              style={{ animationDelay: i * 0.07 + "s" }}
              onClick={() => navigate("/admin/area/" + area)}
            >
              <span className="adm-tile__chip">
                <Ti name={meta.icon} cls="i24" />
              </span>
              <div className="adm-tile__title">{meta.title}</div>
              <div className="adm-tile__foot">
                <span className="adm-tile__num">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="adm-launch-row">
        <button
          className="adm-mini"
          type="button"
          onClick={() => {
            try {
              window.open(CONFIG.WHATSAPP_URL, "_blank", "noopener,noreferrer");
            } catch {
              /* popups may be blocked */
            }
          }}
        >
          <span className="adm-mini__icon adm-mini__icon--wa">
            <Ti name="ti-brand-whatsapp" cls="i20" />
          </span>
          <span className="adm-mini__label">WhatsApp</span>
          {unread > 0 && (
            <span className="adm-mini__badge" aria-label={unread + " unread"}>
              {unread}
            </span>
          )}
        </button>

        <button className="adm-mini" type="button" onClick={() => navigate("/admin/settings")}>
          <span className="adm-mini__icon">
            <Ti name="ti-settings" cls="i20" />
          </span>
          <span className="adm-mini__label">Settings</span>
        </button>
      </div>
    </div>
  );
}
