
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Percent, Truck, Settings, Map } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tab {
    href: string;
    label: string;
    icon: LucideIcon;
}

const tabs: Tab[] = [
  { href: '/admin/delivery/zones', label: 'Zones', icon: Map },
  { href: '/admin/delivery/tarifs', label: 'Tarifs par Zone', icon: Truck },
  { href: '/admin/delivery/default', label: 'Frais par Défaut', icon: Settings },
  { href: '/admin/delivery/gratuite', label: 'Livraison Gratuite', icon: Percent },
];

export function DeliveryNav() {
    const pathname = usePathname();

    return (
        <div className="relative flex w-full max-w-3xl mx-auto rounded-xl bg-white border border-slate-200 h-12 p-1 shadow-sm">
          {tabs.map((tab) => {
            const isActive = tab.href === '/admin/delivery/tarifs' 
                ? pathname === tab.href || pathname === '/admin/delivery' 
                : pathname.startsWith(tab.href);

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
                        layoutId="delivery-nav-bubble"
                        className="absolute inset-0 z-10 bg-slate-900 rounded-lg shadow-lg"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                )}
                <tab.icon className={cn("w-4 h-4 z-20 transition-colors", isActive ? 'text-blue-500' : 'text-slate-400')} />
                <span className="hidden md:inline-block z-20">
                    {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
    );
}
