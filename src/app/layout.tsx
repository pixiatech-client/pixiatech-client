
import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import Script from 'next/script';
import { cookies } from 'next/headers';
import './globals.css';
import { LayoutProvider } from '@/components/layout-provider';
import { I18nProvider } from '@/lib/i18n';
import { getSettings, getActiveGlobalTheme } from '@/app/actions/public-actions';
import { resolveTheme, buildThemeCss } from '@/lib/theme-utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pixiatech.com'),
  title: {
    default: 'PixiaTech | Estimation',
    template: '%s | PixiaTech',
  },
  description: 'Générez des estimations pour des écrans LED',
  openGraph: {
    title: 'PixiaTech | Estimation',
    description: 'Générez des estimations pour des écrans LED',
    type: 'website',
    siteName: 'PixiaTech',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

// Viewport séparé pour Next.js 14+ — empêche le navigateur de compenser
// lui-même le DPI Windows (notre CSS zoom gère ça proprement)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('admin-locale')?.value === 'en' ? 'en' : 'fr';

  const [settings, activeThemeResult] = await Promise.all([getSettings(), getActiveGlobalTheme()]);
  const globalTheme = resolveTheme(activeThemeResult.themeId);
  const themeCss = buildThemeCss(globalTheme);
  const isDark = globalTheme.mode === 'dark';
  const boutiqueB2B = settings.estimationFlow?.boutiqueB2B ?? false;
  const boutiqueEnabled = settings.isBoutiqueEnabled !== false;

  return (
    <html lang="en" className={`scroll-smooth${isDark ? ' dark' : ''}`} suppressHydrationWarning>
      <head>
        {/* Favicon forcé explicitement pour tous les environnements (local + production) */}
        <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} font-body antialiased min-h-[100dvh]${isDark ? ' dark-theme' : ' light-theme'}`} suppressHydrationWarning>
        <div className="flare cyan" aria-hidden="true" />
        <div className="flare magenta" aria-hidden="true" />
        <div className="directional-flare" aria-hidden="true" suppressHydrationWarning />
        <I18nProvider initialLocale={locale}>
          <LayoutProvider
            initialBoutiqueB2B={boutiqueB2B}
            initialBoutiqueEnabled={boutiqueEnabled}
            initialThemeName={globalTheme.name}
          >
            {children}
          </LayoutProvider>
        </I18nProvider>
        <Script id="directional-flare" strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener("mousemove", (e) => {
                const directionalFlare = document.querySelector(".directional-flare");
                if (!directionalFlare) return;
                const { clientX, clientY } = e;
                directionalFlare.style.opacity = "1";
                directionalFlare.style.transform = "translate(" +
                  (clientX - directionalFlare.offsetWidth / 2) + "px, " +
                  (clientY - directionalFlare.offsetHeight / 2) + "px)";
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
