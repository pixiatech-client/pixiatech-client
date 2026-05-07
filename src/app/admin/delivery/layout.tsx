'use server';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDeliverySettings } from '@/app/admin/actions';
import { DeliveryNav } from './_components/delivery-nav';

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const settings = await getDeliverySettings();

  // Pass props to children server-side
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // The 'as any' is a practical way to inject props into server components
      // that don't explicitly have them in their type signature.
      return React.cloneElement(child, { settings } as any);
    }
    return child;
  });

  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Logistique & Livraison</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          Configurez les zones, les tarifs et les transporteurs pour vos estimations.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {childrenWithProps}
      </CardContent>

    </Card>
  );
}
