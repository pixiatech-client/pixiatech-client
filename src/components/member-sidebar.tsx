'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Package, FileText, AlertCircle, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const linkConfigs = [
  { href: '/mon-compte/tableau-de-bord', key: 'client.dashboard.title', icon: LayoutDashboard },
  { href: '/mon-compte/commandes', key: 'client.orders.title', icon: Package },
  { href: '/mon-compte/factures', key: 'client.invoices.title', icon: FileText },
  { href: '/mon-compte/litiges', key: 'client.disputes.title', icon: AlertCircle },
  { href: '/mon-compte/parametres', key: 'client.settings.title', icon: Settings },
] as const;

export function MemberSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-[72px] bottom-0 w-64 bg-white border-r border-neutral-200 p-4 flex-col gap-1 hidden md:flex">
      <nav className="flex flex-col gap-1 mt-1">
        {linkConfigs.map((cfg) => {
          const isActive = pathname === cfg.href || pathname.startsWith(cfg.href + '/');
          const Icon = cfg.icon;
          return (
            <Link
              key={cfg.href}
              href={cfg.href}
              className={cn(
                'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors',
                isActive ? 'bg-[#0A0D0E] text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] shrink-0" />}
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-neutral-500')} />
              {t(cfg.key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <form action="/api/boutique/logout" method="POST">
          <button className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" />
            {t('admin.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}