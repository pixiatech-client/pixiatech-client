/**
 * Zone de staging média côté serveur (PROGRESSION #1).
 *
 * Reçoit le fichier BRUT (MP4, etc.) stocké temporairement sur disque SANS
 * aucune transformation (pas de FFmpeg ici), plus un fichier de métadonnées.
 * L'identifiant (`sourceUploadId`) est renvoyé au client, qui le retransmet
 * plus tard à `/api/media/optimize` via l'en-tête `x-source-upload-id`.
 * Là seulement (phase 2) la source est lue et optimisée.
 *
 * Module serveur uniquement (importe des builtins Node). Volontairement sans
 * logique métier : stockage, lecture, nettoyage, sweep des expirés.
 */

import { mkdir, readFile, stat, unlink, writeFile, readdir } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { tmpdir } from 'os';
import { generateUploadId } from './media-upload-diag';

const STAGING_DIR_NAME = 'pixia-media-stage';

/** Durée de vie maximale d'une source stagée avant sweep (2 h). */
const DEFAULT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Identifiants générés (`upl_YYYYMMDD_xxxxxx`) : alphanum + `_` + `-`. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export interface StagedSourceInfo {
  sourceUploadId: string;
  path: string;
  size: number;
  mime: string;
  originalName: string;
  uploadedAt: number;
}

export function stagingRoot(): string {
  return join(tmpdir(), STAGING_DIR_NAME);
}

function filePathFor(id: string): string {
  return join(stagingRoot(), `${id}.raw`);
}

function metaPathFor(id: string): string {
  return join(stagingRoot(), `${id}.meta.json`);
}

/** Garde anti traversal : l'id doit être simple et le chemin résolu être dans la racine. */
function assertSafeId(id: string): void {
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid staged source id: ${id}`);
  const root = resolve(stagingRoot());
  const candidate = resolve(root, `${id}.raw`);
  if (!candidate.startsWith(root + sep)) throw new Error('Path traversal blocked');
}

/**
 * Écrit le fichier brut + ses métadonnées dans la zone de staging.
 * Renvoie l'info (dont `sourceUploadId`) à retourner au client.
 */
export async function stageFile(opts: {
  buffer: Buffer;
  mime: string;
  originalName: string;
}): Promise<StagedSourceInfo> {
  const id = generateUploadId();
  await mkdir(stagingRoot(), { recursive: true });
  const path = filePathFor(id);
  const meta: StagedSourceInfo = {
    sourceUploadId: id,
    path,
    size: opts.buffer.length,
    mime: opts.mime,
    originalName: opts.originalName,
    uploadedAt: Date.now(),
  };
  await writeFile(path, opts.buffer);
  await writeFile(metaPathFor(id), JSON.stringify(meta));
  return meta;
}

/** Lit les métadonnées + vérifie que le fichier brut existe encore. */
export async function readStagedSource(id: string): Promise<StagedSourceInfo | null> {
  try {
    assertSafeId(id);
  } catch {
    return null;
  }
  try {
    const raw = await readFile(metaPathFor(id), 'utf-8');
    const meta = JSON.parse(raw) as StagedSourceInfo;
    try {
      await stat(filePathFor(id));
    } catch {
      return null;
    }
    return meta;
  } catch {
    return null;
  }
}

/** Supprime métadonnées + fichier brut. Idempotent. */
export async function deleteStagedSource(id: string): Promise<boolean> {
  try {
    assertSafeId(id);
  } catch {
    return false;
  }
  let removed = false;
  for (const p of [metaPathFor(id), filePathFor(id)]) {
    try {
      await unlink(p);
      removed = true;
    } catch {}
  }
  return removed;
}

/**
 * Sweep opportuniste : supprime les entrées de staging plus vieilles que
 * `maxAgeMs` (ou dont les métadonnées sont illisibles). Renvoie le nombre
 * d'entrées supprimées.
 */
export async function sweepStaging(maxAgeMs: number = DEFAULT_MAX_AGE_MS): Promise<number> {
  let entries: string[];
  try {
    entries = await readdir(stagingRoot());
  } catch {
    return 0;
  }
  let removed = 0;
  const now = Date.now();
  for (const entry of entries) {
    if (!entry.endsWith('.meta.json')) continue;
    const id = entry.slice(0, -'.meta.json'.length);
    try {
      const raw = await readFile(join(stagingRoot(), entry), 'utf-8');
      const meta = JSON.parse(raw) as { uploadedAt?: number };
      const expired = typeof meta.uploadedAt !== 'number' || now - meta.uploadedAt > maxAgeMs;
      if (expired && (await deleteStagedSource(id))) removed += 1;
    } catch {
      if (await deleteStagedSource(id)) removed += 1;
    }
  }
  return removed;
}