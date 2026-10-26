/* Tax Calculation — a mini-launcher of tiles: new returns to calculate,
   returns the taxpayer sent back for changes, and returns we've sent for
   approval and are waiting on. Each tile opens its own list. */

import { useNavigate } from "react-router-dom";

import { useFileUp } from "../store";
import { Crumbs, Ti } from "../ui";
import { AREA_META, CALC_SUB_META, CALC_SUB_ORDER, areaRows, calcSubRows, type AreaMeta } from "./adminData";

export default function AdminCalc() {
  const navigate = useNavigate();
  const { s, adminCases } = useFileUp();

  const all = areaRows(s, adminCases, "calc");

  const tiles: { key: string; meta: AreaMeta; count: number; to: string }[] = [
    ...CALC_SUB_ORDER.map((sub) => ({
      key: sub,
      meta: CALC_SUB_META[sub],
      count: calcSubRows(all, sub).length,
      to: "/admin/area/calc/" + sub,
    })),
    {
      key: "waiting",
      meta: AREA_META.waiting,
      count: areaRows(s, adminCases, "waiting").length,
      to: "/admin/area/waiting",
    },
  ];

  return (
    <div className="view">
      <Crumbs items={[{ text: "All areas", to: "/admin" }, { text: "Tax Calculation" }]} />
      <h1 className="page-title">Tax Calculation</h1>
      <p className="page-sub">Pick what to work on.</p>

      <div className="adm-tiles">
        {tiles.map((t, i) => (
          <button
            key={t.key}
            className="adm-tile"
            type="button"
            style={{ animationDelay: i * 0.07 + "s" }}
            onClick={() => navigate(t.to)}
          >
            <span className="adm-tile__chip">
              <Ti name={t.meta.icon} cls="i24" />
            </span>
            <div className="adm-tile__title">{t.meta.title}</div>
            <div className="adm-tile__foot">
              <span className="adm-tile__num">{t.count}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
