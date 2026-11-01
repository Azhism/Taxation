import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { query } from "./db";
import { extractText, NeedsPasswordError } from "./extraction";

dotenv.config();

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// JWT secret — required, no insecure fallback
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`FATAL: ${name} is not set. Add it to backend/.env before starting.`);
    process.exit(1);
  }
  return value;
}
const JWT_SECRET = requiredEnv("JWT_SECRET");

// --- Auth routes ---
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email+password required" });
  }
  
  try {
    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "user exists" });
    }
    
    // Hash password and insert user
    const hash = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)",
      [email, name || "", hash]
    );
    
    return res.json({ ok: true });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const result = await query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "invalid credentials" });
    }
    
    const user = result.rows[0];
    
    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "invalid credentials" });
    }
    
    // Generate JWT with user id and email
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    res.json({ token, email: user.email, name: user.name });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "server error" });
  }
});

// --- Middleware to protect routes ---
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "no token" });
  }
  const parts = auth.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ error: "bad auth" });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

// --- File uploads (multer) ---
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}-${safe}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.post("/api/docs/upload", authMiddleware, upload.single("file"), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "file required (pdf/png/jpg)" });
  }
  
  try {
    const url = `/uploads/${req.file.filename}`;
    const userId = req.user.id; // From JWT payload
    
    // Save document metadata to database
    const inserted = await query(
      `INSERT INTO documents
       (user_id, filename, original_name, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        req.file.filename,
        req.file.originalname,
        url,
        req.file.mimetype,
        req.file.size
      ]
    );
    
    const docId = inserted.rows[0].id;
    // Extract in the background; the client polls GET /api/docs/:id/extraction.
    runExtraction(docId).catch(() => {});

    res.json({ ok: true, id: docId, filename: req.file.filename, url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "failed to save document" });
  }
});

// --- Text extraction ---
// Runs extraction for one document and records the outcome on its row.
// Never logs the extracted text: it holds CNICs, account numbers and salaries.
async function runExtraction(docId: number, password?: string) {
  const doc = await query("SELECT filename, file_type FROM documents WHERE id = $1", [docId]);
  if (doc.rows.length === 0) return;
  const { filename, file_type } = doc.rows[0];

  await query(
    "UPDATE documents SET extraction_status = 'processing', extraction_error = NULL WHERE id = $1",
    [docId]
  );
  try {
    const result = await extractText(path.join(UPLOAD_DIR, filename), file_type, password);
    await query(
      `UPDATE documents
       SET extraction_status = 'done', extraction_method = $2, extracted_text = $3,
           extraction_confidence = $4, extraction_pages = $5, extracted_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [docId, result.method, result.text, result.confidence, result.pages]
    );
  } catch (error: any) {
    const needsPassword = error instanceof NeedsPasswordError;
    if (!needsPassword) console.error(`Extraction failed for document ${docId}:`, error?.message);
    await query(
      "UPDATE documents SET extraction_status = $2, extraction_error = $3 WHERE id = $1",
      [docId, needsPassword ? "needs_password" : "failed", String(error?.message || error)]
    );
  }
}

// Owner-only lookup shared by the extraction routes; returns the id or sends an error.
async function ownedDocId(req: any, res: any): Promise<number | null> {
  const docId = parseInt(req.params.id, 10);
  if (Number.isNaN(docId)) {
    res.status(400).json({ error: "bad id" });
    return null;
  }
  const result = await query("SELECT id FROM documents WHERE id = $1 AND user_id = $2", [
    docId,
    req.user.id,
  ]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "not found" });
    return null;
  }
  return docId;
}

async function extractionRow(docId: number) {
  const result = await query(
    `SELECT id, extraction_status AS status, extraction_method AS method, extracted_text AS text,
            extraction_confidence AS confidence, extraction_pages AS pages,
            extraction_error AS error, extracted_at
     FROM documents WHERE id = $1`,
    [docId]
  );
  return result.rows[0];
}

// Current extraction state and text for a document
app.get("/api/docs/:id/extraction", authMiddleware, async (req: any, res) => {
  try {
    const docId = await ownedDocId(req, res);
    if (docId === null) return;
    res.json({ extraction: await extractionRow(docId) });
  } catch (error) {
    console.error("Get extraction error:", error);
    return res.status(500).json({ error: "failed to fetch extraction" });
  }
});

// Re-run extraction, optionally with a PDF password. Waits for the result.
app.post("/api/docs/:id/extract", authMiddleware, async (req: any, res) => {
  try {
    const docId = await ownedDocId(req, res);
    if (docId === null) return;
    const password = typeof req.body?.password === "string" ? req.body.password : undefined;
    await runExtraction(docId, password);
    res.json({ extraction: await extractionRow(docId) });
  } catch (error) {
    console.error("Extract error:", error);
    return res.status(500).json({ error: "failed to extract" });
  }
});

// Get user's documents
app.get("/api/docs", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      `SELECT id, filename, original_name, file_url, file_type, file_size, upload_date, status
       FROM documents 
       WHERE user_id = $1 
       ORDER BY upload_date DESC`,
      [userId]
    );
    
    res.json({ documents: result.rows });
  } catch (error) {
    console.error("Get documents error:", error);
    return res.status(500).json({ error: "failed to fetch documents" });
  }
});

// Authenticated file download — only the document's owner can fetch it
app.get("/api/docs/:id/file", authMiddleware, async (req: any, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    if (Number.isNaN(docId)) {
      return res.status(400).json({ error: "bad id" });
    }
    const result = await query(
      "SELECT filename FROM documents WHERE id = $1 AND user_id = $2",
      [docId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "not found" });
    }
    const filePath = path.join(UPLOAD_DIR, result.rows[0].filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "file missing" });
    }
    return res.sendFile(filePath);
  } catch (error) {
    console.error("File download error:", error);
    return res.status(500).json({ error: "failed to fetch file" });
  }
});

// --- Team turnaround ---
// When our team will have confirmed an estimate submitted at `from` (ms since
// epoch; defaults to now). TEAM_SLA_HOURS sets the promise (default 24).
const TEAM_SLA_HOURS = Number(process.env.TEAM_SLA_HOURS) || 24;

app.get("/api/team/eta", authMiddleware, (req: any, res) => {
  const from = Number(req.query.from);
  const start = Number.isFinite(from) && from > 0 ? from : Date.now();
  const eta = new Date(start + TEAM_SLA_HOURS * 60 * 60 * 1000);
  // Promise a whole hour ("tomorrow, 6 PM"), rounding up.
  if (eta.getMinutes() || eta.getSeconds() || eta.getMilliseconds()) {
    eta.setMinutes(60, 0, 0);
  }
  res.json({ eta: eta.toISOString(), slaHours: TEAM_SLA_HOURS });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AI Tax Filing API running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOAD_DIR}`);
});
