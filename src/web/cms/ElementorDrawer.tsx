'use client';

import React, { useState, useRef } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import {
  X,
  Type,
  Image as ImageIcon,
  Palette,
  Server,
  Upload,
  Maximize2,
  Minimize2,
  Check,
  Sliders,
  Move,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  RotateCcw,
  Globe,
  Sparkles,
} from 'lucide-react';
import { I18nFieldEditor } from './I18nFieldEditor';
import { CMS_LANGUAGES } from '@/lib/site-web/cms-i18n';

// ─── Spacing Control (Elementor-style) ───────────────────────────────────────
type SpacingSide = 'top' | 'right' | 'bottom' | 'left';

interface SpacingBoxProps {
  label: string;
  field: string; // e.g. 'paddingTop'
  values: { top: number; right: number; bottom: number; left: number };
  linked: boolean;
  onChange: (side: SpacingSide, value: number) => void;
}

function SpacingBox({ label, values, linked, onChange }: SpacingBoxProps) {
  const sides: SpacingSide[] = ['top', 'right', 'bottom', 'left'];
  const sideLabels: Record<SpacingSide, string> = { top: 'H', right: 'D', bottom: 'B', left: 'G' };
  const sidePositions: Record<SpacingSide, React.CSSProperties> = {
    top:    { top: 4,  left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: 4, left: '50%', transform: 'translateX(-50%)' },
    left:   { left: 4, top: '50%', transform: 'translateY(-50%)' },
    right:  { right: 4, top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div>
      <div className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider mb-2">{label}</div>
      {/* Visual box */}
      <div className="relative w-full" style={{ height: 96 }}>
        {/* outer box */}
        <div
          className="absolute inset-0 rounded border border-[#333] bg-[#1a1a18] flex items-center justify-center"
          style={{ padding: '18px 24px' }}
        >
          {/* inner content area */}
          <div
            className="w-full h-full rounded border border-dashed border-[#444] bg-[#111] flex items-center justify-center"
          >
            <span className="text-[9px] text-[#555] font-mono">CONTENU</span>
          </div>
        </div>
        {/* Side inputs overlay */}
        {sides.map((side) => (
          <div
            key={side}
            className="absolute flex flex-col items-center gap-0.5"
            style={sidePositions[side]}
          >
            <input
              type="number"
              min={0}
              max={400}
              value={values[side]}
              onChange={(e) => onChange(side, Number(e.target.value))}
              className="w-11 text-center bg-[#C3F910]/10 border border-[#C3F910]/40 hover:border-[#C3F910] focus:border-[#C3F910] focus:bg-[#C3F910]/20 rounded text-[11px] font-mono text-[#C3F910] font-bold p-0.5 outline-none cursor-pointer transition-colors"
            />
            <span className="text-[8px] text-[#666] font-mono">{sideLabels[side]}</span>
          </div>
        ))}
      </div>
      {/* Sliders per side */}
      <div className="space-y-1.5 mt-3">
        {sides.map((side) => (
          <div key={side} className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#666] w-3">{sideLabels[side]}</span>
            <input
              type="range"
              min={0}
              max={400}
              step={4}
              value={values[side]}
              onChange={(e) => onChange(side, Number(e.target.value))}
              className="flex-1 accent-[#C3F910] cursor-pointer"
            />
            <span className="text-[10px] font-mono text-[#C3F910] w-8 text-right">{values[side]}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ElementorDrawerProps {
  onOpenBackendModal: () => void;
}

export const ElementorDrawer: React.FC<ElementorDrawerProps> = ({ onOpenBackendModal }) => {
  const {
    isEditing,
    setIsEditing,
    currentPageId,
    pages,
    selectedBlockId,
    setSelectedBlockId,
    activeTab,
    setActiveTab,
    updateSectionField,
    updateNestedField,
    updateSectionOrder,
    toggleSectionVisibility,
    saveCurrentPage,
    uploadMedia,
    saveStatus,
    backendConnected,
    settings,
    currentLang,
    setCurrentLang,
    autoTranslateSection,
  } = useCms();

  const [dockPosition, setDockPosition] = useState<'left' | 'right'>('left');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showSectionManager, setShowSectionManager] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [translatingSection, setTranslatingSection] = useState<boolean>(false);
  // Section order input drafts — must be declared here before any early return (Rules of Hooks)
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isEditing) return null;

  const activePage = pages[currentPageId] || {
    id: currentPageId,
    name: currentPageId,
    slug: '',
    updatedAt: '',
    meta: { title: '', description: '' },
    sectionOrder: [],
    sections: {},
  };

  const sections = activePage.sections || {};
  const currentSectionKey = selectedBlockId || 'hero';
  const currentSectionData = (sections[currentSectionKey] as Record<string, unknown>) || {};

  const baseSectionOptions =
    currentPageId === 'product_wp'
      ? [
          { key: 'hero', label: '00. Hero & En-tête PXT Fine' },
          { key: 'overview', label: '01. Aperçu & Châssis' },
          { key: 'design', label: '02. Conception & Dimensions' },
          { key: 'features', label: '03. Caractéristiques Techniques' },
          { key: 'fieldwork', label: '05. Réalisations sur le terrain' },
        ]
      : currentPageId === 'mentions_legales'
      ? [
          { key: 'header', label: '00. En-tête & Titre' },
          { key: 'presentation', label: '01. Art. 1 - Champ d’application' },
          { key: 'identity', label: '02. Identité de la Société' },
          { key: 'article2', label: '03. Art. 2 - Vente & Logistique' },
          { key: 'article3', label: '04. Art. 3 - Prix' },
          { key: 'article4', label: '05. Art. 4 - Paiement' },
          { key: 'article5', label: '06. Art. 5 - Livraison & Douanes' },
          { key: 'article6', label: '07. Art. 6 - Rétractation' },
          { key: 'article7', label: '08. Art. 7 - Installation' },
          { key: 'article8', label: '09. Art. 8 - Location' },
          { key: 'article9', label: '10. Art. 9 - Garanties' },
          { key: 'article10', label: '11. Art. 10 - Responsabilité' },
          { key: 'article11', label: '12. Art. 11 - Données personnelles' },
          { key: 'article12', label: '13. Art. 12 - Droit & Litiges' },
        ]
      : currentPageId === 'politique_confidentialite'
      ? [
          { key: 'header', label: '00. En-tête & Titre' },
          { key: 'intro', label: '01. Engagement & Intro' },
          { key: 'responsable', label: '02. Responsable de Traitement' },
          { key: 'donnees', label: '03. Données Collectées' },
          { key: 'finalites', label: '04. Finalités du Traitement' },
          { key: 'destinataires', label: '05. Destinataires & Transfert' },
          { key: 'conservation', label: '06. Durée de Conservation' },
          { key: 'securite', label: '07. Sécurité des Données' },
          { key: 'droits', label: '08. Vos Droits RGPD' },
        ]
      : currentPageId === 'gestion_cookies'
      ? [
          { key: 'header', label: '00. En-tête & Titre' },
          { key: 'definition', label: '01. Qu’est-ce qu’un Cookie ?' },
          { key: 'emetteurs', label: '02. Qui dépose les Cookies ?' },
          { key: 'types', label: '03. Types de Cookies Utilisés' },
          { key: 'choix', label: '04. Vos Choix Concernant les Cookies' },
          { key: 'duree', label: '05. Durée de Conservation' },
          { key: 'navigateurs', label: '06. Paramétrage du Navigateur' },
          { key: 'contact', label: '07. Contact & Assistance' },
        ]
      : currentPageId === 'home'
      ? [
          { key: 'hero', label: "01. Hero & Slider d'accueil" },
          { key: 'manifesto', label: '02. Manifeste & Vision' },
          { key: 'showreel', label: '03. Showreel 3D (Écran LED)' },
          { key: 'markets', label: '04. Marchés & Solutions' },
          { key: 'kinetic', label: '05. Kinetic SPKI-250' },
          { key: 'products', label: '06. Catalogue des Écrans' },
          { key: 'technology', label: '07. Technologies Propriétaires' },
          { key: 'pitch', label: '08. Calculateur Pas de Pixel' },
          { key: 'projects', label: '09. Réalisations & Projets' },
          { key: 'process', label: '10. Méthodologie & Processus' },
          { key: 'experience', label: '11. Experience Center' },
          { key: 'insights', label: '12. Insights & Articles' },
          { key: 'contact', label: '13. Contact & Consultation' },
        ]
      : Object.keys(sections).map((key) => ({
          key,
          label: (sections[key] as any)?.title || key,
        }));

  // Sort sections according to saved sectionOrder
  const configuredOrder = activePage.sectionOrder;
  const orderedOptions = (() => {
    const map = new Map(baseSectionOptions.map((opt) => [opt.key, opt]));
    const result: Array<{ key: string; label: string; visible?: boolean }> = [];

    if (configuredOrder && Array.isArray(configuredOrder) && configuredOrder.length > 0) {
      for (const k of configuredOrder) {
        const item = map.get(k);
        if (item) {
          const sec = sections[k] as Record<string, unknown> | undefined;
          const vis = sec?.visible !== false && (sec?.layout as { visible?: boolean } | undefined)?.visible !== false;
          result.push({ ...item, visible: vis });
          map.delete(k);
        }
      }
    }

    // Append any remaining
    map.forEach((item, k) => {
      const sec = sections[k] as Record<string, unknown> | undefined;
      const vis = sec?.visible !== false && (sec?.layout as { visible?: boolean } | undefined)?.visible !== false;
      result.push({ ...item, visible: vis });
    });

    return result;
  })();

  const handlePositionCommit = (sectionKey: string, currentIdx: number) => {
    const rawVal = orderDrafts[sectionKey];
    if (rawVal === undefined || rawVal.trim() === '') {
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[sectionKey];
        return next;
      });
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[sectionKey];
        return next;
      });
      return;
    }
    const targetIdx = Math.max(0, Math.min(orderedOptions.length - 1, parsed - 1));
    if (targetIdx === currentIdx) {
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[sectionKey];
        return next;
      });
      return;
    }
    const currentKeys = orderedOptions.map((o) => o.key);
    const [moved] = currentKeys.splice(currentIdx, 1);
    currentKeys.splice(targetIdx, 0, moved);
    updateSectionOrder(currentKeys);
    void saveCurrentPage();
    setOrderDrafts((prev) => {
      const next = { ...prev };
      delete next[sectionKey];
      return next;
    });
  };

  const resetToDefaultOrder = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm("Êtes-vous sûr de vouloir réinitialiser l'ordre des sections à leur disposition d'origine ?")
    ) {
      const defaultKeys = baseSectionOptions.map((o) => o.key);
      updateSectionOrder(defaultKeys);
      void saveCurrentPage();
      setOrderDrafts({});
    }
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= orderedOptions.length) return;
    const currentKeys = orderedOptions.map((o) => o.key);
    const [moved] = currentKeys.splice(idx, 1);
    currentKeys.splice(targetIdx, 0, moved);
    updateSectionOrder(currentKeys);
    void saveCurrentPage();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const newUrl = await uploadMedia(file);
      updateSectionField(currentSectionKey, 'image', newUrl);
      updateSectionField(currentSectionKey, 'heroImage', newUrl);
      updateSectionField(currentSectionKey, 'primaryImage', newUrl);
      updateSectionField(currentSectionKey, 'billboardImage', newUrl);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isMinimized) {
    return (
      <aside
        id="elementor-drawer-minimized"
        data-cms-ui="true"
        aria-label="Contrôle de l'éditeur réduit"
        className={`fixed bottom-6 ${dockPosition === 'left' ? 'left-6' : 'right-6'} z-[290] bg-[#141412] text-white border border-[#C3F910] p-3 rounded-xl shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform`}
        onClick={() => setIsMinimized(false)}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#C3F910] animate-pulse" />
        <span className="font-mono text-xs font-bold text-[#C3F910]">ÉDITEUR OUVERT</span>
        <Maximize2 className="w-4 h-4 text-[#9A9A94]" />
      </aside>
    );
  }

  return (
    <aside
      id="elementor-drawer"
      data-cms-ui="true"
      aria-label="Panneau d'édition"
      className={`fixed top-11 ${dockPosition === 'left' ? 'left-0' : 'right-0'} bottom-0 w-full sm:w-[420px] max-w-[95vw] z-[290] bg-[#0E0E0D] border-r sm:border-r border-[#222220] flex flex-col text-[#EDEBE6] font-sans shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in slide-in-from-left duration-200 overflow-x-hidden`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#141413] border-b border-[#222220]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#C3F910] text-[#080808] flex items-center justify-center font-bold text-xs">E</div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider text-white">ÉDITEUR SITE WEB</div>
            <div className="text-[10px] text-[#7A7A76] font-mono">Elementor • Live Editor</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDockPosition((prev) => (prev === 'left' ? 'right' : 'left'))}
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Changer de côté"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Réduire le panneau"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Quitter l'éditeur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sélecteur de Langue d'Édition */}
      <div className="px-4 py-2 bg-[#10100F] border-b border-[#222220] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7A7A76] uppercase tracking-wider shrink-0">
          <Globe className="w-3 h-3 text-[#C3F910]" />
          <span>Langue :</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {CMS_LANGUAGES.map((langCfg) => {
            const isActive = langCfg.code === currentLang;
            return (
              <button
                key={langCfg.code}
                type="button"
                onClick={() => setCurrentLang(langCfg.code)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#C3F910] text-[#080808] shadow-sm scale-105'
                    : 'bg-[#181816] text-[#888] hover:text-white hover:bg-[#252522]'
                }`}
                title={`Éditer en ${langCfg.label} ${langCfg.isSource ? '(Langue Source)' : ''}`}
              >
                <span>{langCfg.flag}</span>
                <span>{langCfg.code.toUpperCase()}</span>
                {langCfg.isSource && <span className="text-[7.5px] opacity-75 font-normal">(Src)</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-[#121211] border-b border-[#222220]">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-mono text-[#7A7A76] uppercase tracking-wider">
            Section en cours d&apos;édition :
          </label>
          <button
            type="button"
            onClick={() => setShowSectionManager(!showSectionManager)}
            className="flex items-center gap-1 text-[10px] font-mono text-[#C3F910] hover:underline cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            <span>{showSectionManager ? 'Fermer liste' : 'Organiser (Ordre & Vue)'}</span>
          </button>
        </div>
        <select
          value={currentSectionKey}
          onChange={(e) => setSelectedBlockId(e.target.value)}
          className="w-full bg-[#1A1A18] text-[#F5F4F0] border border-[#2F2F2C] rounded px-2.5 py-1.5 text-xs font-mono focus:border-[#C3F910] focus:outline-none cursor-pointer"
        >
          {orderedOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.visible === false ? '👁🗨 [Masqué] ' : ''}{opt.label}
            </option>
          ))}
        </select>

        {/* Expandable Section Organizer List */}
        {showSectionManager && (
          <div className="mt-3 p-2 bg-[#171715] border border-[#2A2A28] rounded-lg space-y-2 animate-in fade-in duration-150">
            <div className="text-[9.5px] font-mono text-[#9A9A94] uppercase tracking-wider flex items-center justify-between px-1">
              <span>Gestionnaire d&apos;ordre & visibilité</span>
              <span className="text-[#C3F910]">{orderedOptions.length} sections</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {orderedOptions.map((opt, idx) => {
                const isCurrent = opt.key === currentSectionKey;
                const isSecVisible = opt.visible !== false;
                const draftValue = orderDrafts[opt.key] !== undefined ? orderDrafts[opt.key] : String(idx + 1);

                return (
                  <div
                    key={opt.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[11px] font-mono transition-colors ${
                      isCurrent
                        ? 'border-[#C3F910] bg-[#C3F910]/10 text-white'
                        : 'border-[#262624] bg-[#121211] text-[#9A9A94] hover:border-[#444]'
                    }`}
                  >
                    {/* Position Number Input */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={draftValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOrderDrafts((prev) => ({ ...prev, [opt.key]: val }));
                      }}
                      onBlur={() => handlePositionCommit(opt.key, idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePositionCommit(opt.key, idx);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-5 bg-[#0A0A09] text-[#C3F910] border border-[#333] hover:border-[#666] focus:border-[#C3F910] text-center font-mono text-[10.5px] font-bold rounded focus:outline-none transition-colors shrink-0"
                      title="Entrez un numéro de position (1 à N) puis appuyez sur Entrée ou cliquez ailleurs"
                    />

                    {/* Section Label / Select block */}
                    <div
                      className="truncate cursor-pointer flex-1 min-w-0"
                      onClick={() => setSelectedBlockId(opt.key)}
                      title={`Sélectionner ${opt.label}`}
                    >
                      <span className={`truncate block ${!isSecVisible ? 'line-through opacity-50 text-[#777]' : isCurrent ? 'text-white font-semibold' : 'text-[#CCC]'}`}>
                        {opt.label}
                      </span>
                    </div>

                    {/* Actions: Visibility, Up, Down */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionVisibility(opt.key);
                        }}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          isSecVisible ? 'text-[#C3F910] hover:bg-[#C3F910]/20' : 'text-[#ff4444] hover:bg-[#ff4444]/20'
                        }`}
                        title={isSecVisible ? 'Masquer la section sur le site' : 'Afficher la section sur le site'}
                      >
                        {isSecVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, -1);
                        }}
                        className="p-1 text-[#777] hover:text-[#C3F910] hover:bg-[#222] rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Monter d'un rang"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === orderedOptions.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, 1);
                        }}
                        className="p-1 text-[#777] hover:text-[#C3F910] hover:bg-[#222] rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Descendre d'un rang"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer: Reset order & Hint */}
            <div className="pt-2 border-t border-[#262624] flex items-center justify-between px-1">
              <button
                type="button"
                onClick={resetToDefaultOrder}
                className="flex items-center gap-1.5 text-[10px] font-mono text-[#9A9A94] hover:text-white px-2 py-1 rounded hover:bg-[#222] transition-colors cursor-pointer"
                title="Rétablir l'ordre d'origine des sections"
              >
                <RotateCcw className="w-3 h-3 text-[#777]" />
                <span>Réinitialiser l&apos;ordre</span>
              </button>
              <span className="text-[9px] font-mono text-[#666]">
                Tapez un N° ou utilisez ↑ / ↓
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-[#222220] bg-[#141413] overflow-x-hidden">
        {(
          [
            { key: 'content', label: 'Contenu', icon: Type },
            { key: 'media', label: 'Photos', icon: ImageIcon },
            { key: 'style', label: 'Style', icon: Palette },
            { key: 'backend', label: 'Backend', icon: Server },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 px-1 text-xs font-mono font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === key
                ? 'border-[#C3F910] text-[#C3F910] bg-[#1A1A18]'
                : 'border-transparent text-[#7A7A76] hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Édition des Textes</span>
              <button
                type="button"
                onClick={async () => {
                  setTranslatingSection(true);
                  try {
                    await autoTranslateSection(currentSectionKey);
                  } finally {
                    setTranslatingSection(false);
                  }
                }}
                disabled={translatingSection}
                className="flex items-center gap-1 text-[9.5px] font-mono px-2 py-1 rounded bg-[#181816] text-[#C3F910] hover:bg-[#C3F910]/20 border border-[#C3F910]/30 transition-colors cursor-pointer disabled:opacity-50"
                title="Traduire tous les champs manquants de cette section"
              >
                <Sparkles className={`w-3 h-3 ${translatingSection ? 'animate-spin' : ''}`} />
                <span>{translatingSection ? 'Traduction en cours...' : 'Traduire toute la section'}</span>
              </button>
            </div>

            {/* Surtitre / Badge */}
            <I18nFieldEditor
              label="Surtitre / Badge"
              sectionKey={currentSectionKey}
              fieldKey="badge"
              placeholder="Ex: 01 / INNOVATION"
            />

            {/* Titre Principal */}
            <I18nFieldEditor
              label="Titre Principal"
              sectionKey={currentSectionKey}
              fieldKey="title"
              placeholder="Titre de la section..."
              inputClassName="font-bold text-sm"
            />

            {/* Hero Tagline / Accroche */}
            {(currentSectionKey === 'hero' || currentSectionData.tagline !== undefined) && (
              <I18nFieldEditor
                label="Ligne 2 du Titre (Tagline)"
                sectionKey={currentSectionKey}
                fieldKey="tagline"
                placeholder="Ex: DU VISUEL."
                inputClassName="font-bold text-sm"
              />
            )}

            {/* Titre Ligne 2 & 3 pour les sections à titre scindé */}
            {['manifesto', 'products', 'projects', 'process', 'insights'].includes(currentSectionKey) && (
              <div className="space-y-2">
                <I18nFieldEditor
                  label="Titre — Ligne 2"
                  sectionKey={currentSectionKey}
                  fieldKey="titleLine2"
                  placeholder="Seconde ligne du titre..."
                  inputClassName="font-bold text-sm"
                />
                {['manifesto'].includes(currentSectionKey) && (
                  <I18nFieldEditor
                    label="Titre — Ligne 3"
                    sectionKey={currentSectionKey}
                    fieldKey="titleLine3"
                    placeholder="Troisième ligne du titre..."
                    inputClassName="font-bold text-sm"
                  />
                )}
              </div>
            )}

            {/* Kinetic title lines — shown when kinetic or when keys exist */}
            {(currentSectionKey === 'kinetic' ||
              currentSectionData.title1 !== undefined ||
              currentSectionData.title2 !== undefined ||
              currentSectionData.title3 !== undefined) && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block">
                  Lignes du Grand Titre (Kinetic)
                </label>
                {[1, 2, 3].map((n) => (
                  <I18nFieldEditor
                    key={n}
                    label={`Ligne ${n}`}
                    sectionKey={currentSectionKey}
                    fieldKey={`title${n}`}
                    placeholder={`Ligne ${n}...`}
                  />
                ))}
              </div>
            )}

            {/* Description / Sous-titre */}
            <I18nFieldEditor
              label="Description / Sous-titre"
              sectionKey={currentSectionKey}
              fieldKey="description"
              isTextarea
              rows={4}
              placeholder="Texte explicatif..."
            />

            {/* Libellé Bouton Principal */}
            <I18nFieldEditor
              label="Libellé Bouton Principal"
              sectionKey={currentSectionKey}
              fieldKey="primaryCta"
              placeholder="Ex: Explorer les marchés →"
              inputClassName="text-[#C3F910] font-bold"
            />

            {/* Libellé Bouton Secondaire */}
            <I18nFieldEditor
              label="Libellé Bouton Secondaire"
              sectionKey={currentSectionKey}
              fieldKey="secondaryCta"
              placeholder="Ex: Démarrer un Projet →"
            />

            {/* Product-specific fields */}
            {currentSectionData.cabinetDim !== undefined && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222]">
                <div>
                  <label className="text-[9px] font-mono text-[#7A7A76] uppercase block mb-1">Dimensions Châssis</label>
                  <input
                    type="text"
                    value={String(currentSectionData.cabinetDim ?? '')}
                    onChange={(e) => updateSectionField(currentSectionKey, 'cabinetDim', e.target.value)}
                    className="w-full bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#7A7A76] uppercase block mb-1">Poids / Châssis</label>
                  <input
                    type="text"
                    value={String(currentSectionData.weight ?? '')}
                    onChange={(e) => updateSectionField(currentSectionKey, 'weight', e.target.value)}
                    className="w-full bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider">
              Gestionnaire Médias & Photos
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#333330] hover:border-[#C3F910] rounded-lg p-5 text-center cursor-pointer bg-[#141412] transition-colors group"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <div className="w-10 h-10 rounded-full bg-[#1E1E1C] group-hover:bg-[#C3F910]/20 flex items-center justify-center mx-auto mb-2.5 transition-colors">
                <Upload className="w-5 h-5 text-[#9A9A94] group-hover:text-[#C3F910]" />
              </div>
              <div className="font-semibold text-white text-xs mb-1">
                {uploading ? 'Chargement de la photo...' : 'Uploader une photo depuis votre ordinateur'}
              </div>
              <div className="text-[10px] text-[#7A7A76]">Glissez-déposez ou cliquez ici (PNG, JPG, WebP)</div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                Image actuelle de cette section
              </label>
              {(() => {
                const sectionDefaultImages: Record<string, string> = {
                  hero: '/uploads/site/hero-1.jpg',
                  experience: '/uploads/site/xc-bg.jpg',
                  projects: '/uploads/projects/how-xeron-elevates-shenzhen-happy-valleys-summer-festival-stage.jpg',
                  markets: '/uploads/site/market-corporate.jpg',
                  technology: '/uploads/site/tech-coldled.jpg',
                  insights: '/uploads/site/tech-infinite.jpg',
                };
                const defaultFallback = sectionDefaultImages[currentSectionKey] || '';
                const currentImg =
                  currentSectionData.heroImage ??
                  currentSectionData.primaryImage ??
                  currentSectionData.image ??
                  currentSectionData.billboardImage ??
                  defaultFallback;
                return (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded border border-[#2B2B28] overflow-hidden bg-black flex items-center justify-center">
                      {currentImg ? (
                        <img src={String(currentImg)} alt="Prévisualisation" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-[#7A7A76]">Aucune image assignée</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={String(currentImg)}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSectionField(currentSectionKey, 'image', val);
                        updateSectionField(currentSectionKey, 'heroImage', val);
                        updateSectionField(currentSectionKey, 'primaryImage', val);
                        updateSectionField(currentSectionKey, 'billboardImage', val);
                      }}
                      className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-[11px] font-mono text-white"
                      placeholder="Ou collez une URL d'image directe..."
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'style' && (() => {
          // ── read saved spacing from CMS ──
          const padding = {
            top:    Number(currentSectionData.paddingTop    ?? currentSectionData.spacingTop    ?? 90),
            right:  Number(currentSectionData.paddingRight  ?? currentSectionData.spacingRight  ?? 0),
            bottom: Number(currentSectionData.paddingBottom ?? currentSectionData.spacingBottom ?? 90),
            left:   Number(currentSectionData.paddingLeft   ?? currentSectionData.spacingLeft   ?? 0),
          };
          const margin = {
            top:    Number(currentSectionData.marginTop    ?? 0),
            right:  Number(currentSectionData.marginRight  ?? 0),
            bottom: Number(currentSectionData.marginBottom ?? 0),
            left:   Number(currentSectionData.marginLeft   ?? 0),
          };
          const minHeight = Number(currentSectionData.minHeight ?? 0);

          const handlePadding = (side: SpacingSide, val: number) => {
            const map: Record<SpacingSide, string> = {
              top: 'paddingTop', right: 'paddingRight',
              bottom: 'paddingBottom', left: 'paddingLeft',
            };
            updateSectionField(currentSectionKey, map[side], val);
          };
          const handleMargin = (side: SpacingSide, val: number) => {
            const map: Record<SpacingSide, string> = {
              top: 'marginTop', right: 'marginRight',
              bottom: 'marginBottom', left: 'marginLeft',
            };
            updateSectionField(currentSectionKey, map[side], val);
          };

          return (
            <div className="space-y-5">
              {/* ── Section: Espacement ── */}
              <div>
                <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Move className="w-3.5 h-3.5" />
                  Espacement de la Section
                </div>

                {/* MIN HEIGHT */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider">Hauteur minimale</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[#C3F910] font-mono text-[11px] font-bold">
                        {minHeight === 0 ? 'Auto' : `${minHeight}px`}
                      </span>
                      {minHeight > 0 && (
                        <button
                          type="button"
                          onClick={() => updateSectionField(currentSectionKey, 'minHeight', 0)}
                          className="text-[9px] font-mono text-[#7A7A76] hover:text-[#C3F910] underline cursor-pointer transition-colors"
                          title="Réinitialiser en Auto"
                        >
                          Auto ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2000}
                    step={10}
                    value={minHeight}
                    onChange={(e) => updateSectionField(currentSectionKey, 'minHeight', Number(e.target.value))}
                    className="w-full accent-[#C3F910] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#555] font-mono mt-0.5 mb-2">
                    <span>Auto</span><span>600px</span><span>1200px</span><span>2000px</span>
                  </div>
                  <div className="text-[9.5px] text-[#7A7A76] bg-[#141412] border border-[#222] rounded p-1.5 flex items-center gap-1.5">
                    <span className="text-[#C3F910]">↕</span>
                    <span>Glissez la bordure inférieure directement sur la page pour redimensionner à la souris.</span>
                  </div>
                </div>

                {/* PADDING BOX */}
                <SpacingBox
                  label="Padding (intérieur)"
                  field="padding"
                  values={padding}
                  linked={false}
                  onChange={handlePadding}
                />

                {/* MARGIN BOX */}
                <div className="mt-4">
                  <SpacingBox
                    label="Margin (extérieur)"
                    field="margin"
                    values={margin}
                    linked={false}
                    onChange={handleMargin}
                  />
                </div>

                {/* Quick presets */}
                <div className="mt-4">
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-2">Préréglages rapides</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Compact', top: 48, bottom: 48 },
                      { label: 'Normal', top: 90, bottom: 90 },
                      { label: 'Spacieux', top: 150, bottom: 150 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          updateSectionField(currentSectionKey, 'paddingTop', p.top);
                          updateSectionField(currentSectionKey, 'paddingBottom', p.bottom);
                        }}
                        className="py-1.5 px-2 rounded border border-[#2B2B28] bg-[#171715] hover:border-[#C3F910] hover:text-[#C3F910] text-[#9A9A94] text-[10px] font-mono font-bold transition-colors cursor-pointer"
                      >
                        {p.label}
                        <div className="text-[8px] opacity-60 mt-0.5">{p.top}/{p.bottom}px</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#222] pt-4 space-y-4">
                {/* ── Section: Typographie ── */}
                <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Typographie & Couleurs
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                    Couleur d'accent (Vert Signature)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.accentColor || '#C3F910'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'accentColor', e.target.value)}
                      className="w-8 h-8 rounded border border-[#333] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.accentColor || '#C3F910'}
                      readOnly
                      className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider">Taille du Titre</label>
                    <span className="text-[#C3F910] font-mono text-[11px]">{Number(currentSectionData.titleFontSize) || 54}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="120"
                    value={Number(currentSectionData.titleFontSize) || 54}
                    onChange={(e) => updateSectionField(currentSectionKey, 'titleFontSize', Number(e.target.value))}
                    className="w-full accent-[#C3F910] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                    Couleur du Texte
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={(currentSectionData.textColor as string) || '#F5F4F0'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'textColor', e.target.value)}
                      className="w-8 h-8 rounded border border-[#333] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={(currentSectionData.textColor as string) || '#F5F4F0'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'textColor', e.target.value)}
                      className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white"
                      placeholder="#F5F4F0"
                    />
                    {currentSectionData.textColor && (
                      <button
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'textColor', '')}
                        className="text-[9px] font-mono text-[#7A7A76] hover:text-[#C3F910] underline cursor-pointer"
                        title="Réinitialiser"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Blanc', color: '#F5F4F0' },
                      { label: 'Vert Diode', color: '#C3F910' },
                      { label: 'Gris Titane', color: '#7A7A76' },
                      { label: 'Noir Brute', color: '#0A0A09' },
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'textColor', preset.color)}
                        className={`flex flex-col items-center gap-1 p-2 rounded border transition-colors cursor-pointer ${
                          (currentSectionData.textColor as string) === preset.color
                            ? 'border-[#C3F910] bg-[#C3F910]/10'
                            : 'bg-[#171715] border-[#2B2B28] hover:border-[#C3F910]'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: preset.color }} />
                        <span className="text-[9px] text-[#9A9A94] font-mono">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Couleur d'accent ── */}
                <div>
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                    Couleur d&apos;Accent / Signature
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(currentSectionData.accentColor as string) || '#C3F910'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'accentColor', e.target.value)}
                      className="w-8 h-8 rounded border border-[#333] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={(currentSectionData.accentColor as string) || '#C3F910'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'accentColor', e.target.value)}
                      className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white"
                    />
                    {currentSectionData.accentColor && (
                      <button
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'accentColor', '')}
                        className="text-[9px] font-mono text-[#7A7A76] hover:text-[#C3F910] underline cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section: Arrière-plan ── */}
              <div className="border-t border-[#222] pt-4 space-y-4">
                <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Arrière-plan &amp; Overlay
                </div>

                {/* Background Color */}
                <div>
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                    Couleur de Fond
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(currentSectionData.bgColor as string) || '#080808'}
                      onChange={(e) => updateSectionField(currentSectionKey, 'bgColor', e.target.value)}
                      className="w-8 h-8 rounded border border-[#333] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={(currentSectionData.bgColor as string) || ''}
                      onChange={(e) => updateSectionField(currentSectionKey, 'bgColor', e.target.value)}
                      className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white"
                      placeholder="Ex: #080808 ou transparent"
                    />
                    {currentSectionData.bgColor && (
                      <button
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'bgColor', '')}
                        className="text-[9px] font-mono text-[#7A7A76] hover:text-[#C3F910] underline cursor-pointer"
                        title="Réinitialiser"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[
                      { label: 'Noir', color: '#080808' },
                      { label: 'Blanc', color: '#F5F4F0' },
                      { label: 'Gris', color: '#1A1A18' },
                      { label: 'Clair', color: '#f5f4f0' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'bgColor', p.color)}
                        className="flex flex-col items-center gap-1 p-1.5 rounded border border-[#2B2B28] bg-[#171715] hover:border-[#C3F910] cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: p.color }} />
                        <span className="text-[9px] text-[#9A9A94] font-mono">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Image */}
                <div>
                  <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                    Image de Fond (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={(currentSectionData.bgImage as string) || ''}
                      onChange={(e) => updateSectionField(currentSectionKey, 'bgImage', e.target.value)}
                      className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white focus:border-[#C3F910] focus:outline-none"
                      placeholder="/uploads/site/ma-photo.jpg"
                    />
                    {currentSectionData.bgImage && (
                      <button
                        type="button"
                        onClick={() => updateSectionField(currentSectionKey, 'bgImage', '')}
                        className="text-[9px] font-mono text-[#7A7A76] hover:text-red-400 underline cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {currentSectionData.bgImage && (
                    <div className="mt-2 rounded overflow-hidden border border-[#2B2B28] aspect-video bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentSectionData.bgImage as string}
                        alt="Prévisualisation fond"
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  )}
                </div>

                {/* Overlay Opacity */}
                {currentSectionData.bgImage && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider">Opacité Overlay</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[#C3F910] font-mono text-[11px] font-bold">
                          {Number(currentSectionData.overlayOpacity) || 0}%
                        </span>
                        {Number(currentSectionData.overlayOpacity) > 0 && (
                          <button
                            type="button"
                            onClick={() => updateSectionField(currentSectionKey, 'overlayOpacity', 0)}
                            className="text-[9px] font-mono text-[#7A7A76] hover:text-[#C3F910] underline cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Number(currentSectionData.overlayOpacity) || 0}
                      onChange={(e) => updateSectionField(currentSectionKey, 'overlayOpacity', Number(e.target.value))}
                      className="w-full accent-[#C3F910] cursor-pointer"
                    />
                    <div>
                      <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5 mt-2">
                        Couleur de l&apos;Overlay
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(currentSectionData.overlayColor as string) || '#000000'}
                          onChange={(e) => updateSectionField(currentSectionKey, 'overlayColor', e.target.value)}
                          className="w-7 h-7 rounded border border-[#333] cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-[#7A7A76]">Couleur du voile</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'backend' && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider">
              Intégration Site Web
            </div>
            <div className="bg-[#141412] p-3 rounded border border-[#2B2B28] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#7A7A76] uppercase">Statut Serveur</span>
                <span
                  className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                    backendConnected ? 'text-[#C3F910]' : 'text-amber-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-[#C3F910]' : 'bg-amber-400'} animate-pulse`} />
                  {backendConnected ? 'Connecté au CMS' : 'Mode Autonome Local'}
                </span>
              </div>
              <div className="text-[10px] text-[#9A9A94] font-mono">Endpoint API : {settings.backendApiUrl}</div>
            </div>
            <button
              type="button"
              onClick={onOpenBackendModal}
              className="w-full flex items-center justify-center gap-2 bg-[#1C1C1A] hover:bg-[#252522] text-[#EDEBE6] hover:text-[#C3F910] border border-[#333] hover:border-[#C3F910] py-2.5 px-3 rounded font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Ouvrir la Console Développeur & JSON</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#141413] border-t border-[#222220] flex items-center gap-2">
        <button
          type="button"
          onClick={() => saveCurrentPage()}
          disabled={saveStatus === 'saving'}
          className="flex-1 flex items-center justify-center gap-2 bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-mono font-bold text-xs py-3 px-4 rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(195,249,16,0.3)]"
        >
          {saveStatus === 'saving' ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>SYNCHRONISATION EN COURS...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="w-4 h-4" />
              <span>PAGE ENREGISTRÉE DANS LE CMS</span>
            </>
          ) : (
            <span>ENREGISTRER CETTE PAGE</span>
          )}
        </button>
      </div>
    </aside>
  );
};
