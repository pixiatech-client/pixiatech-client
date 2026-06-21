'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShoppingBag, CalendarRange } from 'lucide-react';

const tabs = [
  { href: '/admin/boutique/produits', label: 'Vente', icon: ShoppingBag },
  { href: '/admin/boutique/location', label: 'Location', icon: CalendarRange },
];

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Boutique</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          Gérez vos produits et locations en ligne.
        </CardDescription>
        <div className="relative flex w-full max-w-md mt-4 rounded-xl bg-white border border-slate-200 h-12 p-1 shadow-sm">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative w-full flex justify-center font-bold px-4 py-2 text-[11px] uppercase tracking-widest items-center gap-2.5 z-20 transition-all duration-300",
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="boutique-nav-bubble"
                    className="absolute inset-0 z-10 bg-slate-900 rounded-lg shadow-lg"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <tab.icon className={cn("w-4 h-4 z-20 transition-colors", isActive ? 'text-blue-500' : 'text-slate-400')} />
                <span className="z-20">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {children}
      </CardContent>
    </Card>
  );
}
