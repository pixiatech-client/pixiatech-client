'use client';

import React from 'react';
import { Mail, Phone, MapPin, FileText, Info, User, Heart } from 'lucide-react';
import { format } from 'date-fns';
import type { PdfSettings } from '@/lib/types';

const THEMES = [
  { id: 'indigo', primary: '#4f46e5', secondary: '#7c3aed', gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#1e1b4b' },
  { id: 'emerald', primary: '#10b981', secondary: '#059669', gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', text: '#064e3b' },
  { id: 'rose', primary: '#f43f5e', secondary: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', text: '#4c0519' },
  { id: 'amber', primary: '#f59e0b', secondary: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', text: '#451a03' },
  { id: 'slate', primary: '#475569', secondary: '#1e293b', gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', text: '#0f172a' },
  { id: 'electric', primary: '#8b5cf6', secondary: '#d946ef', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', text: '#2e1065' },
  { id: 'ocean', primary: '#0ea5e9', secondary: '#2563eb', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', text: '#0c4a6e' },
  { id: 'crimson', primary: '#991b1b', secondary: '#b91c1c', gradient: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)', text: '#450a0a' },
  { id: 'gold', primary: '#d97706', secondary: '#92400e', gradient: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)', text: '#451a03' },
  { id: 'midnight', primary: '#0f172a', secondary: '#000000', gradient: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)', text: '#020617' },
];

const fmt = (n: number) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' €';
};

interface InvoiceProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderInvoicePDFProps {
  id: string;
  settings: PdfSettings;
  invoiceNumber: string;
  createdAt: string;
  type: 'sale' | 'rental';
  rentalStartDate?: string;
  rentalEndDate?: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPostcode?: string;
  customerCity?: string;
  products: InvoiceProduct[];
  subtotal: number;
  vat: number;
  vatRate: number;
  totalTtc: number;
}

export function OrderInvoicePDF({ id, settings, invoiceNumber, createdAt, type, rentalStartDate, rentalEndDate, customerName, customerEmail, customerAddress, customerPostcode, customerCity, products, subtotal, vat, vatRate, totalTtc }: OrderInvoicePDFProps) {
  if (!settings) return null;

  const currentTheme = THEMES.find(t => t.id === settings.themeId) || THEMES[0];

  return (
    <div id={id} className="document-shadow relative overflow-hidden">
      <div
        className="page-break-after relative bg-white"
        style={{
          width: '820px',
          height: '1160px',
          backgroundColor: settings.bgColor || '#ffffff',
          backgroundImage: settings.backgroundUrl ? `url(${settings.backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ background: currentTheme.gradient }} />
        <div className="absolute inset-0 flex flex-col p-10 gap-4 text-[10.5px] left-[5px]">
          {/* Header */}
          <div className="flex gap-10 items-start">
            <div className="flex-1 flex items-center gap-6">
              <div className="w-[80px] h-[80px] flex items-center justify-center relative">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span style={{ fontSize: '1.7em', fontWeight: 900, color: currentTheme.text }}>{settings.companyName || 'PIXIATECH'}</span>
                <span style={{ fontSize: '0.9em', fontWeight: 600, color: currentTheme.primary }} className="mb-1">Solutions Digitales</span>
                <div className="flex flex-col gap-0.5 text-gray-400 mt-1">
                  <div className="flex items-center gap-1.5"><MapPin size={11} style={{ color: currentTheme.primary }} /><span>{settings.address || ''}</span></div>
                  <div className="flex items-center gap-1.5"><Phone size={11} style={{ color: currentTheme.primary }} /><span>{settings.phone || ''}</span></div>
                  <div className="flex items-center gap-1.5"><Mail size={11} style={{ color: currentTheme.primary }} /><span>{settings.email || ''}</span></div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-4 pt-2 pb-1">
              <span style={{ fontSize: '3.8em', fontWeight: 900, textAlign: 'right', color: currentTheme.text, lineHeight: 1, letterSpacing: '-0.05em' }}>
                FACTURE
              </span>
              <div className="flex gap-2">
                <div className="border border-gray-200 rounded-lg p-2 text-center min-w-[6.5em] bg-[#fafafa]">
                  <div className="uppercase text-[0.72em] text-gray-400 font-bold tracking-wider mb-0.5">N°</div>
                  <span style={{ fontSize: '0.88em', fontWeight: 700, color: '#1f2937' }}>INV-{invoiceNumber}</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-2 text-center min-w-[6.5em] bg-[#fafafa]">
                  <div className="uppercase text-[0.72em] text-gray-400 font-bold tracking-wider mb-0.5">Date</div>
                  <span style={{ fontSize: '0.88em', fontWeight: 700, color: '#1f2937' }}>{createdAt ? format(new Date(createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                </div>
                <div className="border border-gray-200 rounded-lg p-2 text-center min-w-[6.5em] bg-[#fafafa]">
                  <div className="uppercase text-[0.72em] text-gray-400 font-bold tracking-wider mb-0.5">Type</div>
                  <span style={{ fontSize: '0.88em', fontWeight: 700, color: '#1f2937' }}>{type === 'rental' ? 'Location' : 'Vente'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-[#f8f9fc] border border-[#eef0f8] rounded-2xl p-5 flex gap-5 items-start mt-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary }}>
              <User size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex flex-col items-start text-left gap-0">
              <span className="uppercase text-[0.72em] text-gray-400 font-black tracking-[0.1em] text-left w-full">Client</span>
              <span style={{ fontSize: '1.6em', fontWeight: 900, color: currentTheme.text, letterSpacing: '-0.02em', marginBottom: '1px' }} className="text-left w-full">{customerName}</span>
              <div className="flex flex-col items-start text-left gap-1 mt-1 w-full">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={12} className="shrink-0" style={{ color: currentTheme.primary }} />
                  <span style={{ fontWeight: 500, fontSize: '0.95em' }}>{customerAddress || 'Adresse non fournie'}{customerCity ? `, ${customerPostcode || ''} ${customerCity}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={12} className="shrink-0" style={{ color: currentTheme.primary }} />
                  <span style={{ fontWeight: 500, fontSize: '0.95em' }}>{customerEmail || 'Email non fourni'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 flex flex-col mt-4">
            <div
              className="grid grid-cols-[3em_1fr_4em_8em_9em] border-b-2 py-2 px-2 font-black text-[0.75em] uppercase tracking-[0.15em]"
              style={{ borderColor: currentTheme.primary, color: currentTheme.text }}
            >
              <span>#</span>
              <span>Description</span>
              <span className="text-right">Qté</span>
              <span className="text-right">Prix unit. HT</span>
              <span className="text-right">Total HT</span>
            </div>
            {products.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[3em_1fr_4em_8em_9em] items-start py-3 px-2 border-b border-gray-100"
              >
                <span
                  className="text-[0.78em] font-black inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5"
                  style={{ color: currentTheme.primary, backgroundColor: `${currentTheme.primary}15` }}
                >{(idx + 1).toString().padStart(2, '0')}</span>
                <div className="flex flex-col pr-6">
                  <span style={{ fontSize: '1.1em', fontWeight: 800, color: '#1e293b', marginBottom: '2px' }}>{item.name}</span>
                </div>
                <span style={{ textAlign: 'right', fontWeight: 900, color: '#1e293b', fontSize: '1.1em' }}>{item.quantity}</span>
                <div className="flex flex-col items-end">
                  <span style={{ textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: '1em' }}>{fmt(item.unitPrice).replace(' €', '')}</span>
                  <span className="text-[0.65em] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">EUR</span>
                </div>
                <div className="text-right">
                  <span className="text-[1.2em] font-black tracking-tight" style={{ color: currentTheme.text }}>
                    {fmt(item.lineTotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rental period */}
          {type === 'rental' && rentalStartDate && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-5 py-3 mt-2 flex items-center gap-3 text-[0.72em]">
              <span className="font-black uppercase tracking-wider text-amber-700 shrink-0">Période de location :</span>
              <span className="font-semibold text-amber-900">
                {format(new Date(rentalStartDate), 'dd/MM/yyyy')} → {rentalEndDate ? format(new Date(rentalEndDate), 'dd/MM/yyyy') : '—'}
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-[320px] border border-slate-100 shadow-sm rounded-2xl p-8 bg-white">
              <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-orange-100">
                <FileText size={14} className="text-orange-500" />
                <span className="text-[0.75em] font-black uppercase tracking-widest text-slate-800">RÉCAPITULATIF</span>
              </div>
              <div className="flex flex-col gap-4 mt-4 px-1">
                <div className="flex justify-between items-center text-[0.78em]">
                  <span className="text-slate-500 font-medium">Sous-total HT</span>
                  <span style={{ fontWeight: 800, textAlign: 'right', color: '#0f172a' }}>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[0.78em]">
                  <span className="text-slate-500 font-medium">TVA ({vatRate}%)</span>
                  <span style={{ fontWeight: 800, textAlign: 'right', color: '#0f172a' }}>{fmt(vat)}</span>
                </div>
              </div>
              <div className="mt-6 rounded-xl p-5 flex justify-between items-center text-white shadow-md mx-[-2px]" style={{ background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}dd 100%)` }}>
                <div className="flex flex-col">
                  <span className="text-[0.65em] font-black uppercase tracking-widest opacity-90">TOTAL TTC</span>
                </div>
                <span style={{ fontSize: '1.6em', fontWeight: 900, textAlign: 'right', color: 'white', letterSpacing: '-0.04em' }}>{fmt(totalTtc)}</span>
              </div>
            </div>
          </div>

          {/* Legal / Notes */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-[0.78em] uppercase tracking-widest" style={{ color: currentTheme.primary }}>
                <Info size={14} className="stroke-[3]" />
                <span>Information</span>
              </div>
              <div style={{ fontSize: '0.85em', color: '#64748b', lineHeight: '1.4', fontWeight: 500 }}>
                {settings.siret && <p>SIRET : {settings.siret}</p>}
                {settings.capital && <p>Capital : {settings.capital}</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-[0.78em] uppercase tracking-widest" style={{ color: currentTheme.primary }}>
                <FileText size={14} className="stroke-[3]" />
                <span>Conditions de paiement</span>
              </div>
              <div style={{ fontSize: '0.85em', color: '#64748b', lineHeight: '1.4', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {settings.termsAndConditions || '50% à la commande, 50% à la livraison.\nPaiement par virement bancaire uniquement.\nTVA applicable selon la législation en vigueur.'}
              </div>
            </div>
          </div>

          {/* Footer badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              { icon: Heart, text: 'Équipement professionnel de haute qualité', iconColor: '#10b981' },
              { icon: Heart, text: 'Accompagnement personnalisé', iconColor: '#3b82f6' },
              { icon: Heart, text: 'Installation sécurisée', iconColor: '#f59e0b' }
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f1f5f9] shadow-sm">
                <badge.icon size={14} style={{ color: badge.iconColor }} strokeWidth={3} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
