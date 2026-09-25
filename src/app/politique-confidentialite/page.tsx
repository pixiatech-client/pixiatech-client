import type { Metadata } from 'next';
import { WebCmsShell } from '@/app/web/web-cms-shell';
import { PolitiqueConfidentialitePage } from '@/web/legal/PolitiqueConfidentialitePage';
import '@/web/web.css';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité & RGPD · PIXIATECH',
  description: 'Politique de protection des données personnelles et conformité RGPD de PIXIATECH SASU.',
  openGraph: {
    title: 'Politique de Confidentialité · PIXIATECH',
    description: 'Protection des données et respect de votre vie privée par PIXIATECH.',
    type: 'website',
  },
};

export default function PolitiqueConfidentialiteRoute() {
  return (
    <div id="pixia-web" className="min-h-screen w-full bg-[#080808] text-[#f5f4f0] antialiased">
      <WebCmsShell>
        <PolitiqueConfidentialitePage />
      </WebCmsShell>
    </div>
  );
}
