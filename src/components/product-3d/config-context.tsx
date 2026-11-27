'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Product3DParamValues } from '@/lib/products/types';
import { PRODUCT_3D_MODELS, getProduct3DDefinition } from './catalog';

/**
 * Configuration CMS d'UN modèle, pour LE produit en cours.
 *
 * Ce contexte est fourni par `Product3DModule` (prévisualisation d'admin ET
 * fiche publique). Il ne contient jamais d'état global de sélection : chaque
 * produit porte sa propre configuration dans son document Firestore.
 */
export interface Product3DModelConfig {
  params?: Product3DParamValues;
}

export interface Product3DConfigValue {
  disabledModels?: string[];
  hiddenModels?: string[];
  modelParams?: Record<string, Product3DParamValues>;
}

const EMPTY_CONFIG: Product3DConfigValue = Object.freeze({});
const ConfigContext = createContext<Product3DConfigValue>(EMPTY_CONFIG);

/**
 * Sélection exclusive d'UN modèle par produit.
 *
 * `disabledModels` reste le champ persisté : il contient exactement les quatre
 * modèles non sélectionnés. Les autres réglages de la configuration sont
 * préservés, et chaque produit garde sa propre sélection dans Firestore.
 */
export function withExclusiveModel(
  config: Product3DConfigValue | null | undefined,
  selectedModelId: string
): Product3DConfigValue {
  const selected = getProduct3DDefinition(selectedModelId).id;
  const disabledModels = PRODUCT_3D_MODELS
    .filter((model) => model.id !== selected)
    .map((model) => model.id);
  return { ...(config ?? {}), disabledModels };
}

export function Product3DConfigProvider({
  value,
  children,
}: {
  value?: Product3DConfigValue | null;
  children: ReactNode;
}) {
  return <ConfigContext.Provider value={value ?? EMPTY_CONFIG}>{children}</ConfigContext.Provider>;
}

export function useProduct3DConfig(): Product3DConfigValue {
  return useContext(ConfigContext);
}

/** Configuration du modèle courant, isolée par identifiant technique stable. */
export function useProduct3DModelConfig(modelId: string): Product3DModelConfig {
  const config = useProduct3DConfig();
  const params = config.modelParams?.[modelId];
  if (!params) return EMPTY_MODEL_CONFIG;
  return { params };
}

const EMPTY_MODEL_CONFIG: Product3DModelConfig = Object.freeze({});

/**
 * Lit un paramètre éditable en conservant la valeur par défaut du module si le
 * CMS ne renseigne rien (ou si la valeur est corrompue).
 */
export function readProduct3DParam<const T extends string>(
  params: Product3DParamValues | undefined,
  key: string,
  fallback: T,
  allowed?: readonly T[]
): T {
  const raw = params?.[key];
  if (typeof raw !== 'string') return fallback;
  return !allowed || allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function readProduct3DNumber(
  params: Product3DParamValues | undefined,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = params?.[key];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

export function readProduct3DBoolean(
  params: Product3DParamValues | undefined,
  key: string,
  fallback: boolean
): boolean {
  const raw = params?.[key];
  return typeof raw === 'boolean' ? raw : fallback;
}
