'use client';

import Product3DModule from '@/components/product-3d/Product3DModule';

interface DesignSectionProps {
  // Conservés pour compatibilité avec les gabarits existants : le module 3D
  // d'origine porte lui-même toute la section « Conception & Dimensions ».
  lang?: string;
  data?: unknown;
  hasSpecsTable?: boolean;
  modelId?: string | null;
  installationMode?: string;
}

export const DesignSection: React.FC<DesignSectionProps> = ({ modelId }) => (
  <section id="design" className="section theme-dark design-section">
    <Product3DModule modelId={modelId} />
  </section>
);

export default DesignSection;
