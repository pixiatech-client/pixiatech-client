'use client';
import React, { useState } from 'react';
import { 
  MapPin, Mail, Phone, MessageSquare, Clock, Copy, Check, 
  ExternalLink, Navigation, Sparkles, Building 
} from 'lucide-react';
import type { PageContentConfig } from '@/lib/site-web/types';
import { EditableText } from './EditableText';
import { CardSwitch, CardHiddenNotice } from './CardSwitch';

interface ContactInfoCardProps {
  content: PageContentConfig['info'];
  visibility: PageContentConfig['visibility'];
  isAdmin: boolean;
  onUpdateInfo: (patch: Partial<PageContentConfig['info']>) => void;
  onUpdateVisibility: (patch: Partial<PageContentConfig['visibility']>) => void;
}

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
  content,
  visibility,
  isAdmin,
  onUpdateInfo,
  onUpdateVisibility,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const email = content.emailValue || 'contact@pixiatech.com';
  const phone1 = content.phone1 || '+33 7 56 81 66 26';
  const phone2 = content.phone2 || '+33 7 71 59 31 66';
  const address = content.addressValue || '5 Rue la fontaine, 93400 Saint-Ouen-sur-Seine';
  const whatsappNumber = content.whatsappNumber || '+33756816626';

  if (!visibility.contactInfoCard && !isAdmin) {
    return null;
  }

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice if the entire column is hidden */}
      {isAdmin && !visibility.contactInfoCard && (
        <CardHiddenNotice
          title="Colonne de Coordonnées PixiaTech"
          onRestore={() => onUpdateVisibility({ contactInfoCard: true })}
        />
      )}

      {/* Admin general switch for the info column */}
      {isAdmin && (
        <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-gray-500 text-[11px]">
            Paramètres de la Colonne Coordonnées
          </span>
          <CardSwitch
            label="Colonne entière"
            checked={visibility.contactInfoCard}
            onChange={(val) => onUpdateVisibility({ contactInfoCard: val })}
            isAdmin={isAdmin}
            compact
          />
        </div>
      )}

      {/* 1. Signature Hero Black Card */}
      {(visibility.infoHqHeroCard || isAdmin) && (
        <div className={`relative overflow-hidden rounded-2xl bg-gray-900 text-white p-6 sm:p-8 shadow-xl transition-all duration-200 border border-gray-800 ${
          !visibility.infoHqHeroCard ? 'opacity-60 border-dashed border-amber-300' : ''
        }`}>
          {isAdmin && (
            <div className="mb-4 pb-2 border-b border-gray-800 flex justify-end">
              <CardSwitch
                label="Carte Showroom & Siège"
                checked={visibility.infoHqHeroCard}
                onChange={(val) => onUpdateVisibility({ infoHqHeroCard: val })}
                isAdmin={isAdmin}
                compact
              />
            </div>
          )}

          {/* Glow corner with lime accent */}
          <div 
            className="absolute -top-10 -right-10 w-44 h-44 bg-[#c6ff00]/15 rounded-full blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#c6ff00]">
                <Sparkles size={14} strokeWidth={1.5} className="text-[#c6ff00]" />
                <EditableText
                  as="span"
                  value={content.hqBadge}
                  onChange={(val) => onUpdateInfo({ hqBadge: val })}
                  isAdmin={isAdmin}
                  label="Badge Showroom"
                />
              </div>
              <EditableText
                as="span"
                value={content.hqLocation}
                onChange={(val) => onUpdateInfo({ hqLocation: val })}
                isAdmin={isAdmin}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400"
                label="Localisation"
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-tech">
              <EditableText
                as="span"
                value={content.hqTitle}
                onChange={(val) => onUpdateInfo({ hqTitle: val })}
                isAdmin={isAdmin}
                label="Titre Siège Social"
              />
            </h2>
            <div className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed">
              <EditableText
                as="p"
                multiline
                value={content.hqDesc}
                onChange={(val) => onUpdateInfo({ hqDesc: val })}
                isAdmin={isAdmin}
                label="Description Siège Social"
              />
            </div>

            {/* Quick specs pill grid */}
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <EditableText
                  as="div"
                  value={content.stat1Label}
                  onChange={(val) => onUpdateInfo({ stat1Label: val })}
                  isAdmin={isAdmin}
                  className="text-gray-400 text-[11px]"
                  label="Label Stat 1"
                />
                <EditableText
                  as="div"
                  value={content.stat1Value}
                  onChange={(val) => onUpdateInfo({ stat1Value: val })}
                  isAdmin={isAdmin}
                  className="font-bold text-white mt-0.5"
                  label="Valeur Stat 1"
                />
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <EditableText
                  as="div"
                  value={content.stat2Label}
                  onChange={(val) => onUpdateInfo({ stat2Label: val })}
                  isAdmin={isAdmin}
                  className="text-gray-400 text-[11px]"
                  label="Label Stat 2"
                />
                <EditableText
                  as="div"
                  value={content.stat2Value}
                  onChange={(val) => onUpdateInfo({ stat2Value: val })}
                  isAdmin={isAdmin}
                  className="font-bold text-[#c6ff00] mt-0.5"
                  label="Valeur Stat 2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Coordonnées directes card */}
      {(visibility.infoCoordinatesCard || isAdmin) && (
        <div className={`bg-white rounded-2xl border p-6 sm:p-7 shadow-sm transition-all duration-200 space-y-5 ${
          !visibility.infoCoordinatesCard 
            ? 'opacity-60 border-dashed border-amber-300' 
            : 'border-gray-100 hover:border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
              <Building size={16} strokeWidth={1.5} className="text-gray-700" />
              <EditableText
                as="span"
                value={content.coordsTitle}
                onChange={(val) => onUpdateInfo({ coordsTitle: val })}
                isAdmin={isAdmin}
                label="Titre des coordonnées"
              />
            </h3>

            {isAdmin && (
              <CardSwitch
                label="Carte Coordonnées"
                checked={visibility.infoCoordinatesCard}
                onChange={(val) => onUpdateVisibility({ infoCoordinatesCard: val })}
                isAdmin={isAdmin}
                compact
              />
            )}
          </div>

          {/* Address Row */}
          {(visibility.infoAddressRow || isAdmin) && (
            <div className={`flex items-start justify-between p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 transition-colors hover:border-gray-200 ${
              !visibility.infoAddressRow ? 'opacity-50' : ''
            }`}>
              <div className="flex items-start space-x-3 w-full">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-[#c6ff00]">
                  <MapPin size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <EditableText
                      as="div"
                      value={content.addressLabel}
                      onChange={(val) => onUpdateInfo({ addressLabel: val })}
                      isAdmin={isAdmin}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                      label="Libellé Adresse"
                    />
                    {isAdmin && (
                      <CardSwitch
                        label="Ligne Adresse"
                        checked={visibility.infoAddressRow}
                        onChange={(val) => onUpdateVisibility({ infoAddressRow: val })}
                        isAdmin={isAdmin}
                        compact
                      />
                    )}
                  </div>
                  <div className="mt-0.5 font-bold text-slate-900 text-sm">
                    <EditableText
                      as="div"
                      value={content.addressValue}
                      onChange={(val) => onUpdateInfo({ addressValue: val })}
                      isAdmin={isAdmin}
                      label="Adresse complète"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-[#007bff] hover:underline"
                  >
                    <Navigation size={12} strokeWidth={1.5} />
                    <span>Ouvrir l'itinéraire Google Maps</span>
                    <ExternalLink size={10} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Phone Row */}
          {(visibility.infoPhonesRow || isAdmin) && (
            <div className={`flex items-start justify-between p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 transition-colors hover:border-gray-200 ${
              !visibility.infoPhonesRow ? 'opacity-50' : ''
            }`}>
              <div className="flex items-start space-x-3 w-full">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-[#c6ff00]">
                  <Phone size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <EditableText
                      as="div"
                      value={content.phonesLabel}
                      onChange={(val) => onUpdateInfo({ phonesLabel: val })}
                      isAdmin={isAdmin}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                      label="Libellé Téléphones"
                    />
                    {isAdmin && (
                      <CardSwitch
                        label="Ligne Téléphones"
                        checked={visibility.infoPhonesRow}
                        onChange={(val) => onUpdateVisibility({ infoPhonesRow: val })}
                        isAdmin={isAdmin}
                        compact
                      />
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <EditableText
                        as="span"
                        value={content.phone1}
                        onChange={(val) => onUpdateInfo({ phone1: val })}
                        isAdmin={isAdmin}
                        className="font-bold text-slate-900 text-sm hover:text-[#007bff] transition-colors"
                        label="Téléphone principal"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">(Ligne Principale)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EditableText
                        as="span"
                        value={content.phone2}
                        onChange={(val) => onUpdateInfo({ phone2: val })}
                        isAdmin={isAdmin}
                        className="font-bold text-slate-800 text-sm hover:text-[#007bff] transition-colors"
                        label="Téléphone secondaire"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">(Support & Projets)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(phone1, 'phone')}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-2"
                title="Copier le numéro"
              >
                {copiedPhone ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} strokeWidth={1.5} />}
              </button>
            </div>
          )}

          {/* Email Row */}
          {(visibility.infoEmailRow || isAdmin) && (
            <div className={`flex items-start justify-between p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 transition-colors hover:border-gray-200 ${
              !visibility.infoEmailRow ? 'opacity-50' : ''
            }`}>
              <div className="flex items-start space-x-3 w-full">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-[#c6ff00]">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <EditableText
                      as="div"
                      value={content.emailLabel}
                      onChange={(val) => onUpdateInfo({ emailLabel: val })}
                      isAdmin={isAdmin}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                      label="Libellé Email"
                    />
                    {isAdmin && (
                      <CardSwitch
                        label="Ligne Email"
                        checked={visibility.infoEmailRow}
                        onChange={(val) => onUpdateVisibility({ infoEmailRow: val })}
                        isAdmin={isAdmin}
                        compact
                      />
                    )}
                  </div>
                  <div className="mt-0.5 font-bold text-slate-900 text-sm hover:text-[#007bff] transition-colors">
                    <EditableText
                      as="span"
                      value={content.emailValue}
                      onChange={(val) => onUpdateInfo({ emailValue: val })}
                      isAdmin={isAdmin}
                      label="Adresse Email"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Traitement quotidien par nos chargés d'affaires
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(email, 'email')}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-2"
                title="Copier l'email"
              >
                {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} strokeWidth={1.5} />}
              </button>
            </div>
          )}

          {/* WhatsApp Direct Action */}
          {(visibility.infoWhatsappRow || isAdmin) && (
            <div className={!visibility.infoWhatsappRow ? 'opacity-50' : ''}>
              {isAdmin && (
                <div className="mb-1 flex justify-end">
                  <CardSwitch
                    label="Bannière WhatsApp"
                    checked={visibility.infoWhatsappRow}
                    onChange={(val) => onUpdateVisibility({ infoWhatsappRow: val })}
                    isAdmin={isAdmin}
                    compact
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition-all text-emerald-950 font-medium group">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                    <MessageSquare size={16} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                      <EditableText
                        as="span"
                        value={content.whatsappLabel}
                        onChange={(val) => onUpdateInfo({ whatsappLabel: val })}
                        isAdmin={isAdmin}
                        label="Titre WhatsApp"
                      />
                    </div>
                    <div className="text-xs text-emerald-900">
                      <EditableText
                        as="span"
                        value={content.whatsappSubtext}
                        onChange={(val) => onUpdateInfo({ whatsappSubtext: val })}
                        isAdmin={isAdmin}
                        label="Texte WhatsApp"
                      />
                    </div>
                  </div>
                </div>
                {!isAdmin && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour PIXIATECH, je souhaite échanger sur un projet d'affichage / écran LED.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-emerald-700 group-hover:translate-x-0.5 transition-transform"
                    title="Ouvrir WhatsApp"
                  >
                    <ExternalLink size={14} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Working Hours Banner */}
          {(visibility.infoWorkingHoursRow || isAdmin) && (
            <div className={`p-3 rounded-xl bg-gray-50 text-xs text-slate-600 ${!visibility.infoWorkingHoursRow ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock size={14} strokeWidth={1.5} className="text-slate-400 shrink-0" />
                  <span>
                    <strong>
                      <EditableText
                        as="span"
                        value={content.hoursLabel}
                        onChange={(val) => onUpdateInfo({ hoursLabel: val })}
                        isAdmin={isAdmin}
                        label="Label Horaires"
                      />
                    </strong>{' '}
                    <EditableText
                      as="span"
                      value={content.hoursValue}
                      onChange={(val) => onUpdateInfo({ hoursValue: val })}
                      isAdmin={isAdmin}
                      label="Horaires"
                    />
                  </span>
                </div>
                {isAdmin && (
                  <CardSwitch
                    label="Horaires"
                    checked={visibility.infoWorkingHoursRow}
                    onChange={(val) => onUpdateVisibility({ infoWorkingHoursRow: val })}
                    isAdmin={isAdmin}
                    compact
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Interactive Localization Map Preview Box */}
      {(visibility.infoRadarMapCard || isAdmin) && (
        <div className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 space-y-3 ${
          !visibility.infoRadarMapCard 
            ? 'opacity-60 border-dashed border-amber-300' 
            : 'border-gray-100 hover:border-gray-200'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#c6ff00] border border-black animate-pulse" />
              <EditableText
                as="span"
                value={content.mapTitle}
                onChange={(val) => onUpdateInfo({ mapTitle: val })}
                isAdmin={isAdmin}
                label="Titre de la carte"
              />
            </span>
            <div className="flex items-center space-x-2">
              <EditableText
                as="span"
                value={content.mapBadge}
                onChange={(val) => onUpdateInfo({ mapBadge: val })}
                isAdmin={isAdmin}
                className="text-[11px] font-semibold text-gray-400"
                label="Badge métro/accès"
              />
              {isAdmin && (
                <CardSwitch
                  label="Carte Radar"
                  checked={visibility.infoRadarMapCard}
                  onChange={(val) => onUpdateVisibility({ infoRadarMapCard: val })}
                  isAdmin={isAdmin}
                  compact
                />
              )}
            </div>
          </div>

          {/* Stylized Visual Map Target Box */}
          <div className="relative h-44 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-center">
            {/* Concentric radar lines */}
            <div className="absolute h-56 w-56 rounded-full border border-gray-300/40 pointer-events-none" />
            <div className="absolute h-40 w-40 rounded-full border border-gray-300/60 pointer-events-none" />
            <div className="absolute h-24 w-24 rounded-full border border-gray-400/50 pointer-events-none" />

            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Center Pin Marker */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-[#c6ff00] shadow-xl border-2 border-white">
                <MapPin size={18} strokeWidth={1.5} />
              </div>
              <div className="mt-1.5 rounded-full bg-gray-900 px-3 py-0.5 text-center text-white shadow-md">
                <EditableText
                  as="span"
                  value={content.mapPinLabel}
                  onChange={(val) => onUpdateInfo({ mapPinLabel: val })}
                  isAdmin={isAdmin}
                  className="text-[11px] font-black tracking-widest font-tech"
                  label="Badge du repère"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>À 5 minutes du périphérique Nord</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-[#007bff] flex items-center space-x-1 transition-colors"
            >
              <span>Itinéraire GPS</span>
              <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
