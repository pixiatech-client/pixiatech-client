'use client';

import React from 'react';
import { CmsProvider } from '@/lib/site-web/cms-context';

/**
 * Layout pour /admin/site-web et ses sous-routes.
 * Monte le CmsProvider nécessaire aux pages d'administration du site web.
 */
export default function SiteWebAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CmsProvider>{children}</CmsProvider>;
}
