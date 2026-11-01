/* The documents list shown inside the Upload step. Each row has one action
   button (Upload or Add) that opens the file picker straight away; the row
   itself opens a dropdown listing the files added so far. Assets bought or
   sold is a chat, so its Add button opens that page instead. One dropdown is
   open at a time. */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DOCS, DocId, UploadSlot, docStatus, requiredCount } from "./shared";
import { useFileUp } from "./store";
import DocUploader, { ACCEPT, UploadRing, screenFiles } from "./DocUploader";
import { WaHint } from "./whatsapp";
import { Ti } from "./ui";

const isSlot = (id: string): id is UploadSlot => id === "bank" || id === "pay" || id === "wh";
const ACTION: Record<DocId, string> = { bank: "Upload", pay: "Upload", wh: "Add", asset: "Add" };

export default function DocumentsList() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const store = useFileUp();
  const { s } = store;
  const pickers = useRef<Partial<Record<UploadSlot, HTMLInputElement | null>>>({});
  const [pickError, setPickError] = useState<{ id: DocId; text: string } | null>(null);
  // A link like /dashboard/return#bank arrives with that dropdown open.
  const [open, setOpen] = useState<DocId | null>(() => {
    const id = hash.slice(1);
    return isSlot(id) ? id : null;
  });
  // ...also when the link is followed while already on this page.
  useEffect(() => {
    const id = hash.slice(1);
    if (isSlot(id)) setOpen(id);
  }, [hash]);

  const n = requiredCount(s);
  const assetsPath = "/dashboard/return/documents/" + DOCS[3].slug;

  // Files picked from a row's Upload/Add button: upload them and open the
  // dropdown so the user sees them uploading.
  function onPicked(id: UploadSlot, list: FileList | null) {
    const { good, error } = screenFiles(list, id !== "pay");
    setPickError(error ? { id, text: error } : null);
    if (good.length) store.uploadFiles(id, good);
    if (good.length || error) setOpen(id);
  }

  return (
    <>
      <div className="docs-head">
        <h3 className="docs-head__title">Your documents</h3>
        <span className="docs-count">{n} of 2 required</span>
      </div>

      <div className="meter meter--thin">
        <div className="meter__fill" style={{ width: n * 50 + "%" }} />
      </div>

      <div className="doclist">
        {DOCS.map((d) => {
          const id = d.id;
          const slot = isSlot(id) ? id : null;
          const isOpen = open === id;
          const status = docStatus(s, id);
          const done = status.kind === "done";
          const toggle = () => (slot ? setOpen(isOpen ? null : slot) : navigate(assetsPath));
          return (
            <div key={id} className={"dacc" + (isOpen ? " is-open" : "")}>
              <div className="dacc__head">
                <button
                  className="dacc__toggle"
                  type="button"
                  aria-expanded={slot ? isOpen : undefined}
                  aria-controls={slot ? "dacc-" + id : undefined}
                  onClick={toggle}
                >
                  {/* Done adds a small green tick badge to the document's own
                      icon; solid teal is kept for the Submit button only. */}
                  <span className={"doc__icon" + (done ? " doc__icon--ok" : "")}>
                    <Ti name={d.icon} cls="i20" />
                    {done && (
                      <span className="doc__badge" aria-label="Uploaded">
                        <Ti name="ti-check" />
                      </span>
                    )}
                  </span>
                  <span className="doc__body">
                    <span className="doc__name">{d.title}</span>
                    <span className="doc__meta">{d.required ? "Required" : "Optional"}</span>
                  </span>
                </button>

                {status.kind === "busy" && <UploadRing />}
                {status.kind === "partial" && <span className="doc__status doc__status--warn">Needs attention</span>}

                <button
                  className="btn btn--sm btn--secondary"
                  type="button"
                  onClick={() => (slot ? pickers.current[slot]?.click() : navigate(assetsPath))}
                >
                  {ACTION[id]}
                </button>
                {slot && (
                  <input
                    ref={(el) => {
                      pickers.current[slot] = el;
                    }}
                    type="file"
                    accept={ACCEPT}
                    multiple={slot !== "pay"}
                    hidden
                    onChange={(e) => {
                      onPicked(slot, e.target.files);
                      e.target.value = ""; // allow picking the same file again
                    }}
                  />
                )}

                <button
                  className="dacc__chevbtn"
                  type="button"
                  aria-label={slot ? (isOpen ? "Hide files" : "Show files") : "Open " + d.title}
                  onClick={toggle}
                >
                  <Ti name={slot ? "ti-chevron-down" : "ti-chevron-right"} cls="i18 c-subtle dacc__chev" />
                </button>
              </div>

              {pickError?.id === id && <p className="field-error dacc__error">{pickError.text}</p>}

              {slot && isOpen && (
                <div className="dacc__body" id={"dacc-" + id}>
                  <DocUploader slot={slot} onClose={() => setOpen(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <WaHint text="Send your documents on WhatsApp directly." />
    </>
  );
}
