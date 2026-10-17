import '@/web/web.css';
import '@/web/cms/cms-text-scale.css';
import { WebCmsShell } from './web-cms-shell';
import { getCmsPages } from '@/lib/site-web/pages-store';

export const metadata = {
  title: 'PixiaTech PXT Fine - Indoor LED Display',
  description:
    'Official product template for PixiaTech PXT Fine indoor LED display, featuring animated LED canvas, ColdLED technology, interactive architectural specs, and 3D cabinet visualization.',
  openGraph: {
    title: 'PixiaTech PXT Fine - Indoor LED Display',
    description:
      'Official product template for PixiaTech PXT Fine indoor LED display.',
    type: 'website',
    siteName: 'PixiaTech',
  },
};

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
    </>
  );
}
