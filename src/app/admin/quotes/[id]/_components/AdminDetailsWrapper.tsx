'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { QuoteRequest, Product, ProductSpec, UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

const DetailsApp = dynamic(
  () => import('@/app/admin/quote-requests/_components/estimation/details/App'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110]">
        <div className="w-10 h-10 border-4 border-[#95d230] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface AdminDetailsWrapperProps {
  quote: QuoteRequest;
  allProducts: Product[];
  allProductSpecs: Record<string, ProductSpec[]>;
  suppliers: UserProfile[];
}

export default function AdminDetailsWrapper({
  quote,
  allProducts,
  allProductSpecs,
  suppliers,
}: AdminDetailsWrapperProps) {
  const router = useRouter();

  const handleSave = (_updatedQuote: any) => {
    // Invalide le cache Next.js du server component.
    // La prochaine ouverture de cette estimation re-fetchera les données fraîches
    // depuis Firestore, sans nécessiter un F5 manuel.
    router.refresh();
  };

  const handleClose = () => {
    // Rafraîchit le cache avant de rediriger.
    router.refresh();
    router.push('/admin/quote-requests');
  };

  // On passe le quote brut (QuoteRequest) directement à DetailsApp.
  // App.tsx mappe client.notes, dates de location, etc. depuis cet objet.
  // Évite toute perte de données lors d'une transformation intermédiaire.
  return (
    <div className="fixed inset-0 z-[100] bg-[#f8f9fb]">
      <DetailsApp
        initialEstimation={quote}
        allProducts={allProducts}
        allProductSpecs={allProductSpecs}
        startOpen={true}
        onClose={handleClose}
        suppliers={suppliers}
        onSave={handleSave}
      />
    </div>
  );
}
