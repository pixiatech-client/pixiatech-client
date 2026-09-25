import type { Metadata } from 'next';
import { WebCmsShell } from '@/app/web/web-cms-shell';
import { GestionCookiesPage } from '@/web/legal/GestionCookiesPage';
import '@/web/web.css';

export const metadata: Metadata = {
  title: 'Gestion des Cookies & Préférences · PIXIATECH',
  description: 'Politique officielle de gestion des cookies et paramétrage de vos préférences de traçage selon les directives CNIL.',
  openGraph: {
    title: 'Gestion des Cookies · PIXIATECH',
    description: 'Gestion de vos choix et préférences cookies sur PIXIATECH.',
    type: 'website',
  },
};

export default function GestionCookiesRoute() {
  return (
    <div id="pixia-web" className="min-h-screen w-full bg-[#080808] text-[#f5f4f0] antialiased">
      <WebCmsShell>
        <GestionCookiesPage />
      </WebCmsShell>
    </div>
  );
}
