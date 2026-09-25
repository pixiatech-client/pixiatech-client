import type { Metadata } from 'next';
import { WebCmsShell } from '@/app/web/web-cms-shell';
import { MentionsLegalesPage } from '@/web/legal/MentionsLegalesPage';
import '@/web/web.css';

export const metadata: Metadata = {
  title: 'Mentions Légales & CGV/CGL · PIXIATECH',
  description: 'Conditions générales de vente, de prestations et de location, informations légales de la société PIXIATECH SASU.',
  openGraph: {
    title: 'Mentions Légales · PIXIATECH',
    description: 'Conditions générales et informations légales de PIXIATECH.',
    type: 'website',
  },
};

export default function MentionsLegalesRoute() {
  return (
    <div id="pixia-web" className="min-h-screen w-full bg-[#080808] text-[#f5f4f0] antialiased">
      <WebCmsShell>
        <MentionsLegalesPage />
      </WebCmsShell>
    </div>
  );
}
