'use client';

import Product3DModule from '@/components/product-3d/Product3DModule';
import { Product3DConfigProvider } from '@/components/product-3d/config-context';

interface DesignSectionProps {
  // Conservés pour compatibilité avec les gabarits existants : le module 3D
  // d'origine porte lui-même toute la section « Conception & Dimensions ».
  lang?: string;
  data?: unknown;
  hasSpecsTable?: boolean;
  modelId?: string | null;
  installationMode?: string;
  /** Configuration CMS du produit : réglages et vidéos par modèle. */
  config?: React.ComponentProps<typeof Product3DConfigProvider>['value'];
}

export const DesignSection: React.FC<DesignSectionProps> = ({ modelId, config }) => (
  <section id="design" className="section theme-dark design-section">
    <Product3DConfigProvider value={config}>
      <Product3DModule modelId={modelId} />
    </Product3DConfigProvider>
  </section>
);

export default DesignSection;
