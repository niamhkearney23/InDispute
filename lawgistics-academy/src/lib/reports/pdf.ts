import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import { brand, DEFAULT_ACCENT } from '@/lib/brand';

/**
 * Branded PDFs for the firm's reports and certificates: the firm's name and
 * colour across the top, its logo when it is a PNG or JPEG, and a footer on
 * every page saying what the document is and when it was made.
 *
 * The built-in PDF fonts are used, so nothing is downloaded to make a file.
 * They cover Western European letters only, so any other character in a
 * name is written as its closest plain letter where there is one, and as a
 * question mark where there is not; the CSV of the same report keeps every
 * character as typed.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const INK = rgb(0.09, 0.11, 0.17);
const MUTED = rgb(0.36, 0.38, 0.44);
const RULE = rgb(0.85, 0.84, 0.8);
const PAPER = rgb(1, 0.99, 0.97);
export const ACCENT = hexToRgb(brand.accent ?? DEFAULT_ACCENT);

/** Text the built-in fonts can draw. */
export function pdfText(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
}

/** Words fitted to a width, line by line. */
export function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of pdfText(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function logoImage(doc: PDFDocument): Promise<PDFImage | null> {
  const src = brand.logo;
  if (!src) return null;
  try {
    let bytes: Uint8Array;
    if (src.startsWith('/')) {
      bytes = await fs.readFile(path.join(process.cwd(), 'public', path.normalize(src).replace(/^(\.\.[/\\])+/, '')));
    } else {
      const res = await fetch(src, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      bytes = new Uint8Array(await res.arrayBuffer());
    }
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
    if (isPng) return await doc.embedPng(bytes);
    if (isJpg) return await doc.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

export interface Column {
  label: string;
  /** Share of the page's width, the shares adding to 1. */
  share: number;
  align?: 'left' | 'right';
}

/**
 * A branded report: a title, a line saying what it covers, then sections of
 * text and tables. Pages are added as the content needs them.
 */
export class Report {
  private constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
    private logo: PDFImage | null,
    private title: string,
    private page: PDFPage,
    private y: number,
  ) {}

  static async start(title: string, subtitle: string): Promise<Report> {
    const doc = await PDFDocument.create();
    doc.setTitle(pdfText(`${title} - ${brand.fullName}`));
    doc.setAuthor(pdfText(brand.fullName));
    doc.setProducer(pdfText(brand.fullName));
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const logo = await logoImage(doc);
    const report = new Report(doc, regular, bold, logo, title, doc.addPage(A4), 0);
    report.header(subtitle);
    return report;
  }

  private header(subtitle?: string) {
    const [w, h] = A4;
    this.page.drawRectangle({ x: 0, y: h - 92, width: w, height: 92, color: ACCENT });
    let x = MARGIN;
    if (this.logo) {
      const scale = 36 / this.logo.height;
      this.page.drawImage(this.logo, { x, y: h - 64, width: this.logo.width * scale, height: 36 });
      x += this.logo.width * scale + 12;
    }
    this.page.drawText(pdfText(brand.fullName).toUpperCase(), {
      x,
      y: h - 40,
      size: 9,
      font: this.bold,
      color: PAPER,
    });
    this.page.drawText(pdfText(this.title), { x, y: h - 66, size: 20, font: this.bold, color: PAPER });
    this.y = h - 92 - 28;
    if (subtitle) this.paragraph(subtitle, { size: 10, color: MUTED });
  }

  private ensure(height: number) {
    if (this.y - height >= MARGIN + 24) return;
    this.page = this.doc.addPage(A4);
    this.header();
  }

  heading(text: string) {
    this.ensure(40);
    this.y -= 8;
    this.page.drawText(pdfText(text), { x: MARGIN, y: this.y - 14, size: 13, font: this.bold, color: INK });
    this.y -= 26;
  }

  paragraph(text: string, opts: { size?: number; color?: RGB } = {}) {
    const size = opts.size ?? 10;
    for (const line of wrap(text, this.regular, size, A4[0] - MARGIN * 2)) {
      this.ensure(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y - size, size, font: this.regular, color: opts.color ?? INK });
      this.y -= size + 4;
    }
    this.y -= 6;
  }

  table(columns: Column[], rows: Array<Array<string | number>>) {
    const width = A4[0] - MARGIN * 2;
    const size = 8.5;
    const xs: number[] = [];
    let acc = MARGIN;
    for (const c of columns) {
      xs.push(acc);
      acc += c.share * width;
    }
    const drawRow = (cells: Array<string | number>, font: PDFFont, color: RGB) => {
      const wrapped = cells.map((cell, i) => wrap(String(cell), font, size, columns[i].share * width - 6));
      const lines = Math.max(...wrapped.map((l) => l.length));
      const height = lines * (size + 3) + 8;
      return { wrapped, height, font, color };
    };
    const paint = (row: ReturnType<typeof drawRow>) => {
      row.wrapped.forEach((lines, i) => {
        lines.forEach((line, j) => {
          const w = row.font.widthOfTextAtSize(line, size);
          const x = columns[i].align === 'right' ? xs[i] + columns[i].share * width - 6 - w : xs[i];
          this.page.drawText(line, { x, y: this.y - 4 - size - j * (size + 3), size, font: row.font, color: row.color });
        });
      });
      this.y -= row.height;
      this.page.drawLine({
        start: { x: MARGIN, y: this.y },
        end: { x: MARGIN + width, y: this.y },
        thickness: 0.5,
        color: RULE,
      });
    };
    const head = drawRow(columns.map((c) => c.label.toUpperCase()), this.bold, MUTED);
    this.ensure(head.height * 2);
    paint(head);
    for (const cells of rows) {
      const row = drawRow(cells, this.regular, INK);
      if (this.y - row.height < MARGIN + 24) {
        this.ensure(Infinity);
        paint(head);
      }
      paint(row);
    }
    this.y -= 14;
  }

  async finish(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const made = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    pages.forEach((p, i) => {
      p.drawText(pdfText(`${brand.fullName} · ${this.title} · made ${made} · page ${i + 1} of ${pages.length}`), {
        x: MARGIN,
        y: MARGIN - 18,
        size: 7.5,
        font: this.regular,
        color: MUTED,
      });
    });
    return this.doc.save();
  }
}

export interface CertificateText {
  name: string;
  body: string;
  modules: string[];
  issued: string;
}

/** A learner's certificate of completion, A4 landscape, in the firm's colour. */
export async function certificatePdf(c: CertificateText): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(pdfText(`Certificate of completion - ${c.name}`));
  doc.setAuthor(pdfText(brand.fullName));
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await logoImage(doc);
  const [w, h] = [A4[1], A4[0]];
  const page = doc.addPage([w, h]);
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: PAPER });
  page.drawRectangle({ x: 22, y: 22, width: w - 44, height: h - 44, borderColor: ACCENT, borderWidth: 3 });
  page.drawRectangle({ x: 30, y: 30, width: w - 60, height: h - 60, borderColor: ACCENT, borderWidth: 0.8 });

  const centre = (text: string, y: number, size: number, font: PDFFont, color: RGB = INK) => {
    const t = pdfText(text);
    page.drawText(t, { x: (w - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });
  };

  let y = h - 92;
  if (logo) {
    const scale = 40 / logo.height;
    page.drawImage(logo, { x: (w - logo.width * scale) / 2, y: y - 6, width: logo.width * scale, height: 40 });
    y -= 54;
  }
  centre(pdfText(brand.fullName).toUpperCase(), y, 10, sansBold, ACCENT);
  centre('Certificate of completion', y - 52, 34, serifBold);
  centre('This is to record that', y - 96, 12, sans, MUTED);
  centre(c.name, y - 138, 28, serif);
  let line = y - 176;
  for (const l of wrap(c.body, sans, 12, 520)) {
    centre(l, line, 12, sans, MUTED);
    line -= 17;
  }
  line -= 8;
  for (const l of wrap(c.modules.join('   ·   '), sans, 9.5, 600)) {
    centre(l, line, 9.5, sansBold, ACCENT);
    line -= 14;
  }
  centre(`Issued ${c.issued}`, 92, 14, serif);
  centre(
    `A training record from ${brand.fullName}. It is not a professional qualification, practising certificate or admission.`,
    58,
    8,
    sans,
    MUTED,
  );
  return doc.save();
}

/** The headers a downloaded PDF or CSV is served with: never cached, always a download. */
export function downloadHeaders(fileName: string, type: string): HeadersInit {
  return {
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
