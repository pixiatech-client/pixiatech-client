'use client';

import { Box } from 'lucide-react';
import { ConstructionShell } from '../_components/ConstructionShell';

export default function SiteWebProduitsPage() {
  return (
    <ConstructionShell
      icon={<Box className="h-5 w-5" />}
      title="Produits & Solutions"
      badge="Catalogue"
      description="Écrans LED, murs d'images et solutions visuelles"
      comingSoon={[
        "Catalogue des gammes (WP Series, Fine Pitch, Outdoor)",
        'Fiches produits & fiches techniques',
        "Tarifs et configurations d'écran",
        'Showroom & démonstrations',
      ]}
    />
  );
}