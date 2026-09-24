'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Globe,
  ExternalLink,
  PenSquare,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileJson,
  Image as ImageIcon,
  Settings2,
} from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';

interface StatusInfo {
  online: boolean;
  message: string;
  pagesCount?: number;
  dataFile?: string;
}

const DASHBOARD_PAGES = [
  {
    id: 'home',
    name: 'Accueil & Showreel',
    slug: '/web',
    editorPath: '/web',
    description: "Showreel 3D immersif, hero, marchés, kinetic, manifeste",
    sections: ['Hero', 'Showreel', 'Marchés', 'Kinetic', 'Manifeste'],
  },
  {
    id: 'product_wp',
    name: 'Produit : PXT Fine',
    slug: '/web/pxt-fine',
    editorPath: '/web/pxt-fine',
    description: "Fiche produit écran LED PXT Fine (WP series)",
    sections: ['Hero', 'Aperçu', 'Conception', 'Caractéristiques', 'Réalisations'],
  },
  {
    id: 'contact',
    name: 'Contact & Paramètres',
    slug: '/web#contact',
    editorPath: '/web',
    description: "Paramètres généraux (coordonnées, couleurs, nom d'entreprise)",
    sections: ['Paramètres', 'Coordonnées'],
  },
];

export default function SiteWebDashboardPage() {
  const { backendConnected, isAdmin, saveStatus, resetPageToDefault, settings } = useCms();
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/site-web/status');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          online: true,
          message: data?.message || 'API opérationnelle',
          pagesCount: data?.pagesCount,
          dataFile: data?.dataFile,
        });
      } else {
        setStatus({ online: false, message: `Erreur ${res.status} — vérifiez la session administrateur` });
      }
    } catch (err) {
      setStatus({ online: false, message: 'API injoignable' });
    } finally {
      setRefreshing(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#8a8880] mb-2 font-mono">
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Site Web · Tableau de bord</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Éditeur du site web public</h1>
            <p className="text-[13.5px] text-[#6b6a66] mt-1 max-w-xl">
              Pages, textes, photos et paramètres gérés par le CMS — même authentification administrateur,
              sauvegarde persistée côté serveur.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkStatus}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6b6a66] border border-[#d8d6d0] hover:border-[#111] hover:text-[#111] bg-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Vérifier le statut
            </button>
            <Link
              href="/web"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#111] hover:bg-black px-3.5 py-2 rounded-lg transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              Voir le site public
            </Link>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e7e5df] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8a8880] font-semibold">Statut API CMS</span>
            {status ? (
              status.online ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> En ligne
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                  <XCircle className="h-3.5 w-3.5" /> Hors ligne
                </span>
              )
            ) : (
              <span className="text-[11px] text-[#b5b3ad]">—</span>
            )}
          </div>
          <p className="text-[13px] text-[#6b6a66] leading-snug">
            {status
              ? status.message
              : refreshing
              ? 'Vérification en cours…'
              : 'Statut inconnu — cliquez sur « Vérifier ».'}
          </p>
          {status?.pagesCount !== undefined && (
            <p className="text-[11px] font-mono text-[#b5b3ad] mt-2">
              Pages enregistrées : {status.pagesCount}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#e7e5df] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8a8880] font-semibold">Authentification</span>
            <span
              className={`flex items-center gap-1 text-[11px] font-bold ${isAdmin ? 'text-emerald-600' : 'text-amber-500'}`}
            >
              <Server className="h-3.5 w-3.5" /> {isAdmin ? 'Administrateur' : 'Non vérifiée'}
            </span>
          </div>
          <p className="text-[13px] text-[#6b6a66] leading-snug">
            {isAdmin
              ? 'Session admin valide — l’éditeur sera actif sur /web.' 
              : 'La vérification n’a pas encore abouti. L’éditeur s’active uniquement pour une session administrateur.'}
          </p>
        </div>

        <div className="bg-white border border-[#e7e5df] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8a8880] font-semibold">Persistance</span>
            <span className={`flex items-center gap-1 text-[11px] font-bold ${backendConnected ? 'text-emerald-600' : 'text-amber-500'}`}>
              <FileJson className="h-3.5 w-3.5" /> {backendConnected ? 'JSON + API' : 'localement'}
            </span>
          </div>
          <p className="text-[13px] text-[#6b6a66] leading-snug">
            {backendConnected
              ? 'Connexion au serveur de données établie — les sauvegardes sont persistées.'
              : 'Serveur de données non joignable pour l’instant (fallback local actif).'}
          </p>
          {lastCheck && (
            <p className="text-[11px] font-mono text-[#b5b3ad] mt-2">
              Dernière vérification : {lastCheck.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {/* Editable pages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#111]">Pages éditables</h2>
          <span className="text-[11px] uppercase tracking-widest text-[#8a8880] font-mono">
            Ouvrez puis cliquez « Activer le mode édition » en haut de la page
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DASHBOARD_PAGES.map((page) => (
            <div key={page.id} className="bg-white border border-[#e7e5df] rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#f0eee9] flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#111] text-[15px]">{page.name}</div>
                  <div className="text-[12px] text-[#8a8880] mt-0.5 font-mono">{page.slug}</div>
                </div>
                <span className="text-[10.5px] font-mono bg-[#f4f2ed] text-[#6b6a66] border border-[#e5e3dc] px-2 py-0.5 rounded whitespace-nowrap">
                  {page.sections.length} sections
                </span>
              </div>
              <div className="px-5 py-3 flex-1">
                <p className="text-[13px] text-[#6b6a66] leading-snug mb-3">{page.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {page.sections.map((s) => (
                    <span key={s} className="text-[10.5px] font-mono text-[#8a8880] bg-[#faf9f6] border border-[#ecebe5] px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-[#f0eee9] flex items-center gap-2">
                <Link
                  href={page.editorPath}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#C3F910] hover:bg-[#b0e20e] text-[#0a0a09] font-bold text-[12px] py-2.5 rounded-lg transition-colors"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Ouvrir l’éditeur
                </Link>
                <Link
                  href={page.editorPath}
                  title="Voir la page"
                  className="flex items-center justify-center w-10 h-10 border border-[#d8d6d0] text-[#6b6a66] hover:text-[#111] hover:border-[#111] rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tools row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0d0c] text-[#f5f4f0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-4 w-4 text-[#C3F910]" />
            <span className="font-bold text-[14px]">Intégration technique</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-mono">
            {[
              'GET /api/site-web/pages — public',
              'GET /api/site-web/pages/:id — public',
              'GET /api/site-web/status — admin',
              'PUT /api/site-web/pages/:id — admin',
              'PUT /api/site-web/settings — admin',
              'POST /api/site-web/upload — admin',
              'POST /api/site-web/reset — admin',
              'GET /api/site-web/settings — public',
            ].map((ep) => (
              <div key={ep} className="text-[#9a9a94] bg-[#161614] border border-[#222220] px-3 py-1.5 rounded">
                {ep}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e7e5df] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#8a8880]" />
            <span className="text-[14px] text-[#111] font-bold">Flux de travail</span>
          </div>
          <ol className="space-y-2.5 text-[13px] text-[#5c5a55]">
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-[#111]">1.</span>
              Ouvrez la page concernée via « Ouvrir l’éditeur ».
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-[#111]">2.</span>
              Cliquez « Activer le mode édition » (top bar) puis survolez une section.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-[#111]">3.</span>
              Modifiez textes / photos dans le panneau, puis « Enregistrer cette page ».
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-[#111]">4.</span>
              Rechargez pour voir la version publiée (visiteurs inclus).
            </li>
          </ol>
          <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-between">
            <span className="text-[11px] text-[#8a8880]">Statut de la dernière sauvegarde</span>
            <span className="text-[12px] font-bold font-mono">
              {saveStatus === 'saved' ? 'Enregistrée ✓' : saveStatus === 'saving' ? 'En cours…' : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}