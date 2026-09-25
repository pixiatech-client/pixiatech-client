'use client';

import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { DEFAULT_POLITIQUE_CONFIDENTIALITE } from '@/web/data/legal-pages-content';

export function PolitiqueConfidentialitePage() {
  return <LegalPageLayout pageData={DEFAULT_POLITIQUE_CONFIDENTIALITE} />;
}
