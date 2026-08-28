/**
 * Diagnostic / observabilité du pipeline d'upload média.
 *
 * Ce module est volontairement sans logique métier : il fournit uniquement
 * des helpers de logs structurés (prefix [MEDIA_UPLOAD][uploadId][side][stage]),
 * la génération d'un `uploadId` par tentative, un registre signal -> uploadId
 * pour relier un abort au bon upload, et une erreur normalisée (code/stage).
 *
 * Aucune donnée sensible (token, Base64, contenu de fichier) n'est jamais loggée.
 */

export const DIAG_TAG = 'MEDIA_UPLOAD';

export const UPLOAD_ERROR_CODES = {
  ABORTED: 'UPLOAD_ABORTED',
  NETWORK: 'UPLOAD_NETWORK_ERROR',
  FORMDATA_PARSE: 'UPLOAD_FORMDATA_PARSE_FAILED',
  VALIDATION: 'UPLOAD_VALIDATION_FAILED',
  FFMPEG: 'UPLOAD_FFMPEG_FAILED',
  STORAGE: 'UPLOAD_STORAGE_FAILED',
  TIMEOUT: 'UPLOAD_TIMEOUT',
  UNKNOWN: 'UPLOAD_UNKNOWN_ERROR',
} as const;

export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES];

const USER_MESSAGES: Record<UploadErrorCode, string> = {
  [UPLOAD_ERROR_CODES.ABORTED]: "L'envoi de la vidéo a été interrompu. Veuillez réessayer.",
  [UPLOAD_ERROR_CODES.NETWORK]: "La connexion a été interrompue pendant l'envoi de la vidéo. Veuillez réessayer.",
  [UPLOAD_ERROR_CODES.FORMDATA_PARSE]: "Le serveur n'a pas reçu correctement la vidéo. Veuillez réessayer.",
  [UPLOAD_ERROR_CODES.VALIDATION]: "Ce fichier ne peut pas être traité. Vérifiez le format et la taille.",
  [UPLOAD_ERROR_CODES.FFMPEG]: "La vidéo n'a pas pu être optimisée. Essayez avec un autre fichier.",
  [UPLOAD_ERROR_CODES.STORAGE]: "La vidéo a été traitée mais n'a pas pu être enregistrée. Veuillez réessayer.",
  [UPLOAD_ERROR_CODES.TIMEOUT]: "Le traitement de la vidéo a pris trop de temps. Veuillez réessayer.",
  [UPLOAD_ERROR_CODES.UNKNOWN]: "Une erreur inattendue est survenue pendant l'envoi. Veuillez réessayer.",
};

export function toUserMessage(code?: UploadErrorCode | string, fallback = ''): string {
  if (!code) return fallback;
  return USER_MESSAGES[code as UploadErrorCode] ?? fallback;
}

export type DiagSide = 'CLIENT' | 'SERVER';

export interface DiagLogInput {
  id: string;
  side: DiagSide;
  stage: string;
  payload?: Record<string, unknown>;
}

/** Écrit une ligne de log structurée, filtrable par `MEDIA_UPLOAD`. */
export function logUpload(input: DiagLogInput): string {
  const payload = input.payload ? ` ${JSON.stringify(input.payload)}` : '';
  const line = `[${DIAG_TAG}][${input.id}][${input.side}][${input.stage}]${payload}`;
  if (input.side === 'SERVER') console.log(line);
  else console.info(line);
  return line;
}

/** Génère un identifiant unique de tentative : upl_YYYYMMDD_xxxxxx */
export function generateUploadId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8);
  return `upl_${ymd}_${rand}`;
}

/**
 * Registre client : associe un AbortSignal au dernier uploadId en vol.
 * Permet à un `abort()` (reset / cancel / nouveau save) de logger le bon uploadId.
 */
const activeUploads = new Map<AbortSignal, string>();

export function registerUploadId(signal: AbortSignal | undefined, id: string): void {
  if (signal) activeUploads.set(signal, id);
}

export function unregisterUploadId(signal: AbortSignal | undefined): void {
  if (signal) activeUploads.delete(signal);
}

export function getUploadIdForSignal(signal?: AbortSignal | null): string | undefined {
  return signal ? activeUploads.get(signal) : undefined;
}

/**
 * Erreur normalisée du pipeline d'upload.
 * `technicalMessage` reste réservé aux logs ; `userMessage` est envoyé au toast.
 */
export class MediaUploadError extends Error {
  readonly code: UploadErrorCode;
  readonly stage?: string;
  readonly uploadId?: string;
  readonly userMessage?: string;
  readonly technicalMessage?: string;

  constructor(opts: {
    code: UploadErrorCode;
    stage?: string;
    uploadId?: string;
    userMessage?: string;
    technicalMessage?: string;
    cause?: unknown;
    name?: string;
  }) {
    super(opts.technicalMessage || opts.userMessage || opts.code);
    this.name = opts.name || 'MediaUploadError';
    this.code = opts.code;
    this.stage = opts.stage;
    this.uploadId = opts.uploadId;
    this.userMessage = opts.userMessage || toUserMessage(opts.code, this.message);
    this.technicalMessage = opts.technicalMessage || this.message;
    if (opts.cause) (this as unknown as { cause?: unknown }).cause = opts.cause;
  }
}

export function isMediaUploadError(err: unknown): err is MediaUploadError {
  return err instanceof MediaUploadError;
}

/** Throttle des logs de progression : max 1 log par palier de 5 % ou par 500 ms. */
export function shouldLogProgress(
  last: { value: number; at: number } | undefined,
  now: number,
  value: number,
): boolean {
  if (!last) return true;
  if (value - last.value >= 5 || value === 100) return true;
  return now - last.at >= 500;
}