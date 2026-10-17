'use client';

import React from 'react';
import { CmsProvider } from '@/lib/site-web/cms-context';
import { WebCmsBridge } from '@/web/cms/WebCmsBridge';

import type { CmsPageData } from '@/lib/site-web/cms-types';

// Wrapper client : monte le provider CMS et l'interface d'édition pour l'univers /web.
// Le layout reste un server component ; les children RSC sont passés tels quels,
// donc le rendu public est strictement celui d'avant (rien d'ajouté pour un visiteur).
export function WebCmsShell({
  children,
  initialPages,
}: {
  children: React.ReactNode;
  initialPages?: Record<string, CmsPageData>;
}) {
  return (
    <CmsProvider initialPages={initialPages}>
      <WebCmsBridge />
      {children}
    </CmsProvider>
  );
}
