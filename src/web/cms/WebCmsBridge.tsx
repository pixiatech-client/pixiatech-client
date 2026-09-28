'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { AdminTopBar } from './AdminTopBar';
import { BackendExportModal } from './BackendExportModal';
import { VisualInPlaceEditor } from './VisualInPlaceEditor';
import { useCmsElementStyles } from './useCmsElementStyles';

// Pont CMS pour l'univers /web.
// L'authentification se fait UNIQUEMENT côté serveur (session admin /admin).
// Le rendu public (/web) est strictement identique pour les visiteurs : aucune UI CMS.

export const WebCmsBridge: React.FC = () => {
  const { isAdmin, pages, currentPageId } = useCms();
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Réapplique les styles d'élément enregistrés par la barre contextuelle
  // (couleurs, tailles, alignement, décalages). Monté AVANT le retour anticipé
  // pour que ces styles valent aussi pour les visiteurs et après un refresh —
  // sinon une modification validée n'existerait que le temps d'une session
  // d'édition.
  useCmsElementStyles();

  const pageTitle = useMemo(() => {
    const page = pages[currentPageId];
    if (page?.name) return page.name;
    return currentPageId === 'product_wp' ? 'Produit : PXT Fine' : "Page d'Accueil & Showreel";
  }, [pages, currentPageId]);

  // La console developpeur (JSON brut, API, export, reglages serveur) n'est
  // plus un bouton de la barre d'edition : elle reste accessible par
  // Ctrl+Shift+D, donc hors du quotidien CMS sans etre supprimee.
  useEffect(() => {
    if (!isAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsBackendModalOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAdmin]);

  // Visiteur non authentifié : AUCUN contenu CMS ajouté.
  if (!isAdmin) return null;

  return (
    <React.Fragment>
      {/* Interface Admin Complète lorsqu'on est connecté */}
      <>
        <AdminTopBar onOpenBackendModal={() => setIsBackendModalOpen(true)} currentPageTitle={pageTitle} />
        <BackendExportModal isOpen={isBackendModalOpen} onClose={() => setIsBackendModalOpen(false)} />
        {/* Éditeur Visuel Direct : Clic sur n'importe quel texte ou photo pour modifier.
            Toute l'UI de style vit désormais dans la barre contextuelle
            EditableWrapper (SectionStylePanel) — l'ancien ElementorDrawer a été retiré. */}
        <VisualInPlaceEditor />
      </>
    </React.Fragment>
  );
};
