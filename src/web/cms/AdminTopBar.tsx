'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Edit3, Eye, Save, CheckCircle2, AlertTriangle, LogOut, Layers, Palette } from 'lucide-react';
import { ThemePanel } from './ThemePanel';

interface AdminTopBarProps {
  /** Ouvre la console développeur. Volontairement hors de la barre visible. */
  onOpenBackendModal: () => void;
  currentPageTitle: string;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onOpenBackendModal, currentPageTitle }) => {
  const { isAdmin, isEditing, setIsEditing, saveCurrentPage, saveStatus, settings } = useCms();
  const [showThemePanel, setShowThemePanel] = useState<boolean>(false);
  const [, setAccentTick] = useState(0);

  // Écouter les changements de thème en direct
  useEffect(() => {
    const onThemeChange = () => setAccentTick((t) => t + 1);
    window.addEventListener('pixiatech-theme-change', onThemeChange);
    return () => window.removeEventListener('pixiatech-theme-change', onThemeChange);
  }, []);

  // Mesure la hauteur réelle de la barre et l'expose à l'ensemble de la page
  // via --admin-bar-h posée sur l'ancêtre commun (#pixia-web). Aucun 42px
  // codé en dur : ResizeObserver suit toute variation (largeur, chargement).
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.getElementById('pixia-web') || document.documentElement;
    const apply = () => {
      root.style.setProperty('--admin-bar-h', `${el.getBoundingClientRect().height}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--admin-bar-h', '0px');
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <>
    <aside
      id="admin-top-bar"
      data-cms-ui="true"
      aria-label="Barre d'administration CMS"
      ref={barRef}
      style={{ minHeight: 42, boxSizing: 'border-box' }}
      className="fixed top-0 left-0 right-0 z-[280] bg-[#0A0A09]/95 backdrop-blur-md border-b border-[#262624] text-[#F5F4F0] px-4 text-xs font-mono select-none shadow-2xl transition-all duration-200 flex items-center"
    >
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#171715] px-2.5 py-1 rounded border border-[#2B2B28]">
            <span
              data-accent-badge
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--accent, #C3F910)' }}
            />
            <span className="font-bold tracking-wider text-[#F5F4F0]">{settings.companyName} CMS</span>
            <span className="text-[#7A7A76] text-[10px] border-l border-[#333] pl-2">Site Web v3</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#9A9A94] bg-[#121211] px-2 py-1 rounded">
            <Layers data-accent-icon className="w-3.5 h-3.5" style={{ color: 'var(--accent, #C3F910)' }} />
            <span>Page active :</span>
            <span className="text-white font-semibold">{currentPageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowThemePanel((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer border"
            style={{
              backgroundColor: showThemePanel ? 'var(--accent-muted, rgba(195,249,16,0.2))' : '#1C1C1A',
              borderColor: showThemePanel ? 'var(--accent, #C3F910)' : '#333330',
              color: showThemePanel ? 'var(--accent, #C3F910)' : '#EDEBE6',
              boxShadow: showThemePanel ? '0 0 12px var(--accent-glow, rgba(195,249,16,0.3))' : 'none',
            }}
            title="Personnaliser les couleurs et l'identité visuelle du site"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>THÈME</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer border"
            style={
              isEditing
                ? {
                    backgroundColor: 'var(--accent, #C3F910)',
                    borderColor: 'var(--accent, #C3F910)',
                    color: '#080808',
                    boxShadow: '0 0 15px var(--accent-glow, rgba(195,249,16,0.35))',
                  }
                : {
                    backgroundColor: '#1C1C1A',
                    borderColor: '#333330',
                    color: '#EDEBE6',
                  }
            }
          >
            {isEditing ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>MODE ÉDITEUR : ACTIF</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#7A7A76]" />
                <span>ACTIVER LE MODE ÉDITION</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => saveCurrentPage()}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 bg-[#171715] hover:bg-[#20201D] text-[#EDEBE6] border border-[#2B2B28] px-3 py-1.5 rounded transition-all cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <span
                      className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--accent, #C3F910)' }}
                    />
                    <span>Enregistrement...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent, #C3F910)' }} />
                    <span className="font-bold" style={{ color: 'var(--accent, #C3F910)' }}>✓ Enregistré</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 font-bold">⚠ Échec de l&apos;enregistrement</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* La console developpeur (JSON / API / export / reglages serveur) n'a
              pas sa place dans l'interface CMS quotidienne : elle reste
              accessible par raccourci, hors du bandeau. */}
          <button
            type="button"
            onClick={onOpenBackendModal}
            className="sr-only focus:not-sr-only focus:px-2.5"
            title="Console developpeur (Ctrl+Shift+D)"
          >
            Console developpeur
          </button>

          <a
            href="/admin/site-web"
            className="p-1.5 text-[#7A7A76] hover:text-[#C3F910] rounded transition-colors cursor-pointer"
            title="Retour au tableau de bord admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
    {showThemePanel && <ThemePanel onClose={() => setShowThemePanel(false)} />}
    </>
  );
};
