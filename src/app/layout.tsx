
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { LayoutProvider } from '@/components/layout-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PixiaTech | Estimation',
  description: 'Générez des estimations pour des écrans LED',
};

// Viewport séparé pour Next.js 14+ — empêche le navigateur de compenser
// lui-même le DPI Windows (notre CSS zoom gère ça proprement)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased min-h-[100dvh] bg-[#F5F5F5]`} suppressHydrationWarning>
        <div className="flare cyan" aria-hidden="true" />
        <div className="flare magenta" aria-hidden="true" />
        <div className="directional-flare" aria-hidden="true" suppressHydrationWarning />
        <LayoutProvider>{children}</LayoutProvider>
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
