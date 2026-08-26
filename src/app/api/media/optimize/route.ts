export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

// --- FFmpeg / FFprobe binary resolution ---
function resolveFFmpegPath(): string {
  // 1. Check system PATH first (works in Docker, local dev with ffmpeg installed)
  try {
    const ffmpegStatic = require('ffmpeg-static') as string;
    if (ffmpegStatic && require('fs').existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch {}
  return 'ffmpeg';
}

function resolveFFprobePath(): string {
  try {
    const ffprobeStatic = require('ffprobe-static') as { path: string };
    if (ffprobeStatic?.path && require('fs').existsSync(ffprobeStatic.path)) return ffprobeStatic.path;
  } catch {}
  return 'ffprobe';
}

const FFMPEG_PATH = resolveFFmpegPath();
const FFPROBE_PATH = resolveFFprobePath();

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const VIDEO_TIMEOUT_MS = 120_000;

async function checkCodecAvailable(codec: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(FFMPEG_PATH, ['-encoders']);
    return stdout.includes(codec);
  } catch {
    return false;
  }
}

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

function execFileAsync(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { timeout: 10_000 });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.slice(0, 200)}`));
    });
    proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`FFmpeg tool unavailable: ${cmd} not found at "${cmd}" — install ffmpeg/ffprobe or add ffmpeg-static/ffprobe-static`));
      } else {
        reject(err);
      }
    });
  });
}

async function optimizeVideoWithProgress(
  inputPath: string,
  outputPath: string,
  sendEvent: (event: string, data: any) => void,
  signal?: AbortSignal,
): Promise<{ outputFormat: string; outputMime: string }> {
  if (signal?.aborted) throw new Error('Video optimization cancelled');

  // --- Probe audio stream ---
  let hasAudio = false;
  try {
    const { stdout: streamInfo } = await execFileAsync(FFPROBE_PATH, [
      '-v', 'error', '-select_streams', 'a',
      '-show_entries', 'stream=index', '-of', 'csv=p=0', inputPath,
    ]);
    hasAudio = streamInfo.trim().length > 0;
  } catch (err: any) {
    if (err.message?.includes('not found') || err.code === 'ENOENT') {
      console.error('[media/optimize] FFprobe unavailable for audio detection:', err.message);
      throw new Error(`FFmpeg tool unavailable: ${err.message}`);
    }
    console.warn('[media/optimize] FFprobe audio detection failed (continuing without audio):', err.message);
    hasAudio = false;
  }

  // --- Probe duration ---
  let totalDuration = 0;
  try {
    const { stdout } = await execFileAsync(FFPROBE_PATH, [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', inputPath,
    ]);
    totalDuration = parseFloat(stdout.trim()) || 0;
  } catch (err: any) {
    if (err.message?.includes('not found') || err.code === 'ENOENT') {
      console.error('[media/optimize] FFprobe unavailable for duration:', err.message);
      throw new Error(`FFmpeg tool unavailable: ${err.message}`);
    }
    console.warn('[media/optimize] FFprobe duration detection failed (progress will be indeterminate):', err.message);
    totalDuration = 0;
  }

  if (signal?.aborted) throw new Error('Video optimization cancelled');

  // Detect available video/audio codecs
  const hasVP9 = await checkCodecAvailable('libvpx-vp9');
  const hasVP8 = await checkCodecAvailable('libvpx');
  const hasOpus = await checkCodecAvailable('libopus');
  const hasAac = await checkCodecAvailable('aac');

  let vCodec = 'libvpx-vp9';
  let vExtra: string[] = ['-crf', '35', '-b:v', '0'];
  let outputFormat = 'webm';
  let outputMime = 'video/webm';
  if (hasVP9) {
    vCodec = 'libvpx-vp9';
    vExtra = ['-crf', '35', '-b:v', '0'];
  } else if (hasVP8) {
    vCodec = 'libvpx';
    vExtra = ['-crf', '35', '-b:v', '0'];
    console.warn('[media/optimize] libvpx-vp9 not available, falling back to libvpx');
  } else {
    console.warn('[media/optimize] No VP8/VP9 codec found, falling back to mpeg4 with mp4 container');
    vCodec = 'mpeg4';
    vExtra = ['-q:v', '5'];
    outputFormat = 'mp4';
    outputMime = 'video/mp4';
  }

  let aCodec = 'libopus';
  if (hasOpus) {
    aCodec = 'libopus';
  } else if (hasAac) {
    aCodec = 'aac';
    if (outputFormat === 'webm') { outputFormat = 'mp4'; outputMime = 'video/mp4'; }
    console.warn('[media/optimize] libopus not available, falling back to aac');
  } else {
    console.warn('[media/optimize] No Opus/AAC codec found, skipping audio');
  }

  const args = [
    '-i', inputPath,
    '-c:v', vCodec, ...vExtra,
    '-f', outputFormat, '-y',
    '-progress', 'pipe:1',
  ];
  if (hasAudio && (hasOpus || hasAac)) args.push('-c:a', aCodec, '-b:a', '128k');
  if (!hasAudio || (!hasOpus && !hasAac)) args.push('-an');
  args.push(outputPath);

  console.log(`[media/optimize] Starting FFmpeg: ${FFMPEG_PATH} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args, { timeout: VIDEO_TIMEOUT_MS });
    let stderr = '';
    let killed = false;

    const onAbort = () => {
      killed = true;
      console.log('[media/optimize] Aborting FFmpeg process (PID:', proc.pid, ')');
      try { proc.kill('SIGTERM'); } catch {}
      setTimeout(() => {
        if (!proc.killed) {
          try { proc.kill('SIGKILL'); } catch {}
        }
      }, 3000);
      reject(new Error('Video optimization cancelled'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });

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
      signal?.removeEventListener('abort', onAbort);
      if (killed) return;
      if (code === 0) {
        console.log('[media/optimize] FFmpeg completed successfully');
        resolve({ outputFormat, outputMime });
      } else {
        const msg = `FFmpeg exited with code ${code}: ${stderr.slice(-800)}`;
        console.error('[media/optimize]', msg);
        reject(new Error(msg));
      }
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      signal?.removeEventListener('abort', onAbort);
      if (killed) return;
      if (err.code === 'ENOENT') {
        reject(new Error(`FFmpeg unavailable: ${FFMPEG_PATH} not found — install ffmpeg or add ffmpeg-static`));
      } else if (err.code === 'ETIMEDOUT') {
        reject(new Error(`FFmpeg timed out after ${VIDEO_TIMEOUT_MS / 1000}s`));
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

function randomPath(kind: 'image' | 'video'): string {
  const ts = Date.now();
  const rand = randomBytes(8).toString('hex');
  const ext = kind === 'image' ? 'webp' : 'webm';
  const dir = kind === 'image' ? 'media/images' : 'media/videos';
  return `${dir}/${ts}_${rand}.${ext}`;
}

async function cleanupFiles(files: string[]) {
  for (const f of files) {
    try { await unlink(f); } catch {}
  }
}

export async function POST(request: NextRequest) {
  const tmpFiles: string[] = [];
  const signal = request.signal;

  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(ctrl) {
      controllerRef = ctrl;
    },
  });

  function sendEvent(event: string, data: any) {
    if (controllerRef) {
      try {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controllerRef.enqueue(encoder.encode(payload));
      } catch {}
    }
  }

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  (async () => {
    try {
      if (signal?.aborted) {
        sendEvent('error', { error: 'Request cancelled' });
        return;
      }

      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        sendEvent('error', { error: 'Missing file' });
        return;
      }

      const kind = getMediaKind(file.type);
      if (!kind) {
        sendEvent('error', { error: `Unsupported type: ${file.type}` });
        return;
      }

      const originalSize = file.size;
      const maxSize = kind === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (originalSize > maxSize) {
        sendEvent('error', { error: `File too large: ${(originalSize / 1024 / 1024).toFixed(1)} MB (max ${maxSize / 1024 / 1024} MB)` });
        return;
      }

      console.log(`[media/optimize] Processing ${kind}: ${file.name} (${(originalSize / 1024 / 1024).toFixed(1)} MB)`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!verifyMagicBytes(buffer, file.type)) {
        sendEvent('error', { error: 'File content does not match declared type' });
        return;
      }

      let optimizedBuffer: Buffer;
      let videoOutputMime = 'video/webm';

      if (kind === 'image') {
        sendEvent('progress', { progress: 10, phase: 'processing' });
        optimizedBuffer = await optimizeImage(buffer);
        sendEvent('progress', { progress: 90, phase: 'uploading' });
      } else {
        if (signal?.aborted) throw new Error('Video optimization cancelled');

        sendEvent('progress', { progress: 5, phase: 'processing' });
        const id = randomBytes(8).toString('hex');
        const origExt = videoExtFromMime(file.type);
        const inputTmp = join(tmpdir(), `opt_in_${id}.${origExt}`);
        const outputTmp = join(tmpdir(), `opt_out_${id}.webm`);
        tmpFiles.push(inputTmp, outputTmp);

        await writeFile(inputTmp, buffer);
        sendEvent('progress', { progress: 10, phase: 'processing' });
        const { outputMime } = await optimizeVideoWithProgress(inputTmp, outputTmp, sendEvent, signal);
        videoOutputMime = outputMime;
        sendEvent('progress', { progress: 95, phase: 'uploading' });
        optimizedBuffer = await readFile(outputTmp);
      }

      if (signal?.aborted) throw new Error('Video optimization cancelled');

      const { app } = getFirebaseAdmin();
      const bucket = getStorage(app).bucket();
      const storagePath = randomPath(kind);
      const fileRef = bucket.file(storagePath);

      await fileRef.save(optimizedBuffer, {
        metadata: { contentType: kind === 'image' ? 'image/webp' : videoOutputMime },
      });

      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      console.log(`[media/optimize] Success: ${kind} (${(originalSize / 1024).toFixed(0)}KB → ${(optimizedBuffer.length / 1024).toFixed(0)}KB)`);

      sendEvent('result', {
        url,
        originalSize,
        optimizedSize: optimizedBuffer.length,
        type: kind,
      });
    } catch (err: any) {
      if (err.message === 'Video optimization cancelled' || err.name === 'AbortError') {
        console.log('[media/optimize] Operation cancelled');
        sendEvent('error', { error: 'Video optimization cancelled', cancelled: true });
      } else {
        console.error('[media/optimize]', err);
        sendEvent('error', { error: err.message || 'Internal server error' });
      }
    } finally {
      await cleanupFiles(tmpFiles);
      try { controllerRef?.close(); } catch {}
    }
  })();

  return response;
}
