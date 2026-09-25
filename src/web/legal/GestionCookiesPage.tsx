'use client';

import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { DEFAULT_GESTION_COOKIES } from '@/web/data/legal-pages-content';

export function GestionCookiesPage() {
  return <LegalPageLayout pageData={DEFAULT_GESTION_COOKIES} pageKey="gestion_cookies" isCookiePage={true} />;
}
