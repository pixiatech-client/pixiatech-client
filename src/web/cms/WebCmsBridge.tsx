'use client';

import React, { useState, useMemo } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { AdminTopBar } from './AdminTopBar';
import { ElementorDrawer } from './ElementorDrawer';
import { BackendExportModal } from './BackendExportModal';
import { VisualInPlaceEditor } from './VisualInPlaceEditor';

// Pont CMS pour l'univers /web.
// L'authentification se fait UNIQUEMENT côté serveur (session admin /admin).
// Le rendu public (/web) est strictement identique pour les visiteurs : aucune UI CMS.

export const WebCmsBridge: React.FC = () => {
  const { isAdmin, pages, currentPageId } = useCms();
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const page = pages[currentPageId];
    if (page?.name) return page.name;
    return currentPageId === 'product_wp' ? 'Produit : PXT Fine' : "Page d'Accueil & Showreel";
  }, [pages, currentPageId]);

  // Visiteur non authentifié : AUCUN contenu CMS ajouté.
  if (!isAdmin) return null;

  return (
    <React.Fragment>
      {/* Interface Admin Complète lorsqu'on est connecté */}
      <>
        <AdminTopBar onOpenBackendModal={() => setIsBackendModalOpen(true)} currentPageTitle={pageTitle} />
        <ElementorDrawer onOpenBackendModal={() => setIsBackendModalOpen(true)} />
        <BackendExportModal isOpen={isBackendModalOpen} onClose={() => setIsBackendModalOpen(false)} />
        {/* Éditeur Visuel Direct : Clic sur n'importe quel texte ou photo pour modifier */}
        <VisualInPlaceEditor />
      </>
    </React.Fragment>
  );
};