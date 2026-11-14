export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

const dnsLookup = promisify(dns.lookup);

const ALLOWED_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

function isIpPrivate(ip: string): boolean {
  if (
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('169.254.') ||
    ip.startsWith('192.168.') ||
    ip === '0.0.0.0'
  ) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.').map(Number);
    if (parts[1] >= 16 && parts[1] <= 31) return true;
  }
  const low = ip.toLowerCase();
  if (ip === '::1' || ip === '::' || low.startsWith('fe80:') || low.startsWith('fc00:') || low.startsWith('fd00:')) return true;
  return false;
}

/**
 * Authentifie l'utilisateur via Bearer token (ID token Firebase) ou cookie de session.
 * Retourne l'uid ou null.
 */
async function authenticateUser(request: NextRequest, adminAuth: any): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        return decoded.uid;
      } catch {}
    }
  }
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      return decoded.uid;
    } catch {}
  }
  return null;
}

/**
 * Vérifie que l'utilisateur est participant du chat ou admin/commercial.
 */
async function isAuthorizedForChat(
  uid: string,
  chatId: string,
  adminDb: any,
  role?: string
): Promise<boolean> {
  const privilegedRoles = ['admin', 'commercial', 'fournisseur', 'prestataire'];
  if (role && privilegedRoles.includes(role)) return true;
  try {
    const chatDoc = await adminDb.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return false;
    const participants: string[] = chatDoc.data()?.participants || [];
    return participants.includes(uid);
  } catch {
    return false;
  }
}

/**
 * Extrait le chatId depuis le chemin Firebase Storage de l'URL.
 * Format : chats/{chatId}/{filename}
 */
function extractChatId(urlParam: string): string | null {
  try {
    const decoded = decodeURIComponent(new URL(urlParam).pathname);
    const match = decoded.match(/\/o\/chats\/([^/]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download';

    if (!urlParam) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // 1. Validation de l'URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlParam);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Protocol not allowed' }, { status: 400 });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 });
    }

    // 2. SSRF DNS check
    try {
      const lookupResult = await dnsLookup(parsedUrl.hostname);
      if (isIpPrivate(lookupResult.address)) {
        return NextResponse.json({ error: 'Access to private networks is forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Failed to resolve domain name' }, { status: 400 });
    }

    // 3. Authentification + contrôle d'accès pour les fichiers /chats/
    const isFirebaseStorageUrl =
      hostname === 'firebasestorage.googleapis.com' &&
      parsedUrl.pathname.includes('/o/chats/');

    if (isFirebaseStorageUrl) {
      const { app, adminAuth, adminDb } = getFirebaseAdmin();
      const uid = await authenticateUser(request, adminAuth);
      if (!uid) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Récupérer le rôle de l'utilisateur
      let role: string | undefined;
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) role = userDoc.data()?.role;
      } catch {}

      const chatId = extractChatId(urlParam);
      if (chatId) {
        const authorized = await isAuthorizedForChat(uid, chatId, adminDb, role);
        if (!authorized) {
          return NextResponse.json({ error: 'Access denied to this conversation' }, { status: 403 });
        }
      }

      // Utiliser le SDK Admin pour télécharger le fichier (bypass auth Firebase Storage)
      try {
        const pathMatch = decodeURIComponent(parsedUrl.pathname).match(/\/o\/(.+)$/);
        if (pathMatch) {
          const storagePath = pathMatch[1];
          const bucket = getStorage(app).bucket();
          const fileRef = bucket.file(storagePath);
          const [buffer] = await fileRef.download();
          const [metadata] = await fileRef.getMetadata();
          const contentType = metadata.contentType || 'application/octet-stream';
          const safeAscii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
          const encodedFilename = encodeURIComponent(filename);

          return new Response(buffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedFilename}`,
              'Cache-Control': 'private, no-store',
              'X-Content-Type-Options': 'nosniff',
            },
          });
        }
      } catch (adminErr) {
        console.error('[download] Admin SDK fetch failed, falling through:', adminErr);
        // Si Admin SDK échoue, on essaie le fetch direct avec l'URL signée
      }
    }

    // 4. Fetch direct (pour les autres fichiers non-chats ou fallback)
    const response = await fetch(urlParam, { redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: 'Redirects are not allowed' }, { status: 400 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const safeAscii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
    const encodedFilename = encodeURIComponent(filename);

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedFilename}`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[download proxy] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

