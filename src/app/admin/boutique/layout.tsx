'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Boutique</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          Gérez vos commandes vente et location.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
