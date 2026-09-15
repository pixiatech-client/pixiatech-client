'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useUser } from '@/firebase';
import { getInvoiceRequests } from '@/app/admin/actions';
import type { InvoiceRequestSummary } from '@/lib/invoices';
import { AdminInvoicesView } from './_components/AdminInvoicesView';
import { ShieldAlert, Loader2 } from 'lucide-react';

const ALLOWED_ROLES = ['admin', 'commercial'];

export default function AdminFacturesPage() {
  const { t } = useI18n();
  const { userProfile, isUserLoading } = useUser();
  const [requests, setRequests] = useState<InvoiceRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const role = userProfile?.role;
  const isAllowed = !isUserLoading && role && ALLOWED_ROLES.includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const items = await getInvoiceRequests();
      setRequests(items);
    } catch {
      setError(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) return;
    load();
  }, [isAllowed, load]);

  if (isUserLoading || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <Card className="m-auto max-w-lg border-rose-200">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin.factures.notAllowed')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('admin.factures.notAllowedDesc')}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin">{t('admin.factures.backToDashboard')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <AdminInvoicesView requests={requests} loading={loading} error={error} onRefresh={load} />
    </div>
  );
}