
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Settings, Image as ImageIcon, AlertTriangle, FileText, MessageSquare, ShieldCheck, Palette, Truck, HardHat, Wand2, Package, Zap, PenTool, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminT } from '@/hooks/useAdminT';

interface Tab {
    href: string;
    labelKey: string;
    icon: LucideIcon;
}

const tabDefs: Tab[] = [
  { href: '/admin/settings/general', labelKey: 'General', icon: Settings },
  { href: '/admin/settings/images', labelKey: 'Images', icon: ImageIcon },
  { href: '/admin/settings/wizard', labelKey: 'Assistant & Images', icon: Wand2 },
  { href: '/admin/settings/livraison', labelKey: 'Delivery', icon: Truck },
  { href: '/admin/settings/main-doeuvre', labelKey: 'Labor', icon: HardHat },
  { href: '/admin/settings/pdf', labelKey: 'PDF', icon: FileText },
  { href: '/admin/settings/themes', labelKey: 'Appearance', icon: Palette },
  { href: '/admin/settings/emergency', labelKey: 'Emergency', icon: AlertTriangle },
  { href: '/admin/settings/messaging', labelKey: 'Messaging', icon: MessageSquare },
  { href: '/admin/settings/software', labelKey: 'Software', icon: Settings },
  { href: '/admin/settings/email-verification', labelKey: 'Email Verification', icon: ShieldCheck },
  { href: '/admin/settings/flow', labelKey: 'Parcours client', icon: Zap },
  { href: '/admin/settings/signature', labelKey: 'Signature & Compteur', icon: PenTool },
  { href: '/admin/settings/paypal', labelKey: 'PayPal', icon: CreditCard },
  { href: '/admin/settings/track', labelKey: 'Suivi colis', icon: Package },
];

export function SettingsNav() {
    const pathname = usePathname();
    const { t } = useAdminT();

    return (
        <div className="relative flex w-full max-w-4xl mx-auto rounded-xl bg-white border border-slate-200 h-12 p-1 shadow-sm">
          {tabDefs.map((tab) => {
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
                    {t(tab.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
    );
}
