'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

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
 * Use this when you need to display the size indicator.
 */
export async function uploadImageFull(
  fileOrOptions: File | UploadImageOptions,
): Promise<UploadImageResult> {
  const opts: UploadImageOptions =
    fileOrOptions instanceof File
      ? { file: fileOrOptions, optimize: false }
      : fileOrOptions;

  const { file, optimize = false, onProgress, signal } = opts;

  // Fast path: direct upload (existing behavior)
  if (!optimize) {
    const firebaseApp = getApp();
    const storage = getStorage(firebaseApp);
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `uploads/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, originalSize: file.size, optimizedSize: file.size };
  }

  // Optimized path: server-side compression via SSE stream
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/media/optimize', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  // Read SSE stream
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const data = await res.json();
    onProgress?.(100);
    return { url: data.url, originalSize: data.originalSize, optimizedSize: data.optimizedSize };
  }

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
        } else if (eventType === 'result') {
          resultData = parsed;
        } else if (eventType === 'error') {
          // Propagate the real error from the server — never mask it
          if (parsed.cancelled) {
            const err = new Error(parsed.error || 'Operation cancelled');
            err.name = 'AbortError';
            throw err;
          }
          throw new Error(parsed.error || 'Optimization failed');
        }
      }
    }
  } catch (err: any) {
    // AbortError from fetch signal or from SSE error event
    if (err.name === 'AbortError' || err.message === 'Operation cancelled') {
      const abortErr = new Error('Upload cancelled');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }

  if (!resultData) throw new Error('No result received from optimization — the server may have disconnected');

  onProgress?.(100);
  return {
    url: resultData.url,
    originalSize: resultData.originalSize,
    optimizedSize: resultData.optimizedSize,
  };
}
