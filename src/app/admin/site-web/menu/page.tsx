'use client';

import { LayoutTemplate } from 'lucide-react';
import { ConstructionShell } from '../_components/ConstructionShell';

export default function SiteWebMenuPage() {
  return (
    <ConstructionShell
      icon={<LayoutTemplate className="h-5 w-5" />}
      title="Menu du site"
      badge="Menu"
      description="Navigation & liens affichés sur le site public"
      comingSoon={[
        'Liens de la barre de navigation',
        'Liens du pied de page',
        'Réseaux sociaux & coordonnées',
        "Boutons d'appel à l'action",
      ]}
    />
  );
}