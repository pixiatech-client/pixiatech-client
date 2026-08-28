'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadImageFull } from '@/lib/uploadImage';
import { getUploadIdForSignal, logUpload } from '@/lib/media-upload-diag';

const DIAG_MOUNT_TS = Date.now();

export type MediaStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface MediaUploadState {
  status: MediaStatus;
  progress: number;
  originalSize: number;
  optimizedSize: number;
  url: string;
  error: string;
  fileName: string;
  isVideo: boolean;
}

const INITIAL_STATE: MediaUploadState = {
  status: 'idle',
  progress: 0,
  originalSize: 0,
  optimizedSize: 0,
  url: '',
  error: '',
  fileName: '',
  isVideo: false,
};

export function useMediaUpload() {
  const [state, setState] = useState<MediaUploadState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    const prev = abortRef.current;
    logUpload({
      id: getUploadIdForSignal(prev?.signal) || 'no_active_upload',
      side: 'CLIENT',
      stage: 'ABORT',
      payload: { reason: 'reset', source: 'useMediaUpload.reset', elapsedMs: Date.now() - DIAG_MOUNT_TS },
    });
    prev?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const upload = useCallback(async (file: File): Promise<string> => {
    const prev = abortRef.current;
    logUpload({
      id: getUploadIdForSignal(prev?.signal) || 'no_active_upload',
      side: 'CLIENT',
      stage: 'ABORT',
      payload: { reason: 'new-upload', source: 'useMediaUpload.upload', elapsedMs: Date.now() - DIAG_MOUNT_TS },
    });
    prev?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isVideo = file.type.startsWith('video/');

    setState({
      status: 'uploading',
      progress: 0,
      originalSize: file.size,
      optimizedSize: 0,
      url: '',
      error: '',
      fileName: file.name,
      isVideo,
    });

    try {
      const result = await uploadImageFull({
        file,
        optimize: true,
        signal: controller.signal,
        onProgress: (pct) => {
          let status: MediaStatus = 'processing';
          if (pct < 10) status = 'uploading';
          else if (pct >= 95) status = 'uploading';

          setState(prev => ({
            ...prev,
            progress: pct,
            status,
          }));
        },
      });

      setState({
        status: 'completed',
        progress: 100,
        originalSize: result.originalSize ?? file.size,
        optimizedSize: result.optimizedSize ?? file.size,
        url: result.url,
        error: '',
        fileName: file.name,
        isVideo,
      });

      return result.url;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setState(INITIAL_STATE);
        return '';
      }
      setState(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: err.message || 'Upload failed',
      }));
      throw err;
    }
  }, []);

  return {
    ...state,
    upload,
    reset,
    abort: () => {
      const c = abortRef.current;
      if (c) {
        logUpload({
          id: getUploadIdForSignal(c.signal) || 'no_active_upload',
          side: 'CLIENT',
          stage: 'ABORT',
          payload: { reason: 'user-action', source: 'useMediaUpload.abort', elapsedMs: Date.now() - DIAG_MOUNT_TS },
        });
        c.abort();
      }
    },
  };
}
