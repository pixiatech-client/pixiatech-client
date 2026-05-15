
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Settings, Image as ImageIcon, AlertTriangle, FileText, MessageSquareQuote, Shield, Palette, Truck, HardHat, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tab {
    href: string;
    label: string;
    icon: LucideIcon;
}

const tabs: Tab[] = [
  { href: '/admin/settings/general', label: 'Général', icon: Settings },
  { href: '/admin/settings/images', label: 'Images', icon: ImageIcon },
  { href: '/admin/settings/content', label: 'Contenu', icon: FileText },
  { href: '/admin/settings/wizard', label: 'Wizard', icon: Wand2 },
  { href: '/admin/settings/livraison', label: 'Livraison', icon: Truck },
  { href: '/admin/settings/main-doeuvre', label: 'Main d\'œuvre', icon: HardHat },
  { href: '/admin/settings/pdf', label: 'PDF', icon: FileText },
  { href: '/admin/settings/themes', label: 'Thèmes', icon: Palette },
  { href: '/admin/settings/emergency', label: 'Urgence', icon: AlertTriangle },
];

export function SettingsNav() {
    const pathname = usePathname();

    return (
        <div className="relative flex w-full max-w-4xl mx-auto rounded-xl bg-white border border-slate-200 h-12 p-1 shadow-sm">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative w-full flex justify-center font-bold px-4 py-2 text-[11px] uppercase tracking-widest items-center gap-2.5 z-20 transition-all duration-300",
                  isActive ? "text-theme-sidebar-active-text" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {isActive && (
                    <motion.span
                        layoutId="settings-nav-bubble"
                        className="absolute inset-0 z-10 bg-theme-sidebar-active-bg rounded-lg shadow-lg"
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
