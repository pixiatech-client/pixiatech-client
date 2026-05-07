
'use server';

import { getQuoteRequest, getProducts, getDeliverySettings, getPdfSettings, getProductSpecs, getLaborSettings, getSettings, getUserRole } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminQuoteDetails from './_components/admin-quote-details';
import type { City, Product, QuoteRequest } from '@/lib/types';
import { cookies } from 'next/headers';
import { SupplierQuoteDetails } from './_components/supplier-quote-details';

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  if (!id) {
    return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> Erreur
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>ID d'estimation manquant.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">Retour à la liste</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  const [quoteData, productsResult, deliverySettings, specs] = await Promise.all([
    getQuoteRequest(id),
    getProducts({ limit: 1000 }),
    getDeliverySettings(),
    getProductSpecs()
  ]);

  if (!quoteData || !productsResult) {
     return (
        <Card className="m-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> Estimation non trouvée
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>Impossible de trouver l'estimation ou les produits avec l'ID : {id}</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/quote-requests">Retour à la liste</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  const allProducts: Product[] = productsResult.products;
  
  const sessionCookie = cookies().get('session')?.value;
  const userRole = sessionCookie ? await getUserRole(sessionCookie) : null;
  
  if (userRole === 'fournisseur') {
    // If the user is a supplier, show only the simplified details view.
    return (
        <SupplierQuoteDetails
          quote={quoteData as QuoteRequest}
          allProducts={allProducts}
          specs={specs}
        />
    )
  }

  // Otherwise, show the full admin details view.
  return <AdminQuoteDetails 
            quote={quoteData as QuoteRequest}
            allProducts={allProducts}
            deliverySettings={deliverySettings}
        />;
}
