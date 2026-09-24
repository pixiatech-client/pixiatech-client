'use client';

import React from 'react';
import { Hammer, Construction } from 'lucide-react';

interface ConstructionShellProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  comingSoon: string[];
}

export function ConstructionShell({ icon, title, badge, description, comingSoon }: ConstructionShellProps) {
  return (
    <div className="min-h-[70vh] rounded-2xl border border-white/10 bg-[#0d1017] text-slate-100 shadow-xl overflow-hidden">
      {/* Header band */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#11141d] px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            {icon}
          </div>
          <div>
            <h2 className="font-tech text-base font-bold uppercase tracking-wider text-white">{title}</h2>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-500">
          <Construction className="h-10 w-10 stroke-1" />
        </div>
        <h3 className="mt-6 font-tech text-lg font-bold uppercase tracking-wider text-white">
          Module en cours de construction
        </h3>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Cette section du module PIXIATECH SITE WEB est en préparation. Elle sera activée dans une prochaine version.
        </p>

        <div className="mt-8 w-full max-w-lg rounded-xl border border-white/10 bg-[#121620] p-5 text-left">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500">Fonctionnalités prévues</span>
          <ul className="mt-3 space-y-2">
            {comingSoon.map((feature) => (
              <li key={feature} className="flex items-center space-x-2 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6ff00]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center space-x-2 text-xs text-slate-500">
          <Hammer className="h-3.5 w-3.5" />
          <span>Statut : architecture prête, fonctionnalité à connecter</span>
        </div>
      </div>
    </div>
  );
}