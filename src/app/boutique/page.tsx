'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Store } from 'lucide-react';

export default function BoutiquePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
          <div className="flex items-center gap-2">
            <Store size={20} className="text-blue-500" />
            <span className="font-black text-lg text-slate-900">Boutique</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Store size={36} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Boutique en préparation</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Notre catalogue de produits sera bientôt disponible. Revenez prochainement pour découvrir nos solutions.
          </p>
        </div>
      </main>
    </div>
  );
}
