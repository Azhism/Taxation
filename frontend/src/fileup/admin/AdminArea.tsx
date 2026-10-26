/* One admin work area: the list of returns in a queue, with the area's own
   columns and row action. Reads the same areaRows() the launcher counts from,
   so the list and the count always agree. The connected return (id "live")
   appears here too and drives the taxpayer's screens when acted on. */

import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { money } from "../shared";
import { useFileUp } from "../store";
import { Crumbs, Ti } from "../ui";
import {
  AREA_META,
  CALC_SUB_META,
  FLAG_ICONS,
  FLAG_LABELS,
  areaRows,
  calcSubRows,
  waitChip,
  type AdminArea as Area,
  type AdminFlag,
  type AdminRow,
  type CalcSub,
} from "./adminData";

function Avatar({ name, muted }: { name: string; muted?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return (
    <span className={"avatar" + (muted ? " avatar--muted" : "")} aria-hidden="true">
      {initials}
    </span>
  );
}

function Who({ row }: { row: AdminRow }) {
  return (
    <span className="adm-who">
      <Avatar name={row.name} muted={!row.live} />
      <span>
        <span className="adm-name">
          {row.name}
          {row.live && <span className="adm-you-tag">You are here</span>}
        </span>
        <span className="adm-sub">{row.cnic}</span>
      </span>
    </span>
  );
}

function Wait({ since }: { since: number }) {
  const c = waitChip(since);
  return <span className={"adm-wait adm-wait--" + c.tone}>{c.text}</span>;
}

function Flags({ flags }: { flags: AdminFlag[] }) {
  if (!flags.length) return null;
  return (
    <div className="adm-flags">
      {flags.map((f) => (
        <span className="adm-flag" key={f}>
          <Ti name={FLAG_ICONS[f]} cls="i16" />
          {FLAG_LABELS[f]}
        </span>
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="adm-fact">
      <span className="adm-fact__label">{label}</span>
      <span className="adm-fact__value">{value}</span>
    </div>
  );
}

export default function AdminArea() {
  const navigate = useNavigate();
  const store = useFileUp();
  const { s, adminCases } = store;
  const { area, sub } = useParams<{ area: Area; sub?: CalcSub }>();

  // Row-level UI state.
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [filing, setFiling] = useState<string | null>(null);
  const [checks, setChecks] = useState<{ iris: boolean; receipt: boolean }>({ iris: false, receipt: false });
  const [query, setQuery] = useState("");

  if (!area || !(area in AREA_META)) return <Navigate to="/admin" replace />;
  // Tax Calculation is a mini-launcher; its lists live under a sub.
  if (area === "calc" && !sub) return <Navigate to="/admin/area/calc" replace />;
  if (area === "calc" && sub && !(sub in CALC_SUB_META)) return <Navigate to="/admin/area/calc" replace />;

  const isCalcSub = area === "calc" && !!sub;
  const meta = isCalcSub ? CALC_SUB_META[sub!] : AREA_META[area];

  let rows = areaRows(s, adminCases, area);
  if (isCalcSub) rows = calcSubRows(rows, sub!);

  if (area === "filed" && query.trim()) {
    const q = query.trim().toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.cnic.toLowerCase().includes(q));
  }

  const underCalc = isCalcSub || area === "waiting";
  const crumbs = underCalc
    ? [
        { text: "All areas", to: "/admin" },
        { text: "Tax Calculation", to: "/admin/area/calc" },
        { text: meta.title },
      ]
    : [{ text: "All areas", to: "/admin" }, { text: meta.title }];

  const openReview = (row: AdminRow) => navigate("/admin/case/" + row.id);
  const verify = (row: AdminRow) => (row.live ? store.adminVerifyPayment() : store.adminCaseVerify(row.id));
  const markFiled = (row: AdminRow) => {
    if (row.live) store.adminMarkFiled();
    else store.adminCaseFile(row.id);
    setFiling(null);
    setChecks({ iris: false, receipt: false });
  };

  return (
    <div className="view">
      <Crumbs items={crumbs} />

      <div className="adm-area-head">
        <h1 className="page-title">{meta.title}</h1>
        <span className="adm-area-count">
          {rows.length} {meta.unit}
        </span>
      </div>
      <p className="page-sub">{meta.desc}</p>

      {area === "filed" && (
        <div className="adm-search">
          <Ti name="ti-search" cls="i18 c-subtle" />
          <input
            className="input"
            type="search"
            placeholder="Search by name or CNIC"
            aria-label="Search filed returns by name or CNIC"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {rows.length === 0 ? (
        <section className="panel">
          <div className="adm-empty">
            <Ti name="ti-inbox" cls="i24 c-subtle" />
            <div>
              <div className="adm-empty__title">{query.trim() ? "No matches" : "Nothing here"}</div>
              <div className="adm-empty__text">
                {query.trim() ? "No returns match that name or CNIC." : "Returns appear here as they reach this stage."}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="adm-list">
          {rows.map((row) => {
            // Tax Calculation: the whole row opens the review screen.
            if (area === "calc") {
              return (
                <button key={row.id} className="adm-lrow adm-lrow--link" type="button" onClick={() => openReview(row)}>
                  <div className="adm-lrow__head">
                    <Who row={row} />
                    <Wait since={row.since} />
                  </div>
                  <div className="adm-facts">
                    <Fact label="AI estimate" value={money(row.aiEstimate)} />
                  </div>
                  <Flags flags={row.flags} />
                  <span className="adm-lrow__open">
                    Review <Ti name="ti-chevron-right" cls="i16" />
                  </span>
                </button>
              );
            }

            // Payment Confirmation: verify, gated by a bank-match tick.
            if (area === "payment") {
              const ok = !!matched[row.id];
              return (
                <div key={row.id} className="adm-lrow">
                  <div className="adm-lrow__head">
                    <Who row={row} />
                    <Wait since={row.since} />
                  </div>
                  <div className="adm-facts">
                    <Fact label="Amount due" value={money(row.amountDue ?? 0)} />
                    <Fact label="Coupon" value={row.coupon || "None"} />
                    <Fact label="Transaction ID" value={row.txnId || "—"} />
                  </div>
                  <Flags flags={row.flags} />
                  <label className="adm-check">
                    <input
                      type="checkbox"
                      checked={ok}
                      onChange={(e) => setMatched((m) => ({ ...m, [row.id]: e.target.checked }))}
                    />
                    <span>I matched this in the bank account</span>
                  </label>
                  <div className="adm-lrow__actions">
                    <button className="btn btn--primary btn--sm" type="button" disabled={!ok} onClick={() => verify(row)}>
                      <Ti name="ti-check" cls="i16" /> Verify
                    </button>
                  </div>
                </div>
              );
            }

            // FBR Filing: open a checklist, then mark filed.
            if (area === "filing") {
              const open = filing === row.id;
              return (
                <div key={row.id} className="adm-lrow">
                  <div className="adm-lrow__head">
                    <Who row={row} />
                    <Wait since={row.since} />
                  </div>
                  <div className="adm-facts">
                    <Fact label="Final tax" value={money(row.finalTax)} />
                  </div>
                  {open ? (
                    <div className="adm-checklist">
                      <div className="adm-checklist__title">Filing checklist</div>
                      <label className="adm-check">
                        <input
                          type="checkbox"
                          checked={checks.iris}
                          onChange={(e) => setChecks((c) => ({ ...c, iris: e.target.checked }))}
                        />
                        <span>Filed on IRIS</span>
                      </label>
                      <label className="adm-check">
                        <input
                          type="checkbox"
                          checked={checks.receipt}
                          onChange={(e) => setChecks((c) => ({ ...c, receipt: e.target.checked }))}
                        />
                        <span>
                          Receipt uploaded
                          <button
                            className="btn--text adm-upload"
                            type="button"
                            onClick={() => setChecks((c) => ({ ...c, receipt: true }))}
                          >
                            <Ti name="ti-upload" cls="i16" /> Upload
                          </button>
                        </span>
                      </label>
                      <div className="adm-lrow__actions">
                        <button
                          className="btn btn--primary btn--sm"
                          type="button"
                          disabled={!(checks.iris && checks.receipt)}
                          onClick={() => markFiled(row)}
                        >
                          <Ti name="ti-flag-check" cls="i16" /> Mark filed
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          type="button"
                          onClick={() => {
                            setFiling(null);
                            setChecks({ iris: false, receipt: false });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="adm-lrow__actions">
                      <button
                        className="btn btn--primary btn--sm"
                        type="button"
                        onClick={() => {
                          setFiling(row.id);
                          setChecks({ iris: false, receipt: false });
                        }}
                      >
                        <Ti name="ti-building-community" cls="i16" /> File
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // Waiting for User: read-only — we've sent it and are waiting.
            if (area === "waiting") {
              return (
                <div key={row.id} className="adm-lrow">
                  <div className="adm-lrow__head">
                    <Who row={row} />
                    <Wait since={row.since} />
                  </div>
                  <div className="adm-facts">
                    <Fact label="Final tax sent" value={money(row.finalTax)} />
                  </div>
                  <div className="adm-lrow__actions">
                    <span className="status status--active">{row.note || "Awaiting approval"}</span>
                  </div>
                </div>
              );
            }

            // Filed Users: final tax, filed date, receipt download.
            const filedDate = row.filedAt
              ? new Date(row.filedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—";
            return (
              <div key={row.id} className="adm-lrow">
                <div className="adm-lrow__head">
                  <Who row={row} />
                  <span className="adm-wait adm-wait--normal">{filedDate}</span>
                </div>
                <div className="adm-facts">
                  <Fact label="Final tax" value={money(row.finalTax)} />
                  <Fact label="Method" value={row.method} />
                </div>
                <div className="adm-lrow__actions">
                  <button className="btn btn--secondary btn--sm" type="button">
                    <Ti name="ti-download" cls="i16" /> Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
