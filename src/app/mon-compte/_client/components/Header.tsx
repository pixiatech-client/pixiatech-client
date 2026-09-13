'use client';

import { LogOut, MessageSquare, MessageSquareWarning } from 'lucide-react';

interface HeaderProps {
  name: string;
  unreadDisputes: number;
  onDisputes: () => void;
}

export function Header({ name, unreadDisputes, onDisputes }: HeaderProps) {
  const firstName = name.split(' ')[0] || 'Client';
  const initial = (name || 'C').charAt(0).toUpperCase();

  function handleLogout() {
    window.location.href = '/api/boutique/logout';
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between rounded-2xl bg-[#0A0D0E] px-5 py-3 text-white shadow-lg shadow-black/10">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight">PIXIATECH</span>
            <span className="hidden text-xs font-medium uppercase tracking-wider text-white/50 sm:block">
              Espace client
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onDisputes}
              className="relative flex size-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Mes litiges"
            >
              {unreadDisputes > 0 ? (
                <MessageSquareWarning size={19} />
              ) : (
                <MessageSquare size={19} />
              )}
              {unreadDisputes > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#38E044] px-1 text-[10px] font-bold text-black">
                  {unreadDisputes}
                </span>
              )}
            </button>

            <div className="hidden items-center gap-3 rounded-xl bg-white/10 px-3 py-2 md:flex">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#38E044] text-sm font-bold text-black">
                {initial}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold">Bonjour {firstName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex size-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Se déconnecter"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}