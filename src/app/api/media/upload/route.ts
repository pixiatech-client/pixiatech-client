export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  generateUploadId,
  logUpload,
  UPLOAD_ERROR_CODES as CODES,
} from '@/lib/media-upload-diag';
import { stageFile, deleteStagedSource, sweepStaging } from '@/lib/media-stage';
import { rateLimitExceeded } from '@/lib/rate-limit';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']);

const MAGIC_BYTES: Record<string, number[][]> = {
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
  'video/quicktime': [[0x66, 0x74, 0x79, 0x70]],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
};

function verifyMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime];
  if (!signatures) return true;
  return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

/**
 * PROGRESSION #1 — téléversement BRUT (PC → serveur, 0 → 100 %).
 *
 * Reçoit UNIQUEMENT le fichier vidéo source sous forme de FormData, le stocke
 * temporairement sur disque (zone de staging, SANS FFmpeg) et renvoie un
 * `sourceUploadId` utilisable plus tard par `/api/media/optimize` via
 * l'en-tête `x-source-upload-id`. DELETE libère la source temporaire.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (rateLimitExceeded(request, 40, 200)) {
    return NextResponse.json({ error: 'Trop de téléversements, veuillez réessayer plus tard' }, { status: 429 });
  }

  const uploadId = request.headers.get('x-upload-id') || generateUploadId();
  const startedAt = Date.now();
  let stage: string | undefined;

  const log = (s: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'SERVER', stage: s, payload });

  try {
    log('REQUEST_START', {
      method: request.method,
      contentType: request.headers.get('content-type') || '',
      contentLength: request.headers.get('content-length') || '',
    });

    stage = 'formdata_parse';
    const fdStart = Date.now();
    let formData: FormData;
    try {
      formData = await request.formData();
      log('FORMDATA_PARSE_SUCCESS', {
        elapsedMs: Date.now() - fdStart,
        numberOfFields: Array.from(formData.keys()).length,
      });
    } catch (parseErr: any) {
      const cause = (parseErr as any)?.cause;
      log('FORMDATA_PARSE_ERROR', {
        elapsedMs: Date.now() - fdStart,
        errorName: parseErr?.name,
        errorMessage: parseErr?.message,
        causeMessage: cause?.message,
        causeCode: cause?.code,
      });
      return NextResponse.json(
        { error: 'Failed to parse body as FormData.', stage, uploadId },
        { status: 400 },
      );
    }

    const file = formData.get('file') as File | null;
    stage = 'validation';
    if (!file) {
      log('VALIDATION_ERROR', { reason: 'missing-file' });
      return NextResponse.json({ error: 'Missing file', stage, uploadId }, { status: 400 });
    }

    if (file.size <= 0) {
      log('VALIDATION_ERROR', { reason: 'empty-file', fileSize: file.size });
      return NextResponse.json({ error: 'File is empty', stage, uploadId }, { status: 400 });
    }

    if (file.size > MAX_VIDEO_SIZE) {
      log('VALIDATION_ERROR', { reason: 'too-large', fileSize: file.size, maxSize: MAX_VIDEO_SIZE });
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB (max ${MAX_VIDEO_SIZE / 1024 / 1024} MB)`, stage, uploadId },
        { status: 413 },
      );
    }

    if (!VIDEO_TYPES.has(file.type)) {
      log('VALIDATION_ERROR', { reason: 'unsupported-type', mimeType: file.type });
      return NextResponse.json(
        { error: `Unsupported type: ${file.type}`, stage, uploadId },
        { status: 415 },
      );
    }

    log('FILE_RECEIVED', { fileName: file.name, fileSize: file.size, mimeType: file.type });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!verifyMagicBytes(buffer, file.type)) {
      log('VALIDATION_ERROR', { reason: 'magic-bytes-mismatch', mimeType: file.type });
      return NextResponse.json(
        { error: 'File content does not match declared type', stage, uploadId },
        { status: 415 },
      );
    }

    // Sweep opportuniste des entrées expirées (2 h) — pas de cron.
    await sweepStaging();

    stage = 'staging';
    log('STAGE_WRITE_START', { fileSize: buffer.length, mimeType: file.type });
    const staged = await stageFile({
      buffer,
      mime: file.type,
      originalName: file.name,
    });
    log('STAGE_WRITE_SUCCESS', {
      sourceUploadId: staged.sourceUploadId,
      fileSize: staged.size,
      elapsedMs: Date.now() - startedAt,
    });

    log('SUCCESS', {
      totalElapsedMs: Date.now() - startedAt,
      originalSize: staged.size,
    });

    return NextResponse.json(
      {
        sourceUploadId: staged.sourceUploadId,
        path: staged.path,
        size: staged.size,
        mime: staged.mime,
      },
      { status: 200 },
    );
  } catch (err: any) {
    log('ERROR', {
      stage,
      errorName: err?.name || 'Unknown',
      errorMessage: err?.message || 'Unknown error',
      elapsedMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: 'Staging failed', code: CODES.UNKNOWN, stage, uploadId },
      { status: 500 },
    );
  }
}

/** Libère la source temporaire (appelé au reset / remplacement / annulation). */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const uploadId = request.headers.get('x-upload-id') || generateUploadId();
  logUpload({
    id: uploadId,
    side: 'SERVER',
    stage: 'STAGE_DELETE',
    payload: { sourceUploadId: id },
  });
  const removed = await deleteStagedSource(id);
  return NextResponse.json({ deleted: removed }, { status: 200 });
}