-- Migration 001: cases, roles, document typing, notes, audit log
--
-- Extends the baseline schema (schema.sql) with:
--   * user profile fields (CNIC, phone) and a role
--   * tax_cases: the central entity, one per user per tax year, with a status flow
--   * document typing and a link to a case (fixes documentType being dropped on upload)
--   * case_notes: the user's free-text box ("sold car for X", etc.)
--   * case_audit_log: a record of every status change / action on a case
--
-- Idempotent: safe to run more than once. Apply AFTER schema.sql.

BEGIN;

-- 1. Users: profile fields + role -------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnic  VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role  VARCHAR(20) NOT NULL DEFAULT 'user';

-- CNIC unique when present (multiple NULLs allowed while profiles are incomplete).
-- Stored as up to 15 chars to allow the formatted 12345-1234567-1 form.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cnic ON users(cnic) WHERE cnic IS NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD  CONSTRAINT chk_users_role CHECK (role IN ('user', 'reviewer', 'admin'));

-- 2. Tax cases: one per user per tax year -----------------------------------
CREATE TABLE IF NOT EXISTS tax_cases (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_year    INTEGER NOT NULL,                 -- Pakistani tax year, named by its ending year
  status      VARCHAR(30) NOT NULL DEFAULT 'draft',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- reviewer/admin handling the case
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_case_user_year UNIQUE (user_id, tax_year),
  CONSTRAINT chk_case_status CHECK (status IN (
    'draft',             -- user is still assembling documents
    'submitted',         -- user handed it to us
    'ai_processing',     -- AI extraction/analysis running
    'in_review',         -- admin reviewing the AI draft
    'needs_info',        -- waiting on the user for more documents/answers
    'sent_to_user',      -- final draft sent to the user for approval
    'user_approved',     -- user signed off
    'changes_requested', -- user asked for changes
    'filing',            -- being filed on IRIS
    'filed'              -- done, FBR acknowledgment saved
  ))
);
CREATE INDEX IF NOT EXISTS idx_tax_cases_user_id     ON tax_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_cases_status      ON tax_cases(status);
CREATE INDEX IF NOT EXISTS idx_tax_cases_assigned_to ON tax_cases(assigned_to);

-- Reuse the baseline updated_at trigger function.
DROP TRIGGER IF EXISTS update_tax_cases_updated_at ON tax_cases;
CREATE TRIGGER update_tax_cases_updated_at BEFORE UPDATE ON tax_cases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Documents: type + link to a case ---------------------------------------
ALTER TABLE documents ADD COLUMN IF NOT EXISTS case_id  INTEGER REFERENCES tax_cases(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type VARCHAR(30) NOT NULL DEFAULT 'other';

ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_doc_type;
ALTER TABLE documents ADD  CONSTRAINT chk_documents_doc_type CHECK (doc_type IN (
  'salary_slip',        -- monthly slip
  'salary_certificate', -- employer's annual salary & tax-deduction certificate
  'bank_statement',
  'bank_certificate',   -- bank's annual withholding-tax / profit certificate
  'tax_certificate',    -- other withholding certificates (SMS/utility/etc.)
  'prior_return',       -- last year's filed return
  'wealth_statement',
  'other'
));
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);

-- 4. Free-text notes (the user's "I sold X for Y" box) ----------------------
CREATE TABLE IF NOT EXISTS case_notes (
  id         SERIAL PRIMARY KEY,
  case_id    INTEGER NOT NULL REFERENCES tax_cases(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);

-- 5. Audit log: every status change / action on a case ----------------------
CREATE TABLE IF NOT EXISTS case_audit_log (
  id          SERIAL PRIMARY KEY,
  case_id     INTEGER NOT NULL REFERENCES tax_cases(id) ON DELETE CASCADE,
  actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- who did it (null = system)
  action      VARCHAR(50) NOT NULL,            -- e.g. 'status_change', 'note_added', 'document_uploaded'
  from_status VARCHAR(30),
  to_status   VARCHAR(30),
  detail      JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_case_audit_log_case_id ON case_audit_log(case_id);

COMMIT;
