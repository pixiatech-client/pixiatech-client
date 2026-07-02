'use client';

import { useEffect, useState } from 'react';
import { X, Package, MapPin, Clock, Truck, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/tracking/constants';
import type { TrackingStatus, TrackingEvent } from '@/lib/tracking/types';
interface TrackingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  trackingNumber: string;
  carrier?: number;
}
export function TrackingDetailDrawer({ open, onClose, trackingNumber, carrier }: TrackingDetailDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [status, setStatus] = useState<TrackingStatus>('InfoReceived');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!open || !trackingNumber) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      setLoading(true);
      if (retryCount === 0) setError(null);
      try {
        const res = await fetch('/api/tracking/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber, carrier }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Erreur lors de la récupération du suivi');
          return;
        }
        const result = await res.json();
        if (result.data.registered && !result.data.events?.length && retryCount < 3) {
          timer = setTimeout(() => {
            if (!cancelled) setRetryCount((c) => c + 1);
          }, 4000);
          setError('Numéro enregistré, récupération en cours...');
        } else {
          setStatus(result.data.status);
          setEvents(result.data.events || []);
        }
      } catch {
        if (!cancelled) setError('Erreur réseau');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [open, trackingNumber, carrier, retryCount]);
  const colors = STATUS_COLORS[status] || STATUS_COLORS.InfoReceived;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bg-white shadow-2xl z-50 flex flex-col',
              isMobile
                ? 'bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[85vh]'
                : 'top-0 right-0 h-full w-full max-w-md'
            )}
          >
            <div className={cn('flex items-center justify-between p-4 border-b border-slate-200', isMobile && 'shrink-0')}>
              <div className="flex items-center gap-2">
                {isMobile && <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />}
                <Package className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-sm">Suivi de colis</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="text-xs text-slate-500 mb-0.5">Numéro de suivi</div>
              <div className="font-mono text-sm font-semibold">{trackingNumber}</div>
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Recherche du colis...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">{error}</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucun événement de suivi disponible</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 pb-8">
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4', colors.bg, colors.text, colors.border, 'border')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot.replace('text-', 'bg-'))} />
                  {STATUS_LABELS[status] || status}
                </div>
                <div className="relative">
                  <div className="absolute left-[17px] top-1 bottom-1 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {events.map((evt, i) => {
                      const evtColors = STATUS_COLORS[evt.status] || STATUS_COLORS.InfoReceived;
                      const isFirst = i === 0;
                      const isLast = i === events.length - 1;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3"
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div className={cn(
                              'w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
                              isFirst ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'
                            )}>
                              {isFirst && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </div>
                          </div>
                          <div className={cn(
                            'flex-1 pb-1',
                            isLast ? '' : 'border-b border-slate-100'
                          )}>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                              <span>{evt.description}</span>
                            </div>
                            {evt.location && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {evt.location}
                              </div>
                            )}
                            {evt.time && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(evt.time).toLocaleString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                evtColors.dot.replace('text-', 'bg-')
                              )} />
                              <span className={cn('text-[11px]', evtColors.text)}>
                                {STATUS_LABELS[evt.status] || evt.status}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="p-3 border-t border-slate-200 text-center">
              <p className="text-[10px] text-slate-400">
                Données de suivi fournies par 17TRACK
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
