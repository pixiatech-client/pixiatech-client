import { NextRequest, NextResponse } from 'next/server';

import { isProduct3DModelId } from '@/components/product-3d/catalog';
import {
  PRODUCT_3D_NAMES_SETTING_ID,
  normalizeProduct3DModelNames,
  type EditableProduct3DModelNames,
} from '@/components/product-3d/model-names-shared';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/site-web/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStore<T extends NextResponse>(response: T): T {
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  return response;
}

/** Lecture publique : les noms sont affichés sur les fiches publiques. */
export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snapshot = await adminDb
      .collection('settings')
      .doc(PRODUCT_3D_NAMES_SETTING_ID)
      .get();
    const names = normalizeProduct3DModelNames(snapshot.data()?.names);
    return noStore(NextResponse.json({ success: true, names }));
  } catch (err: unknown) {
    console.error('GET /api/site-web/product-3d-model-names', err);
    return noStore(
      NextResponse.json(
        {
          success: false,
          message: 'Impossible de charger les noms des modèles 3D.',
        },
        { status: 500 }
      )
    );
  }
}

/**
 * Écriture admin d'un seul nom. Le client tente d'abord Firestore avec sa
 * session ; ce endpoint est le repli quand le navigateur n'a pas de session
 * Firebase (CMS public notamment). La transaction ne modifie que la clé
 * demandée pour ne pas écraser les renommages concurrents.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as { modelId?: unknown; name?: unknown };
    if (!body || typeof body !== 'object' || !isProduct3DModelId(body.modelId)) {
      return noStore(
        NextResponse.json(
          { success: false, message: 'Identifiant de modèle 3D invalide.' },
          { status: 400 }
        )
      );
    }
    if (body.name !== null && typeof body.name !== 'string') {
      return noStore(
        NextResponse.json(
          { success: false, message: 'Nom de modèle 3D invalide.' },
          { status: 400 }
        )
      );
    }

    const modelId = body.modelId;
    const clean = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const { adminDb } = getFirebaseAdmin();
    const ref = adminDb.collection('settings').doc(PRODUCT_3D_NAMES_SETTING_ID);

    const names = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current: EditableProduct3DModelNames = normalizeProduct3DModelNames(
        snapshot.data()?.names
      );
      if (clean) current[modelId] = clean;
      else delete current[modelId];

      transaction.set(
        ref,
        { names: current, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return current;
    });

    return noStore(NextResponse.json({ success: true, names }));
  } catch (err: unknown) {
    console.error('PUT /api/site-web/product-3d-model-names', err);
    return noStore(
      NextResponse.json(
        {
          success: false,
          message: 'Le nom n’a pas pu être enregistré. Réessayez.',
        },
        { status: 500 }
      )
    );
  }
}
