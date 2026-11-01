/* Backend calls for document upload and text extraction. */

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type Extraction = {
  status: "pending" | "processing" | "done" | "needs_password" | "failed";
  method: "pdf_text" | "ocr_image" | "ocr_pdf" | null;
  text: string | null;
  confidence: string | number | null; // Postgres NUMERIC arrives as a string
  pages: number | null;
  error: string | null;
};

// The real JWT, or null in demo mode (no login, or the "demo" placeholder token).
export function authToken(): string | null {
  try {
    const t = localStorage.getItem("TOKEN");
    return t && t !== "demo" ? t : null;
  } catch {
    return null;
  }
}

async function call<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Your session has expired. Log in again.");
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function uploadDocument(file: File, token: string): Promise<number> {
  const form = new FormData();
  form.append("file", file);
  const data = await call<{ id: number }>("/api/docs/upload", token, { method: "POST", body: form });
  return data.id;
}

export async function fetchExtraction(docId: number, token: string): Promise<Extraction> {
  return (await call<{ extraction: Extraction }>(`/api/docs/${docId}/extraction`, token)).extraction;
}

// When our team will have confirmed an estimate submitted at `from` (team SLA).
export async function fetchTeamEta(from: number, token: string): Promise<Date> {
  const data = await call<{ eta: string }>(`/api/team/eta?from=${from}`, token);
  return new Date(data.eta);
}

export async function retryExtraction(docId: number, token: string, password?: string): Promise<Extraction> {
  const data = await call<{ extraction: Extraction }>(`/api/docs/${docId}/extract`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return data.extraction;
}
