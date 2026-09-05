'use client';

import { APIError } from '@/services/invoiceService';

export interface ProfessionalInfo {
  companyName: string;
  siret: string;
  vatNumber: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  officePhone: string;
  companyEmail: string;
  position: string;
  employees: string;
  website: string;
  fax: string;
  vatValidated: boolean;
  vatRate: 0 | 0.2;
}

export const EMPTY_PROFESSIONAL_INFO: ProfessionalInfo = {
  companyName: '',
  siret: '',
  vatNumber: '',
  address: '',
  city: '',
  state: '',
  postcode: '',
  country: 'France',
  officePhone: '',
  companyEmail: '',
  position: '',
  employees: '',
  website: '',
  fax: '',
  vatValidated: false,
  vatRate: 0.2,
};

export interface VerifiedCompanySiret {
  companyName: string;
  siret: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export async function verifyCompanySiret(siret: string): Promise<VerifiedCompanySiret> {
  const res = await fetch(
    `/api/siret?${new URLSearchParams({ siret }).toString()}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    let message = 'Aucune entreprise trouvée avec ce numéro SIRET. Veuillez vérifier.';
    if (res.status !== 404) {
      message = 'Le service de vérification est momentanément indisponible. Réessayez dans quelques instants.';
    }
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string' && data.error) message = data.error;
    } catch {
      // corps non JSON : message par défaut
    }
    throw new APIError(res.status, message);
  }

  const data = await res.json();
  const toStr = (v: unknown): string => (v == null ? '' : String(v));
  return {
    companyName: toStr(data.companyName),
    siret: toStr(data.siret) || siret,
    address: toStr(data.address),
    city: toStr(data.city),
    state: toStr(data.state),
    postcode: toStr(data.postcode),
    country: toStr(data.country) || 'France',
  };
}

export async function fetchProfessionalInfo(): Promise<ProfessionalInfo | null> {
  const res = await fetch('/api/boutique/customer/get-professional-info', { cache: 'no-store' });

  // 404 => jamais remplies. Le backend renvoie aussi 200 avec professionalInfo: null.
  if (res.status === 404) return null;
  if (!res.ok) {
    let message = 'Impossible de récupérer vos informations professionnelles.';
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string' && data.error) message = data.error;
    } catch {
      // corps non JSON : message par défaut
    }
    throw new APIError(res.status, message);
  }

  const data = await res.json();
  if (!data?.professionalInfo) return null;

  const info = data.professionalInfo;
  // La route POST d'upsert rejette les champs non-string, donc on ramène tout en string.
  const toStr = (v: unknown): string => (v == null ? '' : String(v));
  return {
    companyName: toStr(info.companyName),
    siret: toStr(info.siret),
    vatNumber: toStr(info.vatNumber),
    address: toStr(info.address),
    city: toStr(info.city),
    state: toStr(info.state),
    postcode: toStr(info.postcode),
    country: toStr(info.country) || 'France',
    officePhone: toStr(info.officePhone),
    companyEmail: toStr(info.companyEmail),
    position: toStr(info.position),
    employees: toStr(info.employees),
    website: toStr(info.website),
    fax: toStr(info.fax),
    vatValidated: info.vatValidated === true,
    vatRate: info.vatRate === 0 ? 0 : 0.2,
  };
}

export async function saveProfessionalInfo(
  values: Omit<ProfessionalInfo, 'vatValidated' | 'vatRate'>
): Promise<ProfessionalInfo> {
  const res = await fetch('/api/boutique/customer/update-professional-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = 'Impossible d\'enregistrer vos informations professionnelles.';
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string' && data.error) message = data.error;
    } catch {
      // corps non JSON : message par défaut
    }
    throw new APIError(res.status, message);
  }

  const data = await res.json();
  return {
    ...values,
    vatValidated: data?.vatValidated === true,
    vatRate: data?.vatRate === 0 ? 0 : 0.2,
  };
}