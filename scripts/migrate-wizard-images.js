/**
 * Migration script: re-upload wizard images from old Firebase Storage bucket
 * to the new pixiatech-client bucket and update Firestore settings.
 *
 * Usage:
 *   node scripts/migrate-wizard-images.js
 *
 * Requires:
 *   - ADMIN_PROJECT_ID, ADMIN_CLIENT_EMAIL, ADMIN_PRIVATE_KEY env vars
 *     (or Application Default Credentials)
 *   - Network access to the old bucket URLs (public downloads)
 */

const admin = require('firebase-admin');
const https = require('https');
const http = require('http');
const path = require('path');

// --- Config ---
const OLD_BUCKET = 'studio-9205859220-a6440.firebasestorage.app';
const NEW_BUCKET = 'pixiatech-client.firebasestorage.app';
const SETTINGS_DOC = 'settings/wizard';

// Initialize Firebase Admin
function initAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.ADMIN_PROJECT_ID;
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: NEW_BUCKET,
    });
  }

  // Fallback to ADC
  return admin.initializeApp({ storageBucket: NEW_BUCKET });
}

// Download a file from a URL (returns Buffer)
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Guess content-type from URL or extension
function getContentType(url) {
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

// Extract storage path from old URL
function extractStoragePath(url) {
  // Format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=...
  const match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

async function main() {
  initAdmin();
  const bucket = admin.storage().bucket();
  const db = admin.firestore();

  console.log(`Reading ${SETTINGS_DOC}...`);
  const docRef = db.doc(SETTINGS_DOC);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error(`Document ${SETTINGS_DOC} not found.`);
    process.exit(1);
  }

  const data = doc.data();
  const imageFields = [];

  // Collect all image URLs from wizard settings
  for (const [typeKey, typeVal] of Object.entries(data.projectTypes || {})) {
    if (typeVal?.imageUrl) {
      imageFields.push({
        path: `projectTypes.${typeKey}.imageUrl`,
        url: typeVal.imageUrl,
      });
    }
  }
  for (const [envKey, envVal] of Object.entries(data.environments || {})) {
    if (envVal?.imageUrl) {
      imageFields.push({
        path: `environments.${envKey}.imageUrl`,
        url: envVal.imageUrl,
      });
    }
  }

  console.log(`Found ${imageFields.length} image URLs to migrate.\n`);

  const updates = {};

  for (const field of imageFields) {
    const isOld = field.url.includes(OLD_BUCKET);
    if (!isOld) {
      console.log(`  SKIP (already new bucket): ${field.path}`);
      continue;
    }

    const storagePath = extractStoragePath(field.url);
    if (!storagePath) {
      console.error(`  ERROR: cannot extract path from ${field.url}`);
      continue;
    }

    console.log(`  Downloading: ${storagePath}...`);
    try {
      const buffer = await downloadFile(field.url);
      const contentType = getContentType(field.url);

      // Upload to new bucket
      const newFile = bucket.file(storagePath);
      await newFile.save(buffer, {
        contentType,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      // Generate public URL (no token needed if file is public)
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${NEW_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media`;

      updates[field.path] = newUrl;
      console.log(`  OK: ${field.path} -> ${newUrl}`);
    } catch (err) {
      console.error(`  FAILED: ${field.path} - ${err.message}`);
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log('\nNo updates needed.');
    return;
  }

  console.log(`\nUpdating Firestore (${Object.keys(updates).length} fields)...`);

  // Firestore doesn't support dot-notation in update, use nested merge
  const nestedUpdates = {};
  for (const [dotPath, value] of Object.entries(updates)) {
    const parts = dotPath.split('.');
    let obj = nestedUpdates;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }

  await docRef.set(nestedUpdates, { merge: true });
  console.log('Done. Firestore updated.');

  // Print summary
  console.log('\n--- Migration Summary ---');
  for (const [path, url] of Object.entries(updates)) {
    console.log(`  ${path}: ${url}`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
