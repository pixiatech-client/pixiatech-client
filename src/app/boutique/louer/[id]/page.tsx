'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { saveQuoteState } from '@/lib/quote-persistence';
import { fetchBoutiqueProduct } from '@/lib/boutique-data';
import LiquidLoader from '@/components/LiquidLoader';

export default function QuickRentPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      if (!params.id) return;
      try {
        const product = await fetchBoutiqueProduct(params.id as string);
        const config = {
          id: `quick_rent_${Date.now()}`,
          productId: product.id,
          productType: 'indoor' as const,
          width: 1,
          height: 1,
          quantity: 1,
          transactionType: 'rental' as const,
          rentalDuration: 1,
          rentalUnit: 'day' as const,
        };

        saveQuoteState({
          configuredProducts: [config],
          activeConfigProductId: config.id,
          baseQuote: 0,
          includeInstallation: false,
          deliveryCost: 0,
          selectedCityId: null,
          unconfiguredCityQuery: undefined,
          isDeliveryCostFinal: false,
          installationCost: 0,
          techniciansRequired: 0,
          includeDelivery: false,
          activeMode: 'manual',
          initialWizardStep: 1,
          isSubmitting: false,
          isSignatureFlowActive: true,
          currentStep: 5,
        });

        router.replace('/');
      } catch (e) {
        console.error('Quick rent failed', e);
        router.replace('/');
      }
    };
    init();
  }, [params.id, router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#F5F5F5]" style={{ backgroundColor: '#F5F5F5' }}>
      <LiquidLoader size={110} />
    </div>
  );
}
