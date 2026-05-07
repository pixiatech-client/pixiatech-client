'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { SuccessView } from '@/components/success-view';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const quoteId = searchParams.get('id');

    const handleNewQuote = () => {
        router.push('/');
    };

    return (
        <main className="min-h-screen bg-[#f8fafc]">
            <SuccessView 
                quoteId={quoteId} 
                onNewQuote={handleNewQuote} 
            />
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    );
}
