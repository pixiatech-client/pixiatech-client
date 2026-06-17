
'use client';

import { useEffect, useState, use } from 'react';
import { getQuoteRequest, getProducts, getDeliverySettings, getProductSpecs, getLaborSettings, getSettings, getUsers } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminDetailsWrapper from './_components/AdminDetailsWrapper';
import type { City, Product, ProductSpec, QuoteRequest, UserProfile } from '@/lib/types';
import { useAdminT } from '@/hooks/useAdminT';

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useAdminT();
  const { id } = use(params);
  const [quoteData, setQuoteData] = useState<QuoteRequest | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [specs, setSpecs] = useState<Record<string, ProductSpec[]>>({});
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getQuoteRequest(id),
      getProducts({ limit: 1000 }),
      getProductSpecs(),
      getUsers({ limit: 100, userStatus: 'approved' }).then(res => res.users.filter(u => u.role === 'fournisseur'))
    ]).then(([quoteData, productsResult, specs, suppliers]) => {
      if (!quoteData || !productsResult) {
        setError('not_found');
      } else {
        setQuoteData(quoteData as QuoteRequest);
        setAllProducts(productsResult.products);
        setSpecs(specs);
        setSuppliers(suppliers);
      }
    }).catch(() => setError('error'))
    .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> {t('Error')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{t('Missing estimation ID.')}</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">{t('Back to list')}</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  if (loading) {
    return (
      <Card className="m-auto">
        <CardContent className="p-6 text-center">
          <p>{t('Loading...')}</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !quoteData || allProducts.length === 0) {
     return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> {error === 'not_found' ? t('Estimation not found') : t('Error')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{t('Unable to load details.')}</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">{t('Back to list')}</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  return <AdminDetailsWrapper 
            quote={quoteData}
            allProducts={allProducts}
            allProductSpecs={specs}
            suppliers={suppliers}
        />;
}
