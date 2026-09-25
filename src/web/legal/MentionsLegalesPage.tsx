'use client';

import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { DEFAULT_MENTIONS_LEGALES } from '@/web/data/legal-pages-content';

export function MentionsLegalesPage() {
  return <LegalPageLayout pageData={DEFAULT_MENTIONS_LEGALES} />;
}
