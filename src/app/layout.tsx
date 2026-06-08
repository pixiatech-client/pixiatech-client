
import type { Metadata } from 'next';
import './globals.css';
import { LayoutProvider } from '@/components/layout-provider';

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
      <body className="font-body antialiased min-h-[100dvh] bg-white">
        <div className="flare cyan" aria-hidden="true" />
        <div className="flare magenta" aria-hidden="true" />
        <div className="directional-flare" aria-hidden="true" />
        <LayoutProvider>{children}</LayoutProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Mouse move listener for the interactive directional flare
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
