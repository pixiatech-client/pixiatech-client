import type { AnalyticsEventType, AnalyticsSource } from './constants';

/**
 * Événement envoyé par le tracker du site public.
 * Aucune donnée personnelle : pas d'IP, pas d'email, pas d'empreinte navigateur.
 * Le serveur complète toujours `ts` et `country`.
 */
export interface AnalyticsEventPayload {
  type: AnalyticsEventType;
  /** Identifiant de session anonyme, généré côté client (uuid local). */
  sid: string;
  /** Visiteur unique anonyme (uuid local persistant) — null si non consenté. */
  vid?: string;
  ts?: number;
  path?: string;
  title?: string;
  /** Referrer (site d'origine) — seulement hors domaine. */
  ref?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  lang?: string;
  device?: string;
  os?: string;
  browser?: string;
  screen?: string;
  productSlug?: string;
  /** Temps de présence (ms) sur la page précédente, mesuré côté client. */
  dwell?: number;
}

/** Document d'agrégation par session (écrit uniquement par l'Admin SDK). */
export interface AnalyticsSessionSummary {
  sid: string;
  vid?: string;
  createdAt: number;
  startedAt: number;
  lastSeenAt: number;
  pageViews: number;
  source: AnalyticsSource;
  medium?: string;
  campaign?: string;
  landingPath?: string;
  lastPath?: string;
  /** Compteur de vues par chemin (dérivé des page_view). */
  pageCounts?: Record<string, number>;
  /** Temps de présence agrégé par chemin ({ n, totalMs }). */
  dwell?: Record<string, { n: number; totalMs: number }>;
  /** Derniers chemins visités (ordre chronologique, limité). */
  lastN?: string[];
  /** Par slug : vues (dérivées des page_view /web/product/...) et clics produits. */
  products?: Record<string, { views?: number; clicks?: number }>;
  /** Compteurs par type d'action (contact_click, phone_click, ...). */
  actions?: Record<string, number>;
  country?: string;
  lang?: string;
  device?: string;
  os?: string;
  browser?: string;
  screen?: string;
  updatedAt: number;
}

/** Événement brut stocké dans analytics_events (lecture admin uniquement). */
export type AnalyticsEventRecord = AnalyticsEventPayload & {
  ts: number;
  country?: string;
};