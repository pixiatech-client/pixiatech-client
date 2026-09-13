import {
  getDisputeStatusLabel,
  getInvoiceStatusLabel,
  getReasonLabel,
  isDisputeOpen,
} from '@/lib/client-status';

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const monthYearFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayHourFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatMoney(value: number): string {
  const v = Number(value) || 0;
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

export function formatDate(value?: string): string {
  const d = parseDate(value);
  return d ? monthFormatter.format(d) : '—';
}

export function formatShortDate(value?: string): string {
  const d = parseDate(value);
  return d ? shortFormatter.format(d) : '—';
}

export function formatMonthYear(value?: string): string {
  const d = parseDate(value);
  return d ? monthYearFormatter.format(d) : '';
}

export function formatHour(value?: string): string {
  const d = parseDate(value);
  return d ? dayHourFormatter.format(d) : '';
}

export function formatTime(value?: string): string {
  const d = parseDate(value);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatMoneyCompact(value: number): string {
  return `${(Number(value) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`;
}

export { getDisputeStatusLabel, getInvoiceStatusLabel, getReasonLabel, isDisputeOpen };