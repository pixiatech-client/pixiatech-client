'use client';

import React, { useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { RotateCcw, Loader2 } from 'lucide-react';

interface RestorePageDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * « Restaurer la page » — confirmation obligatoire, puis relecture serveur.
 *
 * Ce n'est PAS un reset : la page n'est ni vidée, ni réinitialisée, ni
 * supprimée. On relit la dernière version enregistrée côté serveur et on
 * remplace l'état local par celle-ci. Le message d'erreur technique reste
 * dans la console, l'interface ne montre qu'un texte utile.
 */
export const RestorePageDialog: React.FC<RestorePageDialogProps> = ({ open, onClose }) => {
  const { restorePageFromServer, saveStatus } = useCms();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'idle' | 'done' | 'error'>('idle');

  if (!open) return null;

  const close = () => {
    if (busy) return;
    setMessage('idle');
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    const ok = await restorePageFromServer();
    setBusy(false);
    if (ok) {
      setMessage('done');
      // Laisse l'écran de confirmation afficher la confirmation, puis ferme.
      setTimeout(() => {
        setMessage('idle');
        onClose();
      }, 1400);
    } else {
      console.error('[CMS] Restauration de la page impossible.');
      setMessage('error');
    }
  };

  return (
    <div
      data-cms-ui
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-title"
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-[460px] rounded-2xl border border-[#2B2B28] bg-[#0E0E0D] p-6 text-[#F5F4F0] shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="restore-title" className="flex items-center gap-2 text-sm font-bold tracking-wide">
          <RotateCcw className="h-4 w-4 text-[#C3F910]" />
          Restaurer la page ?
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-[#B9B7B1]">
          Cette action va restaurer la dernière version enregistrée de cette page.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#B9B7B1]">
          Les modifications actuellement non enregistrées seront perdues.
        </p>

        {message === 'done' && (
          <p className="mt-4 rounded-lg border border-[#C3F910]/40 bg-[#C3F910]/10 px-3 py-2 text-sm font-bold text-[#C3F910]">
            Page restaurée.
          </p>
        )}
        {message === 'error' && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400">
            Impossible de restaurer la page.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-[#2B2B28] bg-[#171715] px-4 py-2 text-xs font-bold text-[#EDEBE6] transition-colors hover:border-[#555] disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || saveStatus === 'saving'}
            className="flex items-center gap-2 rounded-lg border border-[#C3F910] bg-[#C3F910] px-4 py-2 text-xs font-bold text-[#080808] transition-all hover:bg-[#B0E20E] disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Restaurer
          </button>
        </div>
      </div>
    </div>
  );
};
