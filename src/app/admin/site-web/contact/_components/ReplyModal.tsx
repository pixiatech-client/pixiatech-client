'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, X, User, Phone, Building2, Calendar, FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ContactMessage } from '@/lib/site-web/types';
import { FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA } from './ContactAdminTabs';

interface ReplyModalProps {
  open: boolean;
  message: ContactMessage | null;
  onClose: () => void;
  onReplied: (updatedMessage: ContactMessage) => void;
}

export function ReplyModal({ open, message, onClose, onReplied }: ReplyModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (message && open) {
      setTo(message.email || '');
      setSubject(`Re: ${message.subject || 'Votre demande de contact PIXIATECH'}`);
      setBody(
        `Bonjour ${message.name},\n\nNous faisons suite à votre message concernant votre projet d'affichage LED.\n\n\n\nRestant à votre entière disposition,\n\nCordialement,\nL'équipe PIXIATECH`
      );
    }
  }, [message, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSending, onClose]);

  if (!open || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !to.includes('@')) {
      toast.error('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!subject.trim()) {
      toast.error('Veuillez renseigner l’objet de l’email.');
      return;
    }
    if (!body.trim()) {
      toast.error('Veuillez rédiger votre réponse.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/site-web/contact/messages/${message.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          message: body.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.message || json?.error || 'Échec de l’envoi de l’email.');
        return;
      }

      toast.success('Réponse envoyée avec succès par email !');
      if (json.data) {
        onReplied(json.data as ContactMessage);
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Erreur réseau lors de l’envoi.');
    } finally {
      setIsSending(false);
    }
  };

  const formattedDate = new Date(message.createdAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => !isSending && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D1015] border border-neutral-800 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#12161D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#38E044]/10 border border-[#38E044]/30 flex items-center justify-center text-[#38E044]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Répondre au client</h2>
              <p className="text-xs text-neutral-400">
                Envoi sécurisé via le serveur SMTP PIXIATECH configuré
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Récapitulatif du message original */}
          <div className="rounded-xl bg-[#141923] border border-neutral-800/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-[#38E044]" />
                Demande initiale
              </span>
              <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {formattedDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-semibold text-white">{message.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-mono text-neutral-300 truncate">{message.email}</span>
              </div>
              {message.phone && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{message.phone}</span>
                </div>
              )}
              {message.company && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{message.company}</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-neutral-300 bg-[#0c0f15] p-3 rounded-lg border border-neutral-800/60 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {message.message}
            </div>
          </div>

          {/* Formulaire de rédaction */}
          <div className="space-y-3 pt-2">
            <div>
              <label className={FIELD_LABEL}>Destinataire (Email du client)</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className={`${FIELD_INPUT} mt-1`}
                placeholder="client@domaine.com"
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>Objet de la réponse</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className={`${FIELD_INPUT} mt-1`}
                placeholder="Re: Votre demande de contact"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={FIELD_LABEL}>Votre message</label>
                <button
                  type="button"
                  onClick={() =>
                    setBody(
                      `Bonjour ${message.name},\n\nNous vous remercions pour votre demande.\n\nVotre projet d'écran LED a bien été étudié par notre bureau technique. Vous trouverez ci-joint notre proposition détaillée.\n\nRestant à votre entière écoute pour tout renseignement complémentaire,\n\nBien cordialement,\nL'équipe PIXIATECH`
                    )
                  }
                  className="text-[10px] font-semibold text-[#38E044] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Modèle réponse technique
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={7}
                className={FIELD_TEXTAREA}
                placeholder="Rédigez votre réponse ici…"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Envoi en cours…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la réponse</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
