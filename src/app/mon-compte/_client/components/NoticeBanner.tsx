'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, Building2, X } from 'lucide-react';
import type { ClientProfile } from '../types';

interface NoticeBannerProps {
  user: Pick<ClientProfile, 'siretVerified' | 'emailVerified'> | null;
  onOpenSiretModal: () => void;
}

export function NoticeBanner({ user, onOpenSiretModal }: NoticeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (user && !user.siretVerified && !user.emailVerified) {
    return (
      <div className="w-full bg-amber-950/40 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-200/90 flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="max-w-[1536px] mx-auto flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">Finalisez votre profil :</strong> Validez votre SIRET ou confirmez votre adresse e-mail pour
              accéder à l'émission immédiate de factures certifiées.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSiretModal}
              className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 hover:underline cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vérifier SIRET</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400/60 hover:text-amber-200 p-1 rounded-md cursor-pointer shrink-0 transition-colors"
          title="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
