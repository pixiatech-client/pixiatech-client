'use client';

import React from 'react';
import { CmsProvider } from '@/lib/site-web/cms-context';
import { WebCmsBridge } from '@/web/cms/WebCmsBridge';

// Wrapper client : monte le provider CMS et l'interface d'édition pour l'univers /web.
// Le layout reste un server component ; les children RSC sont passés tels quels,
// donc le rendu public est strictement celui d'avant (rien d'ajouté pour un visiteur).
export function WebCmsShell({ children }: { children: React.ReactNode }) {
  return (
    <CmsProvider>
      <WebCmsBridge />
      {children}
    </CmsProvider>
  );
}
