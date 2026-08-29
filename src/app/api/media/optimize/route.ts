export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import {
  generateUploadId,
  logUpload,
  MediaUploadError,
  shouldLogProgress,
  UPLOAD_ERROR_CODES as CODES,
  type UploadErrorCode,
} from '@/lib/media-upload-diag';
import { deleteStagedSource, readStagedSource, type StagedSourceInfo } from '@/lib/media-stage';
import { rateLimitExceeded } from '@/lib/rate-limit';
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
const VIDEO_TIMEOUT_MS = 300_000;

/**
 * Signaux = terminaison par interruption externe (retryable).
 * Les signaux "crash" (SIGABRT, SIGSEGV...) restent des erreurs réelles.
 */
const INTERRUPT_SIGNALS = new Set<string>([
  'SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT', 'SIGKILL', 'SIGUSR1', 'SIGUSR2',
  'SIGPIPE', 'SIGSTOP', 'SIGTSTP', 'SIGCONT', 'SIGTTIN', 'SIGTTOU', 'SIGWINCH',
]);

/** Map étape -> code d'erreur stable (diagnostic). */
function stageToCode(stage: string | undefined): UploadErrorCode {
  switch (stage) {
    case 'formdata_parse':
      return CODES.FORMDATA_PARSE;
    case 'validation':
      return CODES.VALIDATION;
    case 'video_processing':
      return CODES.FFMPEG;
    case 'storage':
      return CODES.STORAGE;
    default:
      return CODES.UNKNOWN;
  }
}

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
  let vExtra: string[] = ['-crf', '35', '-b:v', '0', '-cpu-used', '5', '-row-mt', '1'];
  let outputFormat = 'webm';
  let outputMime = 'video/webm';
  if (hasVP9) {
    vCodec = 'libvpx-vp9';
    vExtra = ['-crf', '35', '-b:v', '0', '-cpu-used', '5', '-row-mt', '1'];
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
    const procStartedAt = Date.now();
    let stderr = '';
    let killed = false;
    let timeoutTriggered = false;

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

    proc.on('close', (code, closeSignal) => {
      signal?.removeEventListener('abort', onAbort);
      const elapsedMs = Date.now() - procStartedAt;
      const interruptedBySignalParam = typeof closeSignal === 'string' && INTERRUPT_SIGNALS.has(closeSignal);
      const interruptedBySignalMarker = /Exiting normally, received signal \d+/.test(stderr);
      const interrupted = interruptedBySignalParam || interruptedBySignalMarker;
      console.info(
        `[media/optimize] FFMPEG_CLOSE_DIAG code=${code} closeSignal=${closeSignal ?? 'null'} ` +
        `killed=${proc.killed} abortTriggered=${killed} timeoutTriggered=${timeoutTriggered} ` +
        `timedOutByElapsed=${elapsedMs >= VIDEO_TIMEOUT_MS} interrupted=${interrupted} ` +
        `interruptedBySignal=${interruptedBySignalParam} interruptedByStderrMarker=${interruptedBySignalMarker} ` +
        `elapsedMs=${elapsedMs}`,
      );
      if (killed) return;
      if (code === 0) {
        console.log('[media/optimize] FFmpeg completed successfully');
        resolve({ outputFormat, outputMime });
      } else if (interrupted) {
        const msg = `FFmpeg interrupted (code=${code}, signal=${closeSignal ?? 'unknown'}): ${stderr.slice(-300)}`;
        console.error('[media/optimize]', msg);
        reject(new MediaUploadError({
          code: CODES.FFMPEG_INTERRUPTED,
          stage: 'video_processing',
          technicalMessage: msg,
        }));
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
        timeoutTriggered = true;
        reject(new Error(`FFmpeg timed out after ${VIDEO_TIMEOUT_MS / 1000}s`));
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

// --- Stratégie B : bypass du ré-encodage si le fichier est déjà au format cible ---
// Compatible = conteneur WebM + codec vidéo VP9 + audio absent ou Opus (sortie exacte du pipeline).
// Toute erreur de probe ou critère non rempli → fallback encode (comportement inchangé).
async function probeWebmCompatibility(
  ffprobePath: string,
  inputPath: string,
): Promise<{ compatible: boolean; container: string; vcodec: string; acodec: string }> {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v', 'error',
      '-show_entries', 'stream=codec_type,codec_name:format=format_name',
      '-of', 'json', inputPath,
    ]);
    const data = JSON.parse(stdout);
    const container: string = data?.format?.format_name || '';
    const streams: Array<{ codec_type?: string; codec_name?: string }> = data?.streams || [];
    let vcodec = '';
    let acodec = '';
    let audioCount = 0;
    for (const s of streams) {
      if (s.codec_type === 'video') vcodec = s.codec_name || '';
      if (s.codec_type === 'audio') {
        audioCount += 1;
        acodec = s.codec_name || '';
      }
    }
    const compatible =
      container.includes('webm') &&
      vcodec === 'vp9' &&
      (audioCount === 0 || (audioCount === 1 && acodec === 'opus'));
    return { compatible, container, vcodec, acodec };
  } catch (err: any) {
    console.warn('[media/optimize] Compatibility probe failed (falling back to encode):', err?.message || err);
    return { compatible: false, container: '', vcodec: '', acodec: '' };
  }
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
  if (rateLimitExceeded(request, 24, 120)) {
    return NextResponse.json({ error: 'Trop de requêtes de compression, veuillez réessayer plus tard' }, { status: 429 });
  }

  const tmpFiles: string[] = [];
  const signal = request.signal;

  // --- Contexte de diagnostic : uploadId transmis par le client ou généré ---
  const uploadId = request.headers.get('x-upload-id') || generateUploadId();
  const startedAt = Date.now();
  let stage: string | undefined;
  let currentKind: 'image' | 'video' | null = null;
  let lastProgressLog: { value: number; at: number } | undefined;

  const log = (s: string, payload?: Record<string, unknown>) =>
    logUpload({ id: uploadId, side: 'SERVER', stage: s, payload });

  log('REQUEST_START', {
    method: request.method,
    contentType: request.headers.get('content-type') || '',
    contentLength: request.headers.get('content-length') || '',
    userAgent: (request.headers.get('user-agent') || '').slice(0, 120),
    timestamp: new Date().toISOString(),
  });

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
    // Log de progression associé au uploadId (throttle : palier de 5 % / 500 ms)
    if (event === 'progress' && typeof data?.progress === 'number') {
      if (shouldLogProgress(lastProgressLog, Date.now(), data.progress)) {
        lastProgressLog = { value: data.progress, at: Date.now() };
        log(currentKind === 'video' ? 'FFMPEG_PROGRESS' : 'IMAGE_PROGRESS', {
          percentage: data.progress,
          elapsedMs: Date.now() - startedAt,
        });
      }
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
    // Source stagée + conservée en cas d'issue retryable — visible aussi par
    // le catch/finally (déclarés hors du try).
    let stagedSource: StagedSourceInfo | null = null;
    let keepStagedSource = false;
    try {
      if (signal?.aborted) {
        log('ERROR', { stage: 'pre-parse', errorName: 'AbortError', errorMessage: 'Request cancelled', totalElapsedMs: Date.now() - startedAt });
        sendEvent('error', { error: 'Request cancelled', cancelled: true, code: CODES.ABORTED, uploadId, stage: 'pre-parse' });
        return;
      }

      // --- PROGRESSION #1 : source déjà téléversée en brut via /api/media/upload ---
      // Si l'en-tête `x-source-upload-id` est présent, la source est lue depuis la
      // zone de staging (SANS re-transfert depuis le client ni FFmpeg ici).
      const stagedSourceId = request.headers.get('x-source-upload-id');
      if (stagedSourceId) {
        stage = 'staged_source';
        log('STAGED_SOURCE_LOOKUP', { sourceUploadId: stagedSourceId });
        stagedSource = await readStagedSource(stagedSourceId);
        if (!stagedSource) {
          log('STAGED_SOURCE_MISSING', { sourceUploadId: stagedSourceId });
          sendEvent('error', {
            error: 'Staged source not found',
            code: CODES.VALIDATION,
            uploadId,
            stage,
            userMessage: "La vidéo source n'est plus disponible. Veuillez la re-sélectionner.",
          });
          return;
        }
        log('STAGED_SOURCE_FOUND', {
          sourceUploadId: stagedSourceId,
          fileSize: stagedSource.size,
          mimeType: stagedSource.mime,
          fileName: stagedSource.originalName,
        });
      }

      let file: File | null = null;
      let kind: 'image' | 'video' | null = null;
      let originalSize = 0;
      let buffer: Buffer | null = null;

      if (stagedSource) {
        // Branche "déjà stagé" : pas de parse FormData, pas de validation fichier,
        // le fichier brut est lu directement depuis le disque lors du traitement.
        kind = 'video';
        originalSize = stagedSource.size;
        currentKind = 'video';
        log('MEDIA_TYPE_DETECTED', {
          kind,
          mime: stagedSource.mime,
          ext: videoExtFromMime(stagedSource.mime),
          source: 'staged',
        });
      } else {
        stage = 'formdata_parse';
        const fdStart = Date.now();
        log('FORMDATA_PARSE_START', { contentLengthHint: request.headers.get('content-length') || '' });
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
            stack: parseErr?.stack,
            causeMessage: cause?.message,
            causeCode: cause?.code,
          });
          throw new MediaUploadError({
            code: CODES.FORMDATA_PARSE,
            stage: 'formdata_parse',
            uploadId,
            cause: parseErr,
            technicalMessage: `Failed to parse body as FormData. (${cause?.message || parseErr?.message})`,
            userMessage: "Le serveur n'a pas reçu correctement la vidéo.",
          });
        }

        file = formData.get('file') as File | null;
        stage = 'validation';
        if (!file) {
          log('VALIDATION_ERROR', { reason: 'missing-file' });
          sendEvent('error', {
            error: 'Missing file',
            code: CODES.VALIDATION,
            uploadId,
            stage,
            userMessage: "Aucun fichier n'a été reçu.",
          });
          return;
        }

        log('FILE_RECEIVED', {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        log('VALIDATION_START', { fileName: file.name, fileSize: file.size });

        kind = getMediaKind(file.type);
        if (!kind) {
          log('VALIDATION_ERROR', { reason: 'unsupported-type', mimeType: file.type });
          sendEvent('error', {
            error: `Unsupported type: ${file.type}`,
            code: CODES.VALIDATION,
            uploadId,
            stage,
            userMessage: "Le format de ce fichier n'est pas pris en charge.",
          });
          return;
        }

        originalSize = file.size;
        const maxSize = kind === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (originalSize > maxSize) {
          log('VALIDATION_ERROR', { reason: 'too-large', fileSize: originalSize, maxSize });
          sendEvent('error', {
            error: `File too large: ${(originalSize / 1024 / 1024).toFixed(1)} MB (max ${maxSize / 1024 / 1024} MB)`,
            code: CODES.VALIDATION,
            uploadId,
            stage,
            userMessage: "Ce fichier est trop volumineux pour être traité directement.",
          });
          return;
        }

        console.log(`[media/optimize] Processing ${kind}: ${file.name} (${(originalSize / 1024 / 1024).toFixed(1)} MB)`);

        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);

        if (!verifyMagicBytes(buffer, file.type)) {
          log('VALIDATION_ERROR', { reason: 'magic-bytes-mismatch', mimeType: file.type });
          sendEvent('error', {
            error: 'File content does not match declared type',
            code: CODES.VALIDATION,
            uploadId,
            stage,
            userMessage: "Le contenu du fichier ne correspond pas au format déclaré.",
          });
          return;
        }

        log('VALIDATION_SUCCESS', { fileSize: buffer.length });
        currentKind = kind;
        log('MEDIA_TYPE_DETECTED', {
          kind,
          mime: file.type,
          ext: kind === 'video' ? videoExtFromMime(file.type) : undefined,
        });
      }

      let optimizedBuffer: Buffer;
      let videoOutputMime = 'video/webm';

      if (kind === 'image') {
        stage = 'image_processing';
        log('IMAGE_PROCESS_START', { inputSize: buffer.length });
        sendEvent('progress', { progress: 10, phase: 'processing', uploadId });
        const imageStart = Date.now();
        optimizedBuffer = await optimizeImage(buffer!);
        log('IMAGE_PROCESS_SUCCESS', {
          outputSize: optimizedBuffer.length,
          elapsedMs: Date.now() - imageStart,
        });
        sendEvent('progress', { progress: 90, phase: 'uploading', uploadId });
      } else {
        stage = 'video_processing';
        if (signal?.aborted) throw new Error('Video optimization cancelled');

        sendEvent('progress', { progress: 5, phase: 'processing', uploadId });
        const id = randomBytes(8).toString('hex');
        const sourceMime = stagedSource ? stagedSource.mime : file!.type;
        const origExt = videoExtFromMime(sourceMime);

        // Entrée FFmpeg : source brut déjà sur disque (staging) OU fichier FormData écrit en tmp.
        let inputTmp: string;
        const outputTmp = join(tmpdir(), `opt_out_${id}.webm`);
        tmpFiles.push(outputTmp);

        if (stagedSource) {
          // La source est déjà sur disque. Elle n'est PAS poussée dans tmpFiles :
          // sa suppression est décidée à la fin de la route (succès / erreur définitive),
          // et conservée si l'issue est retryable (abort / interruption FFmpeg).
          inputTmp = stagedSource.path;
          log('STAGED_INPUT_READY', { inputPath: inputTmp, inputSize: stagedSource.size });
        } else {
          inputTmp = join(tmpdir(), `opt_in_${id}.${origExt}`);
          tmpFiles.push(inputTmp);
          await writeFile(inputTmp, buffer!);
        }

        let bypassed = false;
        if (sourceMime === 'video/webm') {
          const probe = await probeWebmCompatibility(FFPROBE_PATH, inputTmp);
          log('COMPATIBILITY_PROBE', {
            inputFormat: origExt,
            container: probe.container,
            vcodec: probe.vcodec,
            acodec: probe.acodec,
            compatible: probe.compatible,
          });
          if (probe.compatible) {
            bypassed = true;
            console.log('[media/optimize] Input already WebM/VP9-compatible — skipping re-encode');
            log('SKIP_REENCODE', {
              inputFormat: origExt,
              container: probe.container,
              vcodec: probe.vcodec,
              acodec: probe.acodec,
              inputSize: originalSize,
            });
            optimizedBuffer = stagedSource ? await readFile(stagedSource.path) : buffer!;
            videoOutputMime = 'video/webm';
            sendEvent('progress', { progress: 10, phase: 'processing', uploadId });
            sendEvent('progress', { progress: 95, phase: 'uploading', uploadId });
          }
        }

        if (!bypassed) {
          const ffmpegStart = Date.now();
          log('FFMPEG_START', { inputSize: originalSize, inputFormat: origExt, source: stagedSource ? 'staged' : 'post' });
          sendEvent('progress', { progress: 10, phase: 'processing', uploadId });
          const { outputMime } = await optimizeVideoWithProgress(inputTmp, outputTmp, sendEvent, signal);
          log('FFMPEG_SUCCESS', {
            outputFormat: outputMime,
            elapsedMs: Date.now() - ffmpegStart,
          });
          videoOutputMime = outputMime;
          sendEvent('progress', { progress: 95, phase: 'uploading', uploadId });
          optimizedBuffer = await readFile(outputTmp);
        }
      }

      if (signal?.aborted) throw new Error('Video optimization cancelled');

      stage = 'storage';
      log('STORAGE_UPLOAD_START', { kind, outputSize: optimizedBuffer.length });
      const storageStart = Date.now();
      const { app } = getFirebaseAdmin();
      const bucket = getStorage(app).bucket();
      const storagePath = randomPath(kind);
      const fileRef = bucket.file(storagePath);

      await fileRef.save(optimizedBuffer, {
        metadata: { contentType: kind === 'image' ? 'image/webp' : videoOutputMime },
      });

      log('STORAGE_UPLOAD_SUCCESS', {
        path: storagePath,
        outputSize: optimizedBuffer.length,
        elapsedMs: Date.now() - storageStart,
      });

      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      console.log(`[media/optimize] Success: ${kind} (${(originalSize / 1024).toFixed(0)}KB → ${(optimizedBuffer.length / 1024).toFixed(0)}KB)`);
      log('SUCCESS', {
        totalElapsedMs: Date.now() - startedAt,
        originalSize,
        finalSize: optimizedBuffer.length,
      });

      sendEvent('result', {
        url,
        originalSize,
        optimizedSize: optimizedBuffer.length,
        type: kind,
        uploadId,
      });
    } catch (err: any) {
      const totalElapsedMs = Date.now() - startedAt;
      let mue: MediaUploadError;

      if (err instanceof MediaUploadError) {
        mue = err;
      } else {
        const isTimeout = String(err?.message || '').includes('timed out') || err?.code === 'ETIMEDOUT';
        const code: UploadErrorCode = isTimeout ? CODES.TIMEOUT : stageToCode(stage);
        mue = new MediaUploadError({
          code,
          stage,
          uploadId,
          cause: err,
          technicalMessage: err?.message || 'Internal server error',
        });
      }

      log('ERROR', {
        stage: mue.stage,
        errorName: err?.name || mue.name,
        errorMessage: err?.message || mue.technicalMessage,
        code: mue.code,
        totalElapsedMs,
      });

      if (mue.code === CODES.ABORTED || err?.message === 'Video optimization cancelled' || err?.name === 'AbortError') {
        keepStagedSource = true;
        sendEvent('error', {
          error: 'Video optimization cancelled',
          cancelled: true,
          code: mue.code,
          uploadId: mue.uploadId,
          stage: mue.stage,
        });
      } else {
        if (mue.code === CODES.FFMPEG_INTERRUPTED) {
          // Interruption retryable : conserver la source pour un réessai sans re-transfert.
          keepStagedSource = true;
        }
        sendEvent('error', {
          error: mue.technicalMessage,
          code: mue.code,
          uploadId: mue.uploadId,
          stage: mue.stage,
          userMessage: mue.userMessage,
        });
      }
    } finally {
      await cleanupFiles(tmpFiles);
      if (stagedSource && !keepStagedSource) {
        const removed = await deleteStagedSource(stagedSource.sourceUploadId);
        log(removed ? 'STAGE_CLEANUP' : 'STAGE_CLEANUP_ALREADY_GONE', {
          sourceUploadId: stagedSource.sourceUploadId,
          reason: 'definitive-outcome',
        });
      }
      try { controllerRef?.close(); } catch {}
    }
  })();

  return response;
}
