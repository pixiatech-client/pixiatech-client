
'use client';

import { usePathname } from 'next/navigation';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/header';
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { RoleProvider } from '@/contexts/RoleContext';

import { DynamicThemeProvider } from '@/contexts/DynamicThemeContext';

export function LayoutProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isEmbedPage = pathname.startsWith('/embed') || pathname.startsWith('/chat-widget');
  const isQuotePage = pathname.startsWith('/quote');

  return (
    <FirebaseClientProvider>
      <RoleProvider>
        <I18nProvider>
        <DynamicThemeProvider>
          <div className="flex flex-col bg-background min-h-dvh">
            {!isAdminPage && !isEmbedPage && <Header />}
            <main
              className={cn(
                'flex-1 flex items-start justify-center w-full',
                !isAdminPage && !isQuotePage && !isEmbedPage && 'px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2'
              )}
            >
              {children}
            </main>
            {/* FloatingChatButton removed from here to be moved to the landing page specifically */}
          </div>
        </DynamicThemeProvider>
        <ShadcnToaster />
        <SonnerToaster 
          position="bottom-right" 
          expand={true} 
          richColors 
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#1f2937'
            }
          }}
        />
      </I18nProvider>
      </RoleProvider>
    </FirebaseClientProvider>
  );
}
