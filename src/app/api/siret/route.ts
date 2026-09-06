import { NextResponse } from 'next/server';

// L'API recherche-entreprises.api.gouv.fr ne renvoie que des codes numériques
// pour le département et la région (ex: "75", "11"). On mappe le code région
// vers son libellé pour l'afficher dans le champ « État / Région ».
const REGION_CODES: Record<string, string> = {
  '1': 'Guadeloupe',
  '2': 'Martinique',
  '3': 'Guyane',
  '4': 'La Réunion',
  '6': 'Mayotte',
  '11': 'Île-de-France',
  '24': 'Centre-Val de Loire',
  '27': 'Bourgogne-Franche-Comté',
  '28': 'Normandie',
  '32': 'Hauts-de-France',
  '44': 'Grand Est',
  '52': 'Pays de la Loire',
  '53': 'Bretagne',
  '75': 'Nouvelle-Aquitaine',
  '76': 'Occitanie',
  '84': 'Auvergne-Rhône-Alpes',
  '93': 'Provence-Alpes-Côte d\'Azur',
  '94': 'Corse',
};

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    // L'API renvoie parfois `tva` sous forme de tableau (ex: ["FR12345678901"]).
    const first = v.find((x) => typeof x === 'string' && x);
    return first || '';
  }
  return '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('siret') || '';
  const siret = raw.replace(/\s+/g, '');

  if (!/^\d{9}(\d{5})?$/.test(siret)) {
    return NextResponse.json(
      { error: 'Le numéro SIRET doit contenir 9 (SIREN) ou 14 chiffres.' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?per_page=1&q=${encodeURIComponent(siret)}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Le service de vérification est momentanément indisponible. Réessayez dans quelques instants.' },
        { status: 502 }
      );
    }

    const data: any = await res.json();
    const first = data?.results?.[0];

    if (!first || !first.siege) {
      return NextResponse.json(
        { error: 'Aucune entreprise trouvée avec ce numéro SIRET. Veuillez vérifier.' },
        { status: 404 }
      );
    }

    const siege = first.siege;
    return NextResponse.json({
      companyName: toStr(first.nom_complet),
      legalName: toStr(first.nom_raison_sociale),
      siren: toStr(first.siren),
      siret: toStr(siege.siret) || siret,
      vatNumber: toStr(first.tva),
      address: toStr(siege.adresse),
      addressDetail: toStr(siege.complement_adresse),
      city: toStr(siege.libelle_commune),
      state: REGION_CODES[toStr(siege.region)] || '',
      department: toStr(siege.departement),
      postcode: toStr(siege.code_postal),
      country: 'France',
      active: toStr(first.etat_administratif) === 'A',
      createdAt: toStr(first.date_creation),
      nafCode: toStr(first.activite_principale),
    });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de contacter le service de vérification. Réessayez dans quelques instants.' },
      { status: 502 }
    );
  }
}