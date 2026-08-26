'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadImageFull } from '@/lib/uploadImage';

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
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const upload = useCallback(async (file: File): Promise<string> => {
    abortRef.current?.abort();
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

  return { ...state, upload, reset, abort: () => abortRef.current?.abort() };
}
