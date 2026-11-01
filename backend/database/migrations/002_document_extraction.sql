-- Migration 002: text extraction results on documents
--
-- Each uploaded document gets its text pulled out after upload:
--   * digital PDFs  -> text layer read directly   (method 'pdf_text')
--   * photos        -> Tesseract OCR              (method 'ocr_image')
--   * scanned PDFs  -> pages rendered, then OCR   (method 'ocr_pdf')
-- The raw text is stored here; turning it into tax figures is a later step.
--
-- Idempotent: safe to run more than once. Apply AFTER 001.

BEGIN;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_status     VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_method     VARCHAR(20);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text        TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(5,2);  -- OCR mean confidence 0-100; NULL for pdf_text (exact)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_pages      INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extraction_error      TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_at          TIMESTAMP;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_extraction_status;
ALTER TABLE documents ADD  CONSTRAINT chk_documents_extraction_status CHECK (extraction_status IN (
  'pending',        -- uploaded, not started
  'processing',     -- extraction running
  'done',
  'needs_password', -- encrypted PDF; user must supply the password
  'failed'
));

ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_extraction_method;
ALTER TABLE documents ADD  CONSTRAINT chk_documents_extraction_method CHECK (
  extraction_method IS NULL OR extraction_method IN ('pdf_text', 'ocr_image', 'ocr_pdf')
);

CREATE INDEX IF NOT EXISTS idx_documents_extraction_status ON documents(extraction_status);

COMMIT;
