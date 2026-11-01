// Text extraction from uploaded documents.
//
//   digital PDF  -> read the text layer directly (exact, free)
//   photo        -> clean up with sharp, then Tesseract OCR
//   scanned PDF  -> render each page to PNG, then Tesseract OCR
//   locked PDF   -> NeedsPasswordError until the user supplies the password
//
// Only raw text comes out of here. Turning text into tax figures is a later step.

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createWorker, Worker } from "tesseract.js";
import { pdfToPng } from "pdf-to-png-converter";
import { getDocument, VerbosityLevel } from "pdfjs-dist/legacy/build/pdf.mjs";

export type ExtractionMethod = "pdf_text" | "ocr_image" | "ocr_pdf";

export interface ExtractionResult {
  method: ExtractionMethod;
  text: string;
  confidence: number | null; // mean OCR confidence 0-100; null when read from the text layer
  pages: number;
}

export class NeedsPasswordError extends Error {
  constructor(message = "PDF is password-protected") {
    super(message);
    this.name = "NeedsPasswordError";
  }
}

// A PDF with fewer text characters per page than this is treated as a scan.
const MIN_TEXT_CHARS_PER_PAGE = 50;
// Upper bound on pages we OCR from one PDF, to keep a single upload from tying up the worker.
const MAX_OCR_PAGES = 20;
// pdf.js renders at 72 dpi; 4x is ~300 dpi, which is what Tesseract is tuned for.
const PDF_RENDER_SCALE = 4;
// Photos narrower than this are upscaled before OCR.
const MIN_OCR_WIDTH = 1800;

// Trained language data is downloaded on first use and cached here.
const TESSERACT_CACHE = path.join(__dirname, "..", ".tesseract-cache");

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    if (!fs.existsSync(TESSERACT_CACHE)) fs.mkdirSync(TESSERACT_CACHE);
    workerPromise = createWorker("eng", 1, { cachePath: TESSERACT_CACHE }).catch((err) => {
      workerPromise = null; // allow a retry on the next document
      throw err;
    });
  }
  return workerPromise;
}

// Phone photos: honour EXIF rotation, go greyscale, stretch contrast, upscale small images.
async function prepareImage(input: Buffer): Promise<Buffer> {
  const img = sharp(input).rotate().grayscale().normalize();
  const { width } = await img.metadata();
  if (width && width < MIN_OCR_WIDTH) img.resize({ width: MIN_OCR_WIDTH });
  return img.sharpen().png().toBuffer();
}

async function ocr(image: Buffer): Promise<{ text: string; confidence: number }> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return { text: data.text, confidence: data.confidence };
}

function isPasswordError(err: unknown): boolean {
  const e = err as { name?: string; message?: string };
  return e?.name === "PasswordException" || /password/i.test(e?.message || "");
}

// Reads the PDF's text layer page by page. Returns empty text for a scan.
async function readTextLayer(file: Buffer, password?: string): Promise<{ text: string; pages: number }> {
  const task = getDocument({
    data: new Uint8Array(file),
    password,
    verbosity: VerbosityLevel.ERRORS,
  });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      pages.push(doc.numPages > 1 ? `--- Page ${n} ---\n${text}` : text);
    }
    return { text: pages.join("\n\n"), pages: doc.numPages };
  } finally {
    await task.destroy();
  }
}

async function extractPdf(file: Buffer, password?: string): Promise<ExtractionResult> {
  // 1. Try the text layer.
  try {
    const layer = await readTextLayer(file, password);
    const chars = layer.text.replace(/--- Page \d+ ---|\s/g, "").length;
    if (chars >= MIN_TEXT_CHARS_PER_PAGE * Math.max(layer.pages, 1)) {
      return { method: "pdf_text", text: layer.text, confidence: null, pages: layer.pages };
    }
  } catch (err) {
    if (isPasswordError(err)) throw new NeedsPasswordError(password ? "Wrong PDF password" : undefined);
    // Anything else (damaged file): fall through and let rendering try.
  }

  // 2. Scanned (or locked) PDF: render pages and OCR them.
  let pages;
  try {
    pages = await pdfToPng(file, {
      viewportScale: PDF_RENDER_SCALE,
      pdfFilePassword: password,
      pagesToProcess: Array.from({ length: MAX_OCR_PAGES }, (_, i) => i + 1),
    });
  } catch (err) {
    if (isPasswordError(err)) throw new NeedsPasswordError(password ? "Wrong PDF password" : undefined);
    throw err;
  }

  const texts: string[] = [];
  const confidences: number[] = [];
  for (const page of pages) {
    if (!page.content) continue;
    const prepared = await sharp(page.content).grayscale().normalize().png().toBuffer();
    const result = await ocr(prepared);
    texts.push(`--- Page ${page.pageNumber} ---\n${result.text.trim()}`);
    confidences.push(result.confidence);
  }

  return {
    method: "ocr_pdf",
    text: texts.join("\n\n"),
    confidence: confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
    pages: pages.length,
  };
}

export async function extractText(
  filePath: string,
  mimeType: string,
  password?: string
): Promise<ExtractionResult> {
  const file = await fs.promises.readFile(filePath);

  if (mimeType === "application/pdf") {
    return extractPdf(file, password);
  }

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const result = await ocr(await prepareImage(file));
    return { method: "ocr_image", text: result.text.trim(), confidence: result.confidence, pages: 1 };
  }

  throw new Error(`unsupported file type: ${mimeType}`);
}
