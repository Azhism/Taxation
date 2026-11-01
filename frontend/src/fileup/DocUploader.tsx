/* The uploader shown inside a document's dropdown on the Upload step:
   the files added so far plus a drop zone. Used for bank statements,
   payslip and withholding tax proofs. */

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { UpFile, UploadSlot } from "./shared";
import { useFileUp } from "./store";
import { authToken } from "./api";
import { WaPill } from "./whatsapp";
import { Ti } from "./ui";

export const ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024; // matches the backend limit

// Splits picked files into ones we accept and an error naming the rest.
// Shared by the drop zones and the row Upload/Add buttons.
export function screenFiles(list: FileList | null, multiple: boolean): { good: File[]; error: string } {
  const files = Array.from(list || []);
  const bad = files.filter((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_BYTES);
  const good = files.filter((f) => !bad.includes(f));
  return {
    good: multiple ? good : good.slice(0, 1),
    error: bad.length ? `Skipped ${bad.map((f) => f.name).join(", ")}: only PDF, PNG or JPG up to 10 MB.` : "",
  };
}
// Fast uploads finish in a fraction of a second; keep the uploading ring up
// at least this long so the user sees it work before "Uploaded" pops in.
const MIN_UPLOADING_MS = 1500;

// True once the file is done AND has shown as uploading for the minimum time.
// A file that was already done when the row appeared settles immediately.
function useSettled(done: boolean): boolean {
  const shownAt = useRef(Date.now());
  const [settled, setSettled] = useState(done);
  useEffect(() => {
    if (!done) {
      shownAt.current = Date.now();
      setSettled(false);
      return;
    }
    const wait = Math.max(0, MIN_UPLOADING_MS - (Date.now() - shownAt.current));
    const t = window.setTimeout(() => setSettled(true), wait);
    return () => window.clearTimeout(t);
  }, [done]);
  return settled;
}

export function UploadRing() {
  return (
    <svg className="upring" viewBox="0 0 20 20" aria-hidden="true">
      <circle className="upring__track" cx="10" cy="10" r="8" />
      <circle className="upring__arc" cx="10" cy="10" r="8" />
    </svg>
  );
}

// User-facing only: extraction details (method, confidence, text) are for
// our team and never shown here.
function fileSub(f: UpFile): string {
  if (f.status === "needs_password") return "This PDF is locked. Enter its password to continue.";
  if (f.status === "failed") {
    return f.docId ? "We couldn't read this file. Try uploading a clearer copy." : f.error || "Upload failed. Try again.";
  }
  return f.name; // while uploading, the status on the right says so
}

function FileStatusPill({ f }: { f: UpFile }) {
  if (f.done) {
    return (
      <span className="frow__status frow__status--done">
        <Ti name="ti-circle-check" cls="i16" />
        Uploaded
      </span>
    );
  }
  if (f.status === "needs_password" || f.status === "failed") {
    return (
      <span className="frow__status frow__status--warn">
        <Ti name={f.status === "needs_password" ? "ti-lock" : "ti-alert-triangle"} cls="i16" />
        {f.status === "needs_password" ? "Locked" : "Failed"}
      </span>
    );
  }
  return (
    <span className="frow__status frow__status--busy">
      <UploadRing />
      Uploading...
    </span>
  );
}

function UnlockForm({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState("");
  return (
    <form
      className="frow__unlock"
      onSubmit={(e) => {
        e.preventDefault();
        if (password) onUnlock(password);
      }}
    >
      <input
        className="input"
        type="password"
        autoComplete="off"
        aria-label="PDF password"
        placeholder="PDF password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn btn--secondary btn--sm" type="submit">
        Unlock
      </button>
    </form>
  );
}

function FileRow({ slot, f: file, title }: { slot: UploadSlot; f: UpFile; title: string }) {
  const store = useFileUp();
  const settled = useSettled(file.done);
  // Until settled, a finished file still shows as uploading.
  const f: UpFile = file.done && !settled ? { ...file, done: false, status: "scanning" } : file;
  const busy = !f.done && f.status !== "needs_password" && f.status !== "failed";
  return (
    <>
      <div className={"frow" + (busy ? " frow--busy" : "")}>
        <Ti name={f.name.toLowerCase().endsWith(".pdf") ? "ti-file-type-pdf" : "ti-photo"} cls="i20 c-accent" />
        <div className="frow__body">
          <div className="frow__name">
            {title}
            {f.wa && <WaPill />}
          </div>
          <div className="frow__sub">{fileSub(f)}</div>
        </div>
        <FileStatusPill f={f} />
        <button className="frow__x" type="button" aria-label="Remove" onClick={() => store.removeFile(slot, f.id)}>
          <Ti name="ti-x" cls="i16" />
        </button>
      </div>
      {f.status === "needs_password" && f.docId && (
        <UnlockForm onUnlock={(pw) => store.unlockFile(slot, f.id, pw)} />
      )}
    </>
  );
}

function DropZone({
  onFiles,
  label,
  small,
  multiple,
}: {
  onFiles: (files: File[]) => void;
  label: ReactNode;
  small?: boolean;
  multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  function take(list: FileList | null) {
    const { good, error } = screenFiles(list, !!multiple);
    setError(error);
    if (good.length) onFiles(good);
  }

  const common = {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => input.current?.click(),
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.current?.click();
      }
    },
    onDragOver: (e: ReactDragEvent) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: ReactDragEvent) => {
      e.preventDefault();
      setOver(false);
      take(e.dataTransfer.files);
    },
  };
  const picker = (
    <input
      ref={input}
      type="file"
      accept={ACCEPT}
      multiple={multiple}
      hidden
      onChange={(e) => {
        take(e.target.files);
        e.target.value = ""; // allow picking the same file again
      }}
    />
  );
  const cls = "dz" + (small ? " dz--sm" : "") + (over ? " dz--over" : "");
  return (
    <>
      {small ? (
        <div className={cls} {...common}>
          <Ti name="ti-plus" cls="i16 c-accent" /> {label}
          {picker}
        </div>
      ) : (
        <div className={cls} {...common}>
          <Ti name="ti-cloud-upload" cls="dz__icon" />
          <div>{label}</div>
          <div className="dz__hint">PDF, PNG, or JPG</div>
          {picker}
        </div>
      )}
      {error && <div className="field-error">{error}</div>}
      {!authToken() && (
        <div className="dz__demo">Demo mode: files are only listed here, not uploaded. Log in to upload for real.</div>
      )}
    </>
  );
}

const browse = (what: string) => (
  <>
    Drop {what} or <strong>browse</strong>
  </>
);

export default function DocUploader({ slot, onClose }: { slot: UploadSlot; onClose: () => void }) {
  const store = useFileUp();
  const { s } = store;

  if (slot === "bank") {
    return (
      <>
        <p className="dacc__hint">Add all of your bank statements.</p>
        {s.bank.files.length > 0 && (
          <div className="stack">
            {s.bank.files.map((f) => (
              <FileRow key={f.id} slot="bank" f={f} title={f.bank} />
            ))}
          </div>
        )}
        <DropZone onFiles={(files) => store.uploadFiles("bank", files)} multiple label={browse("a file")} />
      </>
    );
  }

  if (slot === "pay") {
    return (
      <>
        <p className="dacc__hint">Your most recent one.</p>
        {s.pay.status && (
          <div className="stack">
            <FileRow
              slot="pay"
              f={s.pay.file ?? { id: 0, name: "payslip.pdf", done: s.pay.status === "done", wa: s.pay.wa }}
              title="Payslip"
            />
          </div>
        )}
        <DropZone
          onFiles={(files) => store.uploadFiles("pay", files)}
          small={!!s.pay.status}
          label={s.pay.status ? "Replace" : browse("a file")}
        />
      </>
    );
  }

  return (
    <>
      <p className="dacc__hint">For example, mobile phone tax. Add as many as you need.</p>
      {s.wh.files.length > 0 && (
        <div className="stack">
          {s.wh.files.map((f) => (
            <FileRow key={f.id} slot="wh" f={f} title={f.name.replace(/\.[^.]+$/, "")} />
          ))}
        </div>
      )}
      <DropZone
        onFiles={(files) => store.uploadFiles("wh", files)}
        multiple
        small={s.wh.files.length > 0}
        label={s.wh.files.length ? "Add another" : browse("files")}
      />
      {!s.wh.files.length && !s.wh.none && (
        <div className="dacc__actions">
          <button
            className="btn btn--secondary btn--sm"
            type="button"
            onClick={() => {
              store.whNone();
              onClose();
            }}
          >
            Nothing to add
          </button>
        </div>
      )}
    </>
  );
}
