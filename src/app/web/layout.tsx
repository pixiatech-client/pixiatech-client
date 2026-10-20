import '@/web/web.css';
import '@/web/cms/cms-text-scale.css';
import { WebCmsShell } from './web-cms-shell';
import { getCmsPages } from '@/lib/site-web/pages-store';
import { IntroPixiaTech } from '@/web/components/IntroPixiaTech';
import { getSettings } from '@/app/actions/public-actions';
import {
  DEFAULT_SITE_TITLE,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_OG_DESCRIPTION,
} from '@/lib/site-identity';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

// Valeurs de repli : utilisées tant qu'aucun titre/description SEO global
// n'a été enregistré depuis l'administration (PixiaTech Web > Paramètres
// généraux > « Identité & SEO »). Source unique : `src/lib/site-identity.ts`.
const FALLBACK_TITLE = DEFAULT_SITE_TITLE;
const FALLBACK_DESCRIPTION = DEFAULT_SITE_DESCRIPTION;
const FALLBACK_OG_DESCRIPTION = DEFAULT_SITE_OG_DESCRIPTION;

/**
 * Métadonnées globales du site marketing. Le titre et la description sont
 * pilotés par les paramètres administrables (settings/main : `seoTitle` /
 * `seoDescription`, bilingue FR/EN) ; les pages filles qui définissent leur
 * propre `generateMetadata` (contact, insights, produits, légales) continuent
 * de remplacer ces valeurs.
 */
export async function generateMetadata(): Promise<Metadata> {
  const title = FALLBACK_TITLE;
  const description = FALLBACK_DESCRIPTION;
  try {
    const settings = await getSettings();
    const locale = (await cookies()).get('admin-locale')?.value;
    const isEn = locale === 'en';
    const seoTitle = isEn
      ? settings.seoTitle?.en || settings.seoTitle?.fr
      : settings.seoTitle?.fr || settings.seoTitle?.en;
    const seoDescription = isEn
      ? settings.seoDescription?.en || settings.seoDescription?.fr
      : settings.seoDescription?.fr || settings.seoDescription?.en;

    const resolvedTitle = seoTitle?.trim() || title;
    const resolvedDescription = seoDescription?.trim() || description;

    return {
      title: resolvedTitle,
      description: resolvedDescription,
      openGraph: {
        title: resolvedTitle,
        description: seoDescription?.trim() || FALLBACK_OG_DESCRIPTION,
        type: 'website',
        siteName: 'PixiaTech',
      },
    };
  } catch (err) {
    console.warn('[WebLayout] getSettings fallback:', err);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description: FALLBACK_OG_DESCRIPTION,
      type: 'website',
      siteName: 'PixiaTech',
    },
  };
}

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  let initialPages = {};
  try {
    initialPages = await getCmsPages();
  } catch (err) {
    console.warn('[WebLayout] getCmsPages fallback:', err);
  }

  return (
    <>
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&amp;display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&amp;display=swap"
      />
      <div
        id="pixia-web"
        className="min-h-screen w-full bg-[#080808] text-[#f5f4f0] antialiased"
        style={{
          paddingTop:
            'calc(var(--admin-bar-h, 0px) + var(--preview-bar-h, 0px) + var(--cms-section-bar-h, 0px))',
        }}
      >
        <WebCmsShell initialPages={initialPages}>{children}</WebCmsShell>
      </div>
      {/* Intro « pixels → texte » : première visite uniquement (localStorage). */}
      <IntroPixiaTech />
    </>
  );
}
