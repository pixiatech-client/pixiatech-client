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
  /** Real transfer progress: bytes actually sent to the server (0–100 + byte counts) */
  onUploadProgress?: (pct: number, loadedBytes: number, totalBytes: number) => void;
  /** AbortSignal to cancel the upload */
  signal?: AbortSignal;
}

interface UploadImageResult {
  url: string;
  originalSize?: number;
  optimizedSize?: number;
  uploadId?: string;
}

interface StageVideoResult {
  sourceUploadId: string;
  size: number;
  mime: string;
}

interface XhrPostResult {
  status: number;
  statusText: string;
  ok: boolean;
  contentType: string;
}

/**
 * POST FormData via XMLHttpRequest pour obtenir une progression réelle du
 * téléversement (xhr.upload.onprogress). Le corps et les en-têtes restent
 * identiques à l'ancien `fetch` ; seule la manière de suivre le transfert change.
 */
function xhrPostWithProgress(opts: {
  url: string;
  body: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onUploadProgress?: (loaded: number, total: number) => void;
  onResponseChunk?: (chunk: string) => void;
}): Promise<XhrPostResult> {
  let onSignalAbort: (() => void) | null = null;

  const promise = new Promise<XhrPostResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', opts.url);
    if (opts.headers) {
      for (const [key, value] of Object.entries(opts.headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    xhr.responseType = 'text';

    if (opts.onUploadProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) opts.onUploadProgress!(event.loaded, event.total);
      };
    }

    let cursor = 0;
    const flushChunk = () => {
      if (!opts.onResponseChunk) return;
      const text = xhr.responseText || '';
      if (text.length > cursor) {
        opts.onResponseChunk(text.slice(cursor));
        cursor = text.length;
      }
    };

    xhr.onprogress = flushChunk;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING) flushChunk();
    };

    xhr.onload = () => {
      flushChunk();
      resolve({
        status: xhr.status,
        statusText: xhr.statusText,
        ok: xhr.status >= 200 && xhr.status < 300,
        contentType: xhr.getResponseHeader('content-type') || '',
      });
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.onabort = () => {
      const err = new Error('Upload cancelled');
      (err as any).name = 'AbortError';
      (err as any).code = 'ABORTED';
      reject(err);
    };

    onSignalAbort = () => xhr.abort();

    if (opts.signal) {
      if (opts.signal.aborted) xhr.abort();
      else opts.signal.addEventListener('abort', onSignalAbort, { once: true });
    }

    xhr.send(opts.body);
  });

  promise.finally(() => {
    if (opts.signal && onSignalAbort) opts.signal.removeEventListener('abort', onSignalAbort);
  });

  return promise;
}

/**
 * POST /api/media/optimize (flux SSE) et interprétation des événements
 * `progress` / `result` / `error`. Source d'entrée : fichier FormData (upload
 * direct legacy) OU source déjà téléversée en brut via `x-source-upload-id`
 * (PROGRESSION #1 → source stagée). Code/Schéma de transport identique.
 */
async function uploadViaOptimizeStream(opts: {
  uploadId: string;
  startedAt: number;
  file?: File | null;
  sourceUploadId?: string | null;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
  onUploadProgress?: (pct: number, loadedBytes: number, totalBytes: number) => void;
}): Promise<UploadImageResult> {
  const { uploadId, startedAt, file, sourceUploadId, signal, onProgress, onUploadProgress } = opts;

  const log = (stage: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'CLIENT', stage, payload });

  let lastProgressLog: { value: number; at: number } | undefined;

  const hasFile = !!file;
  log(hasFile ? 'FORMDATA_START' : 'STAGED_REQUEST', {
    fields: hasFile ? 1 : 0,
    sourceUploadId: sourceUploadId || undefined,
  });
  const formData = new FormData();
  if (file) formData.append('file', file);
  log(hasFile ? 'FORMDATA_READY' : 'STAGED_READY', { fields: hasFile ? 1 : 0 });

  const headers: Record<string, string> = {
    'x-upload-id': uploadId,
  };
  if (sourceUploadId) headers['x-source-upload-id'] = sourceUploadId;

  log('REQUEST_START', {
    endpoint: '/api/media/optimize',
    method: 'POST',
    source: sourceUploadId ? 'staged' : 'post',
    fileSize: file?.size,
    uploadId,
  });

  let res: XhrPostResult;
  let rawBody = '';
  let resultData: any = null;
  let serverError: MediaUploadError | null = null;
  let sseBuffer = '';

  const processSseChunk = (chunk: string) => {
    rawBody += chunk;
    sseBuffer += chunk;
    const events = sseBuffer.split('\n\n');
    sseBuffer = events.pop() || '';
    for (const evt of events) {
      const lines = evt.split('\n');
      let eventType = '';
      let eventData = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        else if (line.startsWith('data: ')) eventData = line.slice(6);
      }
      if (!eventType || !eventData) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(eventData);
      } catch {
        continue;
      }
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
        serverError = new MediaUploadError({
          code: parsed?.code || CODES.UNKNOWN,
          stage: parsed?.stage || 'server',
          uploadId: parsed?.uploadId || uploadId,
          userMessage: parsed?.userMessage,
          technicalMessage: parsed?.error || 'Optimization failed',
          name: parsed?.cancelled ? 'AbortError' : undefined,
        });
        log('SSE_ERROR', {
          stage: serverError.stage,
          errorName: serverError.name,
          errorMessage: serverError.technicalMessage,
          elapsedMs: Date.now() - startedAt,
        });
      }
    }
  };

  try {
    res = await xhrPostWithProgress({
      url: '/api/media/optimize',
      body: formData,
      headers,
      signal,
      onUploadProgress: (loaded, total) => {
        if (total <= 0) return;
        const pct = Math.min(100, Math.round((loaded / total) * 100));
        onUploadProgress?.(pct, loaded, total);
        if (shouldLogProgress(lastProgressLog, Date.now(), pct)) {
          lastProgressLog = { value: pct, at: Date.now() };
          log('UPLOAD_PROGRESS', {
            loadedBytes: loaded,
            totalBytes: total,
            percentage: pct,
            elapsedMs: Date.now() - startedAt,
          });
        }
      },
      onResponseChunk: processSseChunk,
    });
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    log('ERROR', {
      stage: 'transport',
      errorName: err?.name || 'Unknown',
      errorMessage: err?.message || 'xhr failed',
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
    contentType: res.contentType,
  });

  if (serverError) throw serverError;

  if (!res.ok) {
    const msg: string = (() => {
      try {
        const body = JSON.parse(rawBody);
        return body?.error || `HTTP ${res.status}`;
      } catch {
        return `HTTP ${res.status}`;
      }
    })();
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
  if (!res.contentType.includes('text/event-stream')) {
    const data = JSON.parse(rawBody);
    log('SUCCESS', {
      totalElapsedMs: Date.now() - startedAt,
      originalSize: data?.originalSize,
      optimizedSize: data?.optimizedSize,
    });
    onProgress?.(100);
    return { url: data.url, originalSize: data.originalSize, optimizedSize: data.optimizedSize, uploadId };
  }

  log('SSE_CONNECT', { elapsedMs: Date.now() - startedAt });

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

  const { file, optimize = false, onProgress, onUploadProgress, signal } = opts;

  const uploadId = generateUploadId();
  const startedAt = Date.now();

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
    // Transport : XMLHttpRequest (au lieu de fetch) pour pouvoir mesurer la
    // progression réelle des octets envoyés via xhr.upload.onprogress.
    return await uploadViaOptimizeStream({
      uploadId,
      startedAt,
      file,
      signal,
      onProgress,
      onUploadProgress,
    });
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

/**
 * PROGRESSION #1 — téléverse le fichier BRUT (MP4) vers /api/media/upload
 * (stockage temporaire côté serveur, sans transformation) avec une progression
 * réelle de transfert (0 → 100 %) via xhr.upload.onprogress.
 * Renvoie le `sourceUploadId` à retransmettre à /api/media/optimize.
 */
export async function stageVideoFile(opts: {
  file: File;
  signal?: AbortSignal;
  onUploadProgress?: (pct: number, loadedBytes: number, totalBytes: number) => void;
}): Promise<StageVideoResult> {
  const { file, signal, onUploadProgress } = opts;
  const uploadId = generateUploadId();
  const startedAt = Date.now();
  let lastProgressLog: { value: number; at: number } | undefined;

  registerUploadId(signal, uploadId);

  const log = (stage: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'CLIENT', stage, payload });

  try {
    log('START', { fileName: file.name, fileSize: file.size, mimeType: file.type });

    const formData = new FormData();
    formData.append('file', file);
    log('REQUEST_START', { endpoint: '/api/media/upload', method: 'POST', fileSize: file.size, uploadId });

    let res: XhrPostResult;
    let rawBody = '';
    try {
      res = await xhrPostWithProgress({
        url: '/api/media/upload',
        body: formData,
        headers: { 'x-upload-id': uploadId },
        signal,
        onUploadProgress: (loaded, total) => {
          if (total <= 0) return;
          const pct = Math.min(100, Math.round((loaded / total) * 100));
          onUploadProgress?.(pct, loaded, total);
          if (shouldLogProgress(lastProgressLog, Date.now(), pct)) {
            lastProgressLog = { value: pct, at: Date.now() };
            log('UPLOAD_PROGRESS', {
              loadedBytes: loaded,
              totalBytes: total,
              percentage: pct,
              elapsedMs: Date.now() - startedAt,
            });
          }
        },
        onResponseChunk: (chunk) => { rawBody += chunk; },
      });
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      log('ERROR', {
        stage: 'transport',
        errorName: err?.name || 'Unknown',
        errorMessage: err?.message || 'xhr failed',
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
      contentType: res.contentType,
    });

    if (!res.ok) {
      const msg: string = (() => {
        try {
          const body = JSON.parse(rawBody);
          return body?.error || `HTTP ${res.status}`;
        } catch {
          return `HTTP ${res.status}`;
        }
      })();
      const code = res.status === 413 || res.status === 415 || res.status === 400
        ? CODES.VALIDATION
        : CODES.UNKNOWN;
      log('ERROR', {
        stage: 'http',
        errorName: 'HTTPError',
        errorMessage: `${res.status} ${res.statusText}`,
        elapsedMs: Date.now() - startedAt,
      });
      throw new MediaUploadError({
        code,
        stage: 'http',
        uploadId,
        technicalMessage: msg,
        userMessage: msg,
      });
    }

    let data: any;
    try {
      data = JSON.parse(rawBody || '{}');
    } catch {
      throw new MediaUploadError({
        code: CODES.UNKNOWN,
        stage: 'http',
        uploadId,
        technicalMessage: 'Staging response was not valid JSON',
      });
    }
    if (!data?.sourceUploadId) {
      throw new MediaUploadError({
        code: CODES.UNKNOWN,
        stage: 'http',
        uploadId,
        technicalMessage: 'Staging response missing sourceUploadId',
      });
    }

    log('SUCCESS', {
      totalElapsedMs: Date.now() - startedAt,
      sourceUploadId: data.sourceUploadId,
      originalSize: data.size,
    });
    return { sourceUploadId: data.sourceUploadId, size: data.size, mime: data.mime };
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

/**
 * Libère côté serveur une source temporaire (réinitialisation / remplacement /
 * annulation). Best-effort : les erreurs sont ignorées (idempotent).
 */
export async function unstageVideoFile(sourceUploadId: string): Promise<void> {
  try {
    await fetch(`/api/media/upload?id=${encodeURIComponent(sourceUploadId)}`, {
      method: 'DELETE',
    });
  } catch {}
}

/**
 * PROGRESSION #2 — optimise (FFmpeg, SSE) une source déjà téléversée en brut.
 * Aucun re-transfert du fichier depuis le client : seul l'en-tête
 * `x-source-upload-id` est envoyé. C'est le branchement principal de
 * handleSaveProduct quand la phase 1 a été exécutée à l'Ouverture.
 */
export async function optimizeStagedVideo(opts: {
  sourceUploadId: string;
  originalSize?: number;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
  onUploadProgress?: (pct: number, loadedBytes: number, totalBytes: number) => void;
}): Promise<UploadImageResult> {
  const { sourceUploadId, originalSize, signal, onProgress, onUploadProgress } = opts;
  const uploadId = generateUploadId();
  const startedAt = Date.now();

  registerUploadId(signal, uploadId);

  const log = (stage: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'CLIENT', stage, payload });

  try {
    log('START', { sourceUploadId, originalSize });
    const result = await uploadViaOptimizeStream({
      uploadId,
      startedAt,
      sourceUploadId,
      signal,
      onProgress,
      onUploadProgress,
    });
    return result;
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