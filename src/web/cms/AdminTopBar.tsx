'use client';

import React, { useEffect, useRef } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Edit3, Eye, Save, CheckCircle2, Server, LogOut, Layers } from 'lucide-react';

interface AdminTopBarProps {
  onOpenBackendModal: () => void;
  currentPageTitle: string;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onOpenBackendModal, currentPageTitle }) => {
  const { isAdmin, isEditing, setIsEditing, saveCurrentPage, saveStatus, backendConnected, settings } = useCms();

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
            <span className="w-2 h-2 rounded-full bg-[#C3F910] animate-pulse" />
            <span className="font-bold tracking-wider text-[#F5F4F0]">{settings.companyName} CMS</span>
            <span className="text-[#7A7A76] text-[10px] border-l border-[#333] pl-2">Site Web v3</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#9A9A94] bg-[#121211] px-2 py-1 rounded">
            <Layers className="w-3.5 h-3.5 text-[#C3F910]" />
            <span>Page active :</span>
            <span className="text-white font-semibold">{currentPageTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer border ${
              isEditing
                ? 'bg-[#C3F910] text-[#080808] border-[#C3F910] shadow-[0_0_15px_rgba(195,249,16,0.35)]'
                : 'bg-[#1C1C1A] text-[#EDEBE6] border-[#333330] hover:border-[#555]'
            }`}
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
          <button
            type="button"
            onClick={() => saveCurrentPage()}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 bg-[#171715] hover:bg-[#20201D] text-[#EDEBE6] hover:text-[#C3F910] border border-[#2B2B28] hover:border-[#C3F910]/50 px-3 py-1.5 rounded transition-all cursor-pointer"
          >
            {saveStatus === 'saving' ? (
              <>
                <span className="w-3 h-3 border-2 border-[#C3F910] border-t-transparent rounded-full animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C3F910]" />
                <span className="text-[#C3F910] font-bold">Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenBackendModal}
            className="flex items-center gap-1.5 bg-[#171715] hover:bg-[#20201D] text-[#9A9A94] hover:text-white border border-[#2B2B28] px-2.5 py-1.5 rounded transition-colors cursor-pointer"
            title="Console développeur & export JSON"
          >
            <Server className={`w-3.5 h-3.5 ${backendConnected ? 'text-[#C3F910]' : 'text-amber-400'}`} />
            <span className="hidden md:inline">Pixel Tech Web</span>
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
  );
};
