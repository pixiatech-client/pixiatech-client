'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";
import {
  generateUploadId,
  logUpload,
  MediaUploadError,
  registerUploadId,
  unregisterUploadId,
  shouldLogProgress,
  UPLOAD_ERROR_CODES as CODES,
} from './media-upload-diag';

interface UploadImageOptions {
  file: File;
  /** When true, route through /api/media/optimize for server-side compression (default: false) */
  optimize?: boolean;
  /** Progress callback: receives 0–100 during upload/compression phases */
  onProgress?: (pct: number) => void;
  /** AbortSignal to cancel the upload */
  signal?: AbortSignal;
}

interface UploadImageResult {
  url: string;
  originalSize?: number;
  optimizedSize?: number;
  uploadId?: string;
}

/**
 * Upload a file to Firebase Storage (returns URL string).
 * Backward-compatible with existing callers that pass a plain File.
 */
export async function uploadImage(
  fileOrOptions: File | UploadImageOptions,
): Promise<string> {
  const result = await uploadImageFull(fileOrOptions);
  return result.url;
}

/**
 * Upload a file with full result including size info.
 * Instrumenté : chaque tentative reçoit un `uploadId` (upl_YYYYMMDD_xxxxxx),
 * diffusé dans les logs client, le header `x-upload-id`, et les événements SSE.
 */
export async function uploadImageFull(
  fileOrOptions: File | UploadImageOptions,
): Promise<UploadImageResult> {
  const opts: UploadImageOptions =
    fileOrOptions instanceof File
      ? { file: fileOrOptions, optimize: false }
      : fileOrOptions;

  const { file, optimize = false, onProgress, signal } = opts;

  const uploadId = generateUploadId();
  const startedAt = Date.now();
  let lastProgressLog: { value: number; at: number } | undefined;

  registerUploadId(signal, uploadId);

  const log = (stage: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'CLIENT', stage, payload });

  try {
    log('START', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    // Fast path: direct upload (existing behavior)
    if (!optimize) {
      log('DIRECT_START', { endpoint: 'firebase-storage', fileSize: file.size });
      const firebaseApp = getApp();
      const storage = getStorage(firebaseApp);
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `uploads/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      log('SUCCESS', {
        totalElapsedMs: Date.now() - startedAt,
        originalSize: file.size,
        optimizedSize: file.size,
      });
      return { url, originalSize: file.size, optimizedSize: file.size, uploadId };
    }

    // Optimized path: server-side compression via SSE stream
    log('FORMDATA_START', { fields: 1 });
    const formData = new FormData();
    formData.append('file', file);
    log('FORMDATA_READY', { fields: 1 });

    log('REQUEST_START', {
      endpoint: '/api/media/optimize',
      method: 'POST',
      fileSize: file.size,
      uploadId,
    });

    let res: Response;
    try {
      res = await fetch('/api/media/optimize', {
        method: 'POST',
        body: formData,
        signal,
        headers: {
          'x-upload-id': uploadId,
        },
      });
    } catch (err: any) {
      // Abort ou erreur réseau sur le fetch lui-même
      const isAbort = err?.name === 'AbortError';
      log('ERROR', {
        stage: 'transport',
        errorName: err?.name || 'Unknown',
        errorMessage: err?.message || 'fetch failed',
        elapsedMs: Date.now() - startedAt,
      });
      if (isAbort) {
        throw new MediaUploadError({
          code: CODES.ABORTED,
          stage: 'transport',
          uploadId,
          name: 'AbortError',
          technicalMessage: err?.message || 'Upload cancelled',
        });
      }
      throw new MediaUploadError({
        code: CODES.NETWORK,
        stage: 'transport',
        uploadId,
        cause: err,
        technicalMessage: err?.message || 'Network error',
      });
    }

    log('RESPONSE', {
      status: res.status,
      statusText: res.statusText,
      elapsedMs: Date.now() - startedAt,
      contentType: res.headers.get('content-type') || '',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload failed' }));
      const msg: string = body.error || `HTTP ${res.status}`;
      log('ERROR', {
        stage: 'http',
        errorName: 'HTTPError',
        errorMessage: `${res.status} ${res.statusText}`,
        elapsedMs: Date.now() - startedAt,
      });
      throw new MediaUploadError({
        code: CODES.UNKNOWN,
        stage: 'http',
        uploadId,
        technicalMessage: msg,
        userMessage: msg,
      });
    }

    // Read SSE stream
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const data = await res.json();
      log('SUCCESS', {
        totalElapsedMs: Date.now() - startedAt,
        originalSize: data?.originalSize,
        optimizedSize: data?.optimizedSize,
      });
      onProgress?.(100);
      return { url: data.url, originalSize: data.originalSize, optimizedSize: data.optimizedSize, uploadId };
    }

    log('SSE_CONNECT', { elapsedMs: Date.now() - startedAt });

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let resultData: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          const parsed = JSON.parse(eventData);

          if (eventType === 'progress') {
            onProgress?.(parsed.progress ?? 50);
            if (shouldLogProgress(lastProgressLog, Date.now(), parsed.progress ?? 0)) {
              lastProgressLog = { value: parsed.progress ?? 0, at: Date.now() };
              log('SSE_PROGRESS', {
                percentage: parsed.progress ?? 0,
                elapsedMs: Date.now() - startedAt,
              });
            }
          } else if (eventType === 'result') {
            resultData = parsed;
            log('SSE_RESULT', {
              elapsedMs: Date.now() - startedAt,
              optimizedSize: parsed?.optimizedSize,
            });
          } else if (eventType === 'error') {
            const err = new MediaUploadError({
              code: parsed?.code || CODES.UNKNOWN,
              stage: parsed?.stage || 'server',
              uploadId: parsed?.uploadId || uploadId,
              userMessage: parsed?.userMessage,
              technicalMessage: parsed?.error || 'Optimization failed',
              name: parsed?.cancelled ? 'AbortError' : undefined,
            });
            log('SSE_ERROR', {
              stage: err.stage,
              errorName: err.name,
              errorMessage: err.technicalMessage,
              elapsedMs: Date.now() - startedAt,
            });
            throw err;
          }
        }
      }
    } catch (err: any) {
      // AbortError from fetch signal or from SSE error event
      if (err instanceof MediaUploadError) {
        if (err.code === CODES.ABORTED) {
          log('SSE_END', { elapsedMs: Date.now() - startedAt });
          throw err;
        }
        log('SSE_END', { elapsedMs: Date.now() - startedAt });
        throw err;
      }
      if (err?.name === 'AbortError' || err?.message === 'Operation cancelled') {
        log('ERROR', {
          stage: 'sse',
          errorName: 'AbortError',
          errorMessage: 'Upload cancelled',
          elapsedMs: Date.now() - startedAt,
        });
        throw new MediaUploadError({
          code: CODES.ABORTED,
          stage: 'sse',
          uploadId,
          name: 'AbortError',
          technicalMessage: 'Operation cancelled',
        });
      }
      log('ERROR', {
        stage: 'sse',
        errorName: err?.name || 'Unknown',
        errorMessage: err?.message || 'SSE read failed',
        elapsedMs: Date.now() - startedAt,
      });
      throw err;
    } finally {
      reader.releaseLock();
    }

    if (!resultData) {
      const msg = 'No result received from optimization — the server may have disconnected';
      log('ERROR', {
        stage: 'sse',
        errorName: 'Unknown',
        errorMessage: msg,
        elapsedMs: Date.now() - startedAt,
      });
      throw new MediaUploadError({
        code: CODES.UNKNOWN,
        stage: 'sse',
        uploadId,
        technicalMessage: msg,
      });
    }

    onProgress?.(100);
    log('SUCCESS', {
      totalElapsedMs: Date.now() - startedAt,
      originalSize: resultData.originalSize,
      optimizedSize: resultData.optimizedSize,
    });
    return {
      url: resultData.url,
      originalSize: resultData.originalSize,
      optimizedSize: resultData.optimizedSize,
      uploadId,
    };
  } catch (err: any) {
    if (!(err instanceof MediaUploadError)) {
      log('ERROR', {
        stage: 'unknown',
        errorName: err?.name || 'Unknown',
        errorMessage: err?.message || 'Unknown error',
        elapsedMs: Date.now() - startedAt,
        cause: err?.cause?.message || undefined,
      });
      throw new MediaUploadError({
        code: CODES.UNKNOWN,
        stage: 'unknown',
        uploadId,
        cause: err,
        technicalMessage: err?.message || 'Unknown error',
      });
    }
    throw err;
  } finally {
    unregisterUploadId(signal);
  }
}