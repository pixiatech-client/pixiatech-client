'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { QuoteRequest, Product, ProductSpec, UserProfile } from '@/lib/types';
import { EstimationStatus, Estimation } from '@/app/admin/quote-requests/_components/estimation/types';
import { useRouter } from 'next/navigation';

const DetailsApp = dynamic(() => import('@/app/admin/quote-requests/_components/estimation/details/App'), {
  loading: () => <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110]"><div className="w-10 h-10 border-4 border-[#95d230] border-t-transparent rounded-full animate-spin" /></div>,
});

const statusToEstimation: Record<string, EstimationStatus> = {
  'pending': 'En attente',
  'processed': 'Traité',
  'in_progress': 'Fournisseur',
  'sent': 'Livraison',
  'archived': 'Archivé',
  'trashed': 'Corbeille',
  'returned': 'Retourné',
};

function quoteToEstimation(q: QuoteRequest): Estimation {
  const rawDate = q.createdAt ? (q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt)) : null;
  const isValidDate = rawDate && !isNaN(rawDate.getTime());
  const estStatus = statusToEstimation[q.status] || 'En attente';

  const idShort = q.id.slice(0, 8).toUpperCase();

   return {
     id: q.id,
     number: q.number || `DEV-${idShort}`,
     client: typeof q.client === 'string' ? q.client : (q.client?.companyName || (q.client as any)?.name || 'Client Inconnu'),
     phone: (q.client && typeof q.client === 'object' ? q.client.phone : (q as any).phone) || '',
     email: (q.client && typeof q.client === 'object' ? q.client.email : (q as any).email) || '',
     status: estStatus,
     time: isValidDate ? rawDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
     date: isValidDate ? rawDate.toLocaleDateString('fr-FR') : '--/--/----',
     totalPurchase: (q as any).totalPurchase || 0,
     totalClient: (q as any).totalClient || q.totalQuote || 0,
     reference: idShort,
     trackingNumber: (q as any).trackingNumber,
     supplierId: (q as any).supplierId,
     isReturned: (q as any).isReturned || false,
     returnReason: (q as any).returnReason,
     supplierNotes: (q as any).supplierNotes,
     treatedBy: (q as any).treatedBy,
     treatedByName: (q as any).treatedByName,
     treatedByRole: (q as any).treatedByRole,
     treatedAt: (q as any).treatedAt,
     emailVerified: (q as any).emailVerified,
     sitePhoto: q.sitePhoto || (q.client && typeof q.client === 'object' ? (q.client as any).sitePhoto : undefined),
     pdfUrl: q.pdfUrl,
   };
}

interface AdminDetailsWrapperProps {
  quote: QuoteRequest;
  allProducts: Product[];
  allProductSpecs: Record<string, ProductSpec[]>;
  suppliers: UserProfile[];
}

export default function AdminDetailsWrapper({ quote, allProducts, allProductSpecs, suppliers }: AdminDetailsWrapperProps) {
  const router = useRouter();
  const estimation = quoteToEstimation(quote);

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8f9fb]">
      <DetailsApp 
        initialEstimation={estimation}
        allProducts={allProducts}
        allProductSpecs={allProductSpecs}
        startOpen={true}
        onClose={() => router.push('/admin/quote-requests')}
        suppliers={suppliers}
      />
    </div>
  );
}
