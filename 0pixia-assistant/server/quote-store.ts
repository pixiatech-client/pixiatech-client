import fs from 'node:fs';
import path from 'node:path';
import type { QuoteRecord } from '../src/core/types.ts';

export interface QuoteRepository {
  saveQuote(quote: QuoteRecord): Promise<void>;
  getQuote(id: string): Promise<QuoteRecord | null>;
  updateQuotePdf(id: string, pdfUrl: string): Promise<QuoteRecord | null>;
  markEmailVerified(id: string): Promise<QuoteRecord | null>;
  savePdfBytes(id: string, bytes: Buffer): Promise<string>;
  readPdfBytes(id: string): Promise<Buffer | null>;
}

const DATA_ROOT = path.resolve(process.cwd(), '.data');
const QUOTES_FILE = path.resolve(DATA_ROOT, 'quotes.json');
const PDF_DIR = path.resolve(DATA_ROOT, 'pdfs');

function ensureStorageDirs(): void {
  if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
}

function sanitizeId(raw: string): string | null {
  return /^[a-zA-Z0-9_-]{6,64}$/.test(raw) ? raw : null;
}

class LocalJsonQuoteRepository implements QuoteRepository {
  private quotes = new Map<string, QuoteRecord>();

  constructor() {
    ensureStorageDirs();
    if (fs.existsSync(QUOTES_FILE)) {
      try {
        const raw = fs.readFileSync(QUOTES_FILE, 'utf8');
        const parsed = JSON.parse(raw) as QuoteRecord[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) this.quotes.set(item.id, item);
          }
        }
      } catch {
        // Ignore malformed local cache
      }
    }
  }

  private flush(): void {
    ensureStorageDirs();
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(Array.from(this.quotes.values()), null, 2), 'utf8');
  }

  async saveQuote(quote: QuoteRecord): Promise<void> {
    this.quotes.set(quote.id, quote);
    this.flush();
  }

  async getQuote(id: string): Promise<QuoteRecord | null> {
    const safeId = sanitizeId(id);
    if (!safeId) return null;
    return this.quotes.get(safeId) ?? null;
  }

  async updateQuotePdf(id: string, pdfUrl: string): Promise<QuoteRecord | null> {
    const existing = await this.getQuote(id);
    if (!existing) return null;
    const updated: QuoteRecord = { ...existing, pdfUrl };
    this.quotes.set(existing.id, updated);
    this.flush();
    return updated;
  }

  async markEmailVerified(id: string): Promise<QuoteRecord | null> {
    const existing = await this.getQuote(id);
    if (!existing) return null;
    const updated: QuoteRecord = {
      ...existing,
      emailVerified: true,
      status: 'verified',
    };
    this.quotes.set(existing.id, updated);
    this.flush();
    return updated;
  }

  async savePdfBytes(id: string, bytes: Buffer): Promise<string> {
    const safeId = sanitizeId(id);
    if (!safeId) throw new Error('Invalid quote id');
    ensureStorageDirs();
    const targetPath = path.resolve(PDF_DIR, `${safeId}.pdf`);
    if (!targetPath.startsWith(PDF_DIR + path.sep)) {
      throw new Error('Invalid storage path');
    }
    fs.writeFileSync(targetPath, bytes);
    return `/api/pixia/quotes/${safeId}/pdf`;
  }

  async readPdfBytes(id: string): Promise<Buffer | null> {
    const safeId = sanitizeId(id);
    if (!safeId) return null;
    const targetPath = path.resolve(PDF_DIR, `${safeId}.pdf`);
    if (!targetPath.startsWith(PDF_DIR + path.sep)) return null;
    if (!fs.existsSync(targetPath)) return null;
    return fs.readFileSync(targetPath);
  }
}

export const quoteStore: QuoteRepository = new LocalJsonQuoteRepository();
