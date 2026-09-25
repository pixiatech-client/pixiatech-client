export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { notation: value >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${String(m % 60).padStart(2, '0')}`;
  }
  return m > 0 ? `${m}m${String(r).padStart(2, '0')}s` : `${s}s`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** Variation en % entre valeur précédente et actuelle (null si non comparable). */
export function deltaPct(previous: number | undefined, current: number | undefined): number | null {
  const p = Number(previous ?? 0);
  const c = Number(current ?? 0);
  if (p <= 0 && c <= 0) return null;
  if (p <= 0) return null;
  return (c - p) / p;
}

/** Remplit les jours manquants d'une série quotidienne (UTC). */
export function fillDays(
  byDay: Record<string, { sessions: number; unique: number; pageViews: number; productViews: number }>,
  from: number,
  to: number
): { day: string; sessions: number; unique: number; pageViews: number; productViews: number }[] {
  const out: { day: string; sessions: number; unique: number; pageViews: number; productViews: number }[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  const guard = 460;
  for (let i = 0; i < guard; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const e = byDay[key] ?? { sessions: 0, unique: 0, pageViews: 0, productViews: 0 };
    out.push({ day: key, ...e });
    if (cursor.getTime() >= end.getTime()) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function topEntries(map: Record<string, number>, n = 8): { key: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function downloadCsv(filename: string, header: string[], rows: unknown[][]): void {
  const body = rows.map((r) => r.map(csvCell).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${header.join(';')}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

let pdfModule: Promise<typeof import('jspdf')> | null = null;
function loadPdf(): Promise<typeof import('jspdf')> {
  if (!pdfModule) pdfModule = import('jspdf');
  return pdfModule;
}

export interface PdfReportData {
  title: string;
  rangeLabel: string;
  generatedAt: string;
  kpis: { label: string; value: string }[];
  products: { name: string; slug: string; views: number; clicks: number }[];
  pages: { path: string; views: number; uniques: number; exits: number }[];
  sources: { key: string; visits: number }[];
}

/** Génère un rapport PDF simple (jspdf) à partir des agrégats actuels. */
export async function downloadPdf(data: PdfReportData): Promise<void> {
  const { jsPDF } = await loadPdf();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 56;
  const M = 48;

  doc.setFillColor(10, 13, 14);
  doc.rect(0, 0, pageW, 96, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(data.title, M, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(190, 195, 196);
  doc.text(`${data.rangeLabel} — généré le ${data.generatedAt}`, M, 74);

  doc.setTextColor(30, 34, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  y = 124;
  doc.text('Indicateurs', M, y);
  y += 20;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  data.kpis.forEach((k, i) => {
    if (i > 0 && i % 4 === 0) {
      y += 22;
    }
    const x = M + (i % 4) * 140;
    doc.setTextColor(120, 125, 126);
    doc.text(k.label, x, y);
    doc.setTextColor(20, 24, 25);
    doc.setFont('helvetica', 'bold');
    doc.text(k.value, x, y + 15);
    doc.setFont('helvetica', 'normal');
    if (i === data.kpis.length - 1) y += 38;
  });
  y += 6;

  doc.setTextColor(30, 34, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Produits les plus consultés', M, y);
  y += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 114, 115);
  doc.text('Produit', M, y);
  doc.text('Vues', pageW - M - 180, y);
  doc.text('Clics', pageW - M - 90, y);
  y += 6;
  doc.setDrawColor(230, 232, 233);
  doc.line(M, y, pageW - M, y);
  y += 18;
  doc.setTextColor(30, 34, 35);
  data.products.slice(0, 12).forEach((p) => {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    doc.text(p.name.slice(0, 44), M, y);
    doc.text(String(p.views), pageW - M - 180, y, { align: 'right' });
    doc.text(String(p.clicks), pageW - M - 90, y, { align: 'right' });
    y += 16;
  });

  doc.addPage();
  y = 60;
  doc.setTextColor(30, 34, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Sources de trafic', M, y);
  y += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 114, 115);
  doc.text('Source', M, y);
  doc.text('Visites', pageW - M - 90, y);
  y += 6;
  doc.setDrawColor(230, 232, 233);
  doc.line(M, y, pageW - M, y);
  y += 18;
  doc.setTextColor(30, 34, 35);
  data.sources.forEach((s) => {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    doc.text(s.key.slice(0, 40), M, y);
    doc.text(String(s.visits), pageW - M - 90, y, { align: 'right' });
    y += 16;
  });

  y += 12;
  doc.setTextColor(30, 34, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Pages les plus consultées', M, y);
  y += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 114, 115);
  doc.text('Page', M, y);
  doc.text('Vues', pageW - M - 200, y);
  doc.text('Visiteurs', pageW - M - 120, y);
  doc.text('Sorties', pageW - M - 40, y);
  y += 6;
  doc.setDrawColor(230, 232, 233);
  doc.line(M, y, pageW - M, y);
  y += 18;
  doc.setTextColor(30, 34, 35);
  data.pages.slice(0, 20).forEach((p) => {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    doc.text(p.path.slice(0, 52), M, y);
    doc.text(String(p.views), pageW - M - 200, y, { align: 'right' });
    doc.text(String(p.uniques), pageW - M - 120, y, { align: 'right' });
    doc.text(String(p.exits), pageW - M - 40, y, { align: 'right' });
    y += 16;
  });

  doc.save(`pixiatech_rapport_${Date.now()}.pdf`);
}