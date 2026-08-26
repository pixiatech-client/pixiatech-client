export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const execFileAsync = promisify(execFile);

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']);

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
  'video/quicktime': [[0x66, 0x74, 0x79, 0x70]],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
};

function verifyMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const signatures = MAGIC_BYTES[declaredMime];
  if (!signatures) return true;
  return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

function getMediaKind(mime: string): 'image' | 'video' | null {
  if (mime.startsWith('image/') && IMAGE_TYPES.has(mime)) return 'image';
  if (mime.startsWith('video/') && VIDEO_TYPES.has(mime)) return 'video';
  return null;
}

function videoExtFromMime(mime: string): string {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('quicktime')) return 'mov';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('x-msvideo')) return 'avi';
  if (mime.includes('x-matroska')) return 'mkv';
  return 'mp4';
}

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, effort: 4 })
    .toBuffer();
}

async function optimizeVideoWithProgress(
  inputPath: string,
  outputPath: string,
  sendEvent: (event: string, data: any) => void,
): Promise<void> {
  let hasAudio = false;
  try {
    const { stdout: streamInfo } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'a',
      '-show_entries', 'stream=index', '-of', 'csv=p=0', inputPath,
    ]);
    hasAudio = streamInfo.trim().length > 0;
  } catch { hasAudio = false; }

  // Get total duration
  let totalDuration = 0;
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', inputPath,
    ]);
    totalDuration = parseFloat(stdout.trim()) || 0;
  } catch {}

  const args = [
    '-i', inputPath,
    '-c:v', 'libvpx-vp9', '-crf', '35', '-b:v', '0',
    '-f', 'webm', '-y',
    '-progress', 'pipe:1',
  ];
  if (hasAudio) args.push('-c:a', 'libopus', '-b:a', '128k');
  args.push(outputPath);

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { timeout: 120_000 });
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('out_time_us=')) {
          const us = parseInt(line.split('=')[1] || '0', 10);
          const current = us / 1_000_000;
          if (totalDuration > 0) {
            const pct = Math.min(99, Math.round((current / totalDuration) * 100));
            sendEvent('progress', { progress: pct });
          }
        }
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(0, 200)}`));
    });

    proc.on('error', reject);
  });
}

function randomPath(kind: 'image' | 'video'): string {
  const ts = Date.now();
  const rand = randomBytes(8).toString('hex');
  const ext = kind === 'image' ? 'webp' : 'webm';
  const dir = kind === 'image' ? 'media/images' : 'media/videos';
  return `${dir}/${ts}_${rand}.${ext}`;
}

function sseWriter(sendEvent: (event: string, data: any) => void) {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        (controller as any)._sendEvent = (event: string, data: any) => {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };
        (controller as any)._close = () => controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const tmpFiles: string[] = [];

  // Build SSE stream
  const stream = new ReadableStream({
    start(controller) {
      (controller as any)._buffer = [];
    },
  });

  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream2 = new ReadableStream({
    start(ctrl) {
      controllerRef = ctrl;
    },
  });

  function sendEvent(event: string, data: any) {
    if (controllerRef) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controllerRef.enqueue(encoder.encode(payload));
    }
  }

  const response = new Response(stream2, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Process in background
  (async () => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        sendEvent('error', { error: 'Missing file' });
        controllerRef?.close();
        return;
      }

      const kind = getMediaKind(file.type);
      if (!kind) {
        sendEvent('error', { error: `Unsupported type: ${file.type}` });
        controllerRef?.close();
        return;
      }

      const originalSize = file.size;
      const maxSize = kind === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (originalSize > maxSize) {
        sendEvent('error', { error: `File too large: ${(originalSize / 1024 / 1024).toFixed(1)} MB (max ${maxSize / 1024 / 1024} MB)` });
        controllerRef?.close();
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!verifyMagicBytes(buffer, file.type)) {
        sendEvent('error', { error: 'File content does not match declared type' });
        controllerRef?.close();
        return;
      }

      let optimizedBuffer: Buffer;

      if (kind === 'image') {
        sendEvent('progress', { progress: 10, phase: 'processing' });
        optimizedBuffer = await optimizeImage(buffer);
        sendEvent('progress', { progress: 90, phase: 'uploading' });
      } else {
        sendEvent('progress', { progress: 5, phase: 'processing' });
        const id = randomBytes(8).toString('hex');
        const origExt = videoExtFromMime(file.type);
        const inputTmp = join(tmpdir(), `opt_in_${id}.${origExt}`);
        const outputTmp = join(tmpdir(), `opt_out_${id}.webm`);
        tmpFiles.push(inputTmp, outputTmp);

        await writeFile(inputTmp, buffer);
        sendEvent('progress', { progress: 10, phase: 'processing' });
        await optimizeVideoWithProgress(inputTmp, outputTmp, sendEvent);
        sendEvent('progress', { progress: 95, phase: 'uploading' });
        optimizedBuffer = await readFile(outputTmp);
      }

      // Upload to Firebase Storage
      const { app } = getFirebaseAdmin();
      const bucket = getStorage(app).bucket();
      const storagePath = randomPath(kind);
      const fileRef = bucket.file(storagePath);

      await fileRef.save(optimizedBuffer, {
        metadata: { contentType: kind === 'image' ? 'image/webp' : 'video/webm' },
      });

      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      sendEvent('result', {
        url,
        originalSize,
        optimizedSize: optimizedBuffer.length,
        type: kind,
      });
    } catch (err: any) {
      console.error('[media/optimize]', err);
      sendEvent('error', { error: err.message || 'Internal server error' });
    } finally {
      for (const f of tmpFiles) {
        try { await unlink(f); } catch {}
      }
      controllerRef?.close();
    }
  })();

  return response;
}
