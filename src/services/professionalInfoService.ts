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
  const url = `https://recherche-entreprises.api.gouv.fr/search?per_page=1&q=${encodeURIComponent(siret)}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new APIError(0, 'Impossible de contacter le service de vérification. Vérifiez votre connexion réessayez.');
  }

  if (!res.ok) throw new APIError(res.status, 'Le service de vérification est momentanément indisponible. Réessayez dans quelques instants.');

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new APIError(res.status, 'Le service de vérification a renvoyé une réponse invalide. Réessayez dans quelques instants.');
  }

  const first = data?.results?.[0];
  if (!first || !first.siege) {
    throw new APIError(404, 'Aucune entreprise trouvée avec ce numéro SIRET. Veuillez vérifier.');
  }

  return {
    companyName: typeof first.nom_complet === 'string' ? first.nom_complet : '',
    siret: typeof first.siege.siret === 'string' ? first.siege.siret : siret,
    address: typeof first.siege.adresse === 'string' ? first.siege.adresse : '',
    city: typeof first.siege.libelle_commune === 'string' ? first.siege.libelle_commune : '',
    state: typeof first.siege.departement === 'string' ? first.siege.departement : '',
    postcode: typeof first.siege.code_postal === 'string' ? first.siege.code_postal : '',
    country: 'France',
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