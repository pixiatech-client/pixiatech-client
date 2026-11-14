import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  FORBIDDEN_EXTENSIONS,
  getFileExtension,
  sanitizeAttachmentFileName,
  verifyBufferMagicBytes,
} from '@/lib/chat-attachments';

export const dynamic = 'force-dynamic';

/**
 * Authentifie l'utilisateur via son Bearer ID token Firebase ou son cookie de session.
 */
async function authenticateUser(
  request: NextRequest,
  adminAuth: any,
  adminDb: any
): Promise<{ uid: string; role?: string } | null> {
  // 1. Priorité au Bearer token (ID token Firebase client)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        let role: string | undefined;
        try {
          const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
          if (userDoc.exists) role = userDoc.data()?.role;
        } catch {}
        return { uid: decoded.uid, role };
      } catch (e) {
        console.warn('[chat/upload] ID token verification failed:', e);
      }
    }
  }

  // 2. Cookie de session admin/commercial
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      let role: string | undefined;
      try {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        if (userDoc.exists) role = userDoc.data()?.role;
      } catch {}
      return { uid: decoded.uid, role };
    } catch (e) {
      console.warn('[chat/upload] Session cookie verification failed:', e);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { app, adminAuth, adminDb } = getFirebaseAdmin();

    const user = await authenticateUser(request, adminAuth, adminDb);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = (formData.get('chatId') as string)?.trim();

    if (!chatId) {
      return NextResponse.json({ success: false, error: 'Identifiant de conversation manquant.' }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'Fichier manquant.' }, { status: 400 });
    }

    // Contrôle d'autorisation sur le chat
    const privilegedRoles = ['admin', 'commercial', 'fournisseur', 'prestataire'];
    let isAuthorized = privilegedRoles.includes(user.role || '');

    if (!isAuthorized) {
      try {
        const chatDoc = await adminDb.collection('chats').doc(chatId).get();
        if (chatDoc.exists) {
          const participants = chatDoc.data()?.participants || [];
          if (participants.includes(user.uid)) {
            isAuthorized = true;
          }
        }
      } catch (err) {
        console.warn('[chat/upload] Erreur vérification participants chat:', err);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé à cette conversation.' },
        { status: 403 }
      );
    }

    // 1. Vérification de la taille (max 25 Mo)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `Le fichier dépasse la taille maximale autorisée (25 Mo).` },
        { status: 413 }
      );
    }

    const fileName = (file as any).name || 'document';
    const ext = getFileExtension(fileName);

    // 2. Vérification liste blanche / liste noire
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: `Type de fichier dangereux ou interdit (.${ext}).` },
        { status: 400 }
      );
    }

    if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
      return NextResponse.json(
        { success: false, error: `Extension non prise en charge (.${ext}). Veuillez fournir un format autorisé.` },
        { status: 415 }
      );
    }

    // 3. Lecture du buffer et vérification des signatures magiques réelles (côté serveur)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Le fichier est vide.' }, { status: 400 });
    }

    const headSlice = new Uint8Array(buffer.buffer, buffer.byteOffset, Math.min(buffer.byteLength, 64));
    const magicCheck = verifyBufferMagicBytes(headSlice, fileName);
    if (!magicCheck.safe) {
      return NextResponse.json(
        { success: false, error: magicCheck.error || 'Signature de fichier invalide ou suspecte.' },
        { status: 400 }
      );
    }

    // 4. Stockage sécurisé dans Firebase Storage
    const cleanName = sanitizeAttachmentFileName(fileName);
    const uniqueToken = `${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const destinationPath = `chats/${chatId}/${uniqueToken}_${cleanName}`;

    const bucket = getStorage(app).bucket();
    const gcsFile = bucket.file(destinationPath);
    const downloadToken = randomUUID();

    const contentType = file.type || 'application/octet-stream';

    await gcsFile.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: fileName,
          uploadedBy: user.uid,
          extension: ext,
        },
      },
      resumable: false,
    });

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      destinationPath
    )}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      success: true,
      attachment: {
        name: fileName,
        url: downloadUrl,
        size: buffer.byteLength,
        type: contentType,
        extension: ext,
      },
    });
  } catch (error: any) {
    console.error('[chat/upload] Erreur lors du téléversement:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur interne lors du téléversement.' },
      { status: 500 }
    );
  }
}
