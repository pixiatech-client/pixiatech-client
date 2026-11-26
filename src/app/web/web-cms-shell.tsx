'use client';

import React from 'react';
import { CmsProvider } from '@/lib/site-web/cms-context';
import { ProductsProvider } from '@/lib/products/products-context';
import { WebCmsBridge } from '@/web/cms/WebCmsBridge';

import type { CmsPageData, CmsBackendSettings } from '@/lib/site-web/cms-types';

// Wrapper client : monte le provider CMS et l'interface d'édition pour l'univers /web.
// Le layout reste un server component ; les children RSC sont passés tels quels,
// donc le rendu public est strictement celui d'avant (rien d'ajouté pour un visiteur).
export function WebCmsShell({
  children,
  initialPages,
  initialSettings,
}: {
  children: React.ReactNode;
  initialPages?: Record<string, CmsPageData>;
  initialSettings?: CmsBackendSettings;
}) {
  return (
    <CmsProvider initialPages={initialPages} initialSettings={initialSettings}>
      {/* L'UI CMS est montée en dehors des pages : elle doit lire le même
          document produit que la fiche, sans dépendre du provider interne
          de chaque page. Les abonnements Firestore synchronisent les deux. */}
      <ProductsProvider>
        <WebCmsBridge />
      </ProductsProvider>
      {children}
    </CmsProvider>
  );
}
