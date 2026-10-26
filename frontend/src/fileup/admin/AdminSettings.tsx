/* Admin settings — placeholder. Real settings (team members, bank account for
   payment matching, IRIS credentials, WhatsApp number) are backend work. */

import { Crumbs, Ti } from "../ui";

const ITEMS = [
  { icon: "ti-users", title: "Team members", meta: "Who can review, verify and file" },
  { icon: "ti-building-bank", title: "Bank account", meta: "The account payments are matched against" },
  { icon: "ti-id-badge-2", title: "IRIS access", meta: "Credentials used to file on FBR IRIS" },
  { icon: "ti-brand-whatsapp", title: "WhatsApp number", meta: "Where taxpayers reach us" },
];

export default function AdminSettings() {
  return (
    <div className="view">
      <Crumbs items={[{ text: "All areas", to: "/admin" }, { text: "Settings" }]} />
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Coming soon. These are configured on the backend for now.</p>

      <div className="doclist">
        {ITEMS.map((it) => (
          <div className="doc" key={it.title}>
            <span className="doc__icon">
              <Ti name={it.icon} cls="i20" />
            </span>
            <div className="doc__body">
              <div className="doc__name">{it.title}</div>
              <div className="doc__meta">{it.meta}</div>
            </div>
            <span className="adm-sample">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
