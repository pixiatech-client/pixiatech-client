
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';

function PendingVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg border-slate-300 dark:border-slate-700 text-center">
        <CardHeader className="items-center">
            <div className="flex justify-center w-full mb-4">
                <div className="p-4 rounded-full bg-teal-100 dark:bg-teal-900">
                    <MailCheck className="h-12 w-12 text-teal-600 dark:text-teal-400" />
                </div>
            </div>
            <CardTitle className="text-2xl font-bold text-teal-700 dark:text-teal-400">{t('pendingPage.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('pendingPage.sentTo')}{' '}
            <strong className="text-foreground">{email || 'votre adresse email'}</strong>.
          </p>
           <p className="text-muted-foreground">
            {t('pendingPage.instructions')}
          </p>
           <Alert variant="info" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {t('pendingPage.checkSpam')}
                </AlertDescription>
            </Alert>
        </CardContent>
        <CardFooter className="flex-col gap-4 mt-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('pendingPage.backToSite')}
              </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function PendingVerificationPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <PendingVerificationContent />
        </Suspense>
    )
}
