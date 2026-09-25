// Configuration partagée des statuts de litige pour toute l'interface admin.
// Une seule source de vérité pour les libellés, icônes et couleurs :
//   OUVERT    → vert
//   EN COURS  → orange
//   RÉSOLU    → bleu
//   FERMÉ     → gris
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Dispute } from '@/lib/types';

export type DisputeStatus = Dispute['status'];

export const DISPUTE_STATUSES: readonly DisputeStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export interface DisputeStatusMeta {
  labelKey: string;
  icon: LucideIcon;
  /** Classes du badge (fond 50, texte 700, bordure 200). */
  badge: string;
  /** Classe du point de couleur (fond plein). */
  dot: string;
  /** Classe du texte de l'icône dans le menu. */
  itemText: string;
}

export const DISPUTE_STATUS_META: Record<DisputeStatus, DisputeStatusMeta> = {
  open: {
    labelKey: 'admin.litiges.statusOpen',
    icon: AlertCircle,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    itemText: 'text-emerald-700',
  },
  in_progress: {
    labelKey: 'admin.litiges.statusInProgress',
    icon: Clock,
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    itemText: 'text-orange-700',
  },
  resolved: {
    labelKey: 'admin.litiges.statusResolved',
    icon: CheckCircle2,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    itemText: 'text-blue-700',
  },
  closed: {
    labelKey: 'admin.litiges.statusClosed',
    icon: XCircle,
    badge: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dot: 'bg-neutral-400',
    itemText: 'text-neutral-600',
  },
};

export function getDisputeStatusMeta(status: DisputeStatus): DisputeStatusMeta {
  return DISPUTE_STATUS_META[status] || DISPUTE_STATUS_META.open;
}
