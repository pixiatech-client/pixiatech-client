// Types miroirs des réponses API analytics (valable côté client —
// ne pas importer analytics-store ici, il dépend du SDK admin).

export interface GaugeByDayEntry {
  sessions: number;
  unique: number;
  pageViews: number;
  productViews: number;
}

export interface GaugeProduct {
  slug: string;
  name?: string;
  views: number;
  clicks: number;
  uniques: number;
  interestRate: number;
}

export interface GaugePage {
  path: string;
  views: number;
  uniques: number;
  exits: number;
  avgDwellMs: number;
}

export interface GaugeAggregate {
  sessions: number;
  uniqueVisitors: number;
  pageViews: number;
  productViews: number;
  distinctProducts: number;
  bounceRate: number;
  avgDurationMs: number;
  actions: Record<string, number>;
  bySource: Record<string, number>;
  byCountry: Record<string, { sessions: number; unique: number; pageViews: number }>;
  byLang: Record<string, number>;
  byDevice: Record<string, number>;
  byOs: Record<string, number>;
  byBrowser: Record<string, number>;
  byScreen: Record<string, number>;
  byDay: Record<string, GaugeByDayEntry>;
  byHour: Record<string, number>;
  products: GaugeProduct[];
  pages: GaugePage[];
}

export interface AnalyticsWindow {
  from: number;
  to: number;
}

export interface AnalyticsFilter {
  product?: string;
  page?: string;
  country?: string;
  lang?: string;
  device?: string;
  source?: string;
}

export interface OverviewResponse {
  success: boolean;
  current: GaugeAggregate;
  previous: GaugeAggregate;
  conversions: number;
  prevConversions: number;
  treated?: number;
  window: AnalyticsWindow;
}

export interface ProductsResponse {
  success: boolean;
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface SourcesRow {
  key: string;
  visits: number;
  unique: number;
  pageViews: number;
  mediums: { key: string; count: number }[];
  campaigns: { key: string; count: number }[];
  landings: { key: string; count: number }[];
}

export interface SourcesResponse {
  success: boolean;
  rows: SourcesRow[];
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface GeoRow {
  code: string;
  sessions: number;
  unique: number;
  pageViews: number;
}

export interface GeoResponse {
  success: boolean;
  rows: GeoRow[];
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface LanguagesResponse {
  success: boolean;
  rows: { key: string; count: number }[];
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface DevicesResponse {
  success: boolean;
  byDevice: { key: string; count: number }[];
  byOs: { key: string; count: number }[];
  byBrowser: { key: string; count: number }[];
  byScreen: { key: string; count: number }[];
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface BehaviorRow {
  path: string;
  views: number;
  entries: number;
  exits: number;
  avgDwellMs: number;
}

export interface BehaviorResponse {
  success: boolean;
  rows: BehaviorRow[];
  actions: Record<string, number>;
  current: GaugeAggregate;
  previous: GaugeAggregate;
  treated?: number;
  window: AnalyticsWindow;
}

export interface RealtimeSession {
  sid: string;
  lastPath?: string;
  device?: string;
  country?: string;
  lang?: string;
  idleMs?: number;
}

export interface RealtimeResponse {
  success: boolean;
  online: number;
  now: number;
  sessions: RealtimeSession[];
}

export interface ProductDetailResponse {
  success: boolean;
  slug: string;
  name: string;
  product: GaugeProduct;
  wc: GaugeAggregate;
  wp: GaugeAggregate;
  prevViews: number;
  avgSessionMs: number;
  uniqueVisitors: number;
  sources: Record<string, number>;
  countries: Record<string, { sessions: number; unique: number; pageViews: number }>;
  langs: Record<string, number>;
  devices: Record<string, number>;
  neighbors: { prev: { path: string; count: number; name: string }[]; next: { path: string; count: number; name: string }[] };
  series: { day: string; views: number; clicks: number; sessions: number }[];
  treated?: number;
  window: AnalyticsWindow;
}

export const SOURCE_LABEL_KEY: Record<string, string> = {
  direct: 'direct',
  search: 'search',
  social: 'social',
  referral: 'referral',
  campaign: 'campaign',
  other: 'other',
};

export const LANGUAGE_LABEL: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  'zh-CN': '中文',
  zh: '中文',
};