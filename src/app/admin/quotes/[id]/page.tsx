
'use server';

import { getQuoteRequest, getProducts, getDeliverySettings, getPdfSettings, getProductSpecs, getLaborSettings, getSettings, getUsers } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminDetailsWrapper from './_components/AdminDetailsWrapper';
import type { City, Product, QuoteRequest } from '@/lib/types';

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
    return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Missing estimation ID.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">Back to list</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  const [quoteData, productsResult, deliverySettings, specs, suppliers] = await Promise.all([
    getQuoteRequest(id),
    getProducts({ limit: 1000 }),
    getDeliverySettings(),
    getProductSpecs(),
    getUsers({ limit: 100, userStatus: 'approved' }).then(res => res.users.filter(u => u.role === 'fournisseur'))
  ]);

  if (!quoteData || !productsResult) {
     return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> Estimation not found
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Unable to find estimation or products with ID: {id}</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">Back to list</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  const allProducts: Product[] = productsResult.products;
  
  // The new premium DetailsApp handles both Admin and Supplier profiles internally based on the user session.
  return <AdminDetailsWrapper 
            quote={quoteData as QuoteRequest}
            allProducts={allProducts}
            allProductSpecs={specs}
            suppliers={suppliers}
        />;
}
