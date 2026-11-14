/**
 * Utilitaires et sécurité des pièces jointes pour la messagerie PixiaTech.
 *
 * Contraintes :
 * - 25 Mo max par fichier
 * - 5 fichiers max par message
 * - 50 Mo max cumulés par message
 * - Liste blanche stricte d'extensions
 * - Vérification des signatures binaires (magic bytes)
 * - Détection et blocage d'exécutables (MZ, ELF, etc.) et doubles extensions
 * - Assainissement sécurisé des noms de stockage
 */

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Mo
export const MAX_FILES_PER_MESSAGE = 5;
export const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo

/** Liste blanche stricte des extensions autorisées */
export const ALLOWED_EXTENSIONS = [
  // Images
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  // Documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'odt',
  'ods',
  'odp',
  'rtf',
  // Archives
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  // Audio & Vidéo
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'mp4',
  'mov',
  'webm',
] as const;

export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

/** Liste noire d'extensions dangereuses (défense en profondeur) */
export const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'vbs', 'vbe', 'js', 'jse',
  'wsf', 'wsh', 'ps1', 'psm1', 'sh', 'bash', 'dll', 'sys', 'drv', 'pif',
  'hta', 'cpl', 'jar', 'reg', 'apk', 'app', 'dmg', 'pkg', 'iso', 'bin',
  'deb', 'rpm', 'elf', 'class', 'cgi', 'pl', 'py', 'php', 'asp', 'aspx',
]);

/** Attribut `accept` pour l'élément `<input type="file" />` */
export const CHAT_FILE_INPUT_ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
  'text/plain', 'text/csv',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.txt', '.csv', '.odt', '.ods', '.odp', '.rtf',
  'audio/*', 'video/*',
].join(',');

export type AttachmentCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'archive'
  | 'text'
  | 'file';

/** Détermine la catégorie d'un fichier à partir de son extension */
export function getAttachmentCategory(extension: string): AttachmentCategory {
  const ext = (extension || '').toLowerCase().replace(/^\./, '');
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'powerpoint';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (ext === 'txt') return 'text';
  return 'file';
}

/** Formate la taille d'un fichier en chaîne lisible */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Extrait l'extension nettoyée d'un nom de fichier */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase().trim();
}

/**
 * Assainit le nom du fichier pour le stockage Firebase Storage.
 * Supprime les chemins relatifs, caractères suspects et préserve l'extension légitime.
 */
export function sanitizeAttachmentFileName(fileName: string): string {
  const clean = fileName.replace(/\\/g, '/').split('/').pop() || 'fichier';
  const lastDot = clean.lastIndexOf('.');
  const rawBase = lastDot > 0 ? clean.slice(0, lastDot) : clean;
  const rawExt = lastDot > 0 ? clean.slice(lastDot + 1).toLowerCase() : '';

  // Supprime accents, remplace caractères spéciaux par des underscores
  const cleanBase = rawBase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'document';

  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '').slice(0, 10);
  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

/**
 * Lit les premiers octets d'un fichier (Blob / File) dans le navigateur ou Node.
 */
async function readHeaderBytes(file: File, bytesToRead = 32): Promise<Uint8Array> {
  const slice = file.slice(0, bytesToRead);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Vérifie la signature binaire (magic bytes) à partir d'un Uint8Array d'octets de tête.
 * Partagé entre le navigateur (client) et les routes API (serveur).
 */
export function verifyBufferMagicBytes(bytes: Uint8Array, fileName: string): { safe: boolean; error?: string } {
  if (!bytes || bytes.length === 0) {
    return { safe: false, error: 'Fichier vide ou illisible.' };
  }

  // 1. Détection de signature d'exécutable Windows (MZ header : 0x4D, 0x5A)
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
    return { safe: false, error: 'Fichier exécutable interdit détecté (signature Windows MZ).' };
  }

  // 2. Détection de binaire Linux ELF (0x7F, 'E', 'L', 'F')
  if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
    return { safe: false, error: 'Fichier binaire exécutable interdit détecté (ELF).' };
  }

  // 3. Détection de script shell direct (#!)
  if (bytes[0] === 0x23 && bytes[1] === 0x21) {
    return { safe: false, error: 'Script exécutable interdit détecté.' };
  }

  const ext = getFileExtension(fileName);

  // 4. Contrôles spécifiques par extension
  if (ext === 'pdf') {
    // PDF doit commencer par %PDF- (0x25, 0x50, 0x44, 0x46)
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    if (!isPdf) {
      return { safe: false, error: 'Le fichier ne correspond pas à un document PDF valide.' };
    }
  } else if (ext === 'png') {
    // PNG : 89 50 4E 47 0D 0A 1A 0A
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    if (!isPng) {
      return { safe: false, error: 'Le fichier ne correspond pas à une image PNG valide.' };
    }
  } else if (ext === 'jpg' || ext === 'jpeg') {
    // JPEG : FF D8 FF
    const isJpg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    if (!isJpg) {
      return { safe: false, error: 'Le fichier ne correspond pas à une image JPEG valide.' };
    }
  } else if (ext === 'gif') {
    // GIF : 'GIF8' (47 49 46 38)
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
    if (!isGif) {
      return { safe: false, error: 'Le fichier ne correspond pas à une image GIF valide.' };
    }
  } else if (['zip', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
    // Formats OpenXML et ZIP : doivent commencer par 'PK' (0x50, 0x4B)
    const isPkZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isPkZip) {
      return { safe: false, error: `Le fichier ne correspond pas à un document ${ext.toUpperCase()} valide.` };
    }
  } else if (ext === 'rar') {
    // RAR : 'Rar!' (0x52, 0x61, 0x72, 0x21)
    const isRar = bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21;
    if (!isRar) {
      return { safe: false, error: 'Le fichier ne correspond pas à une archive RAR valide.' };
    }
  } else if (ext === '7z') {
    // 7z : '7z' + BC AF 27 1C (0x37, 0x7A, 0xBC, 0xAF)
    const is7z = bytes[0] === 0x37 && bytes[1] === 0x7A && bytes[2] === 0xBC && bytes[3] === 0xAF;
    if (!is7z) {
      return { safe: false, error: 'Le fichier ne correspond pas à une archive 7z valide.' };
    }
  }

  return { safe: true };
}

/**
 * Vérifie la signature binaire (magic bytes) du fichier.
 * Détecte les faux types (ex: exécutable .exe renommé en .pdf ou .jpg).
 */
export async function verifyFileMagicBytes(file: File): Promise<{ safe: boolean; error?: string }> {
  try {
    const bytes = await readHeaderBytes(file, 32);
    return verifyBufferMagicBytes(bytes, file.name);
  } catch (err) {
    // Si la lecture des octets échoue (ex: environnement restreint), autoriser avec avertissement
    console.warn('[attachments] Impossible de lire les octets binaires:', err);
    return { safe: true };
  }
}

/**
 * Validation complète d'un fichier avant ajout ou upload :
 * - Vérifie la taille (< 25 Mo)
 * - Vérifie l'extension (whitelist + blacklist)
 * - Vérifie l'absence de double extension malveillante (ex: document.pdf.exe)
 * - Vérifie la signature magique des octets
 */
export async function validateSingleAttachment(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'Fichier invalide.' };
  }

  // 1. Taille unitaire
  if (file.size <= 0) {
    return { valid: false, error: `Le fichier "${file.name}" est vide.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" (${formatFileSize(file.size)}) dépasse la limite autorisée de 25 Mo.`,
    };
  }

  // 2. Détection double extension (ex: photo.jpg.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i++) {
      const subExt = parts[i].toLowerCase().trim();
      if (FORBIDDEN_EXTENSIONS.has(subExt)) {
        return {
          valid: false,
          error: `Le fichier "${file.name}" contient une extension interdite (${subExt}).`,
        };
      }
    }
  }

  // 3. Extension
  const ext = getFileExtension(file.name);
  if (!ext) {
    return { valid: false, error: `Le fichier "${file.name}" ne possède aucune extension.` };
  }

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Le format .${ext} est strictement interdit pour des raisons de sécurité.` };
  }

  const isAllowed = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (!isAllowed) {
    return {
      valid: false,
      error: `Le format .${ext} n'est pas autorisé. Formats acceptés : images, PDF, Office (Word, Excel, PPT), archives (ZIP, RAR, 7Z), texte.`,
    };
  }

  // 4. Signature magique des octets
  const magicCheck = await verifyFileMagicBytes(file);
  if (!magicCheck.safe) {
    return { valid: false, error: magicCheck.error || `Contenu invalide pour "${file.name}".` };
  }

  return { valid: true };
}

/**
 * Validation par lot lors de la sélection :
 * - Ne dépasse pas 5 fichiers au total (actuels + nouveaux)
 * - Ne dépasse pas 50 Mo cumulés
 * - Valide chaque fichier individuellement
 */
export async function validateAttachmentBatch(
  newFiles: File[],
  existingFiles: File[]
): Promise<{ accepted: File[]; errors: string[] }> {
  const errors: string[] = [];
  const accepted: File[] = [];

  const totalCount = existingFiles.length + newFiles.length;
  if (totalCount > MAX_FILES_PER_MESSAGE) {
    errors.push(`Maximum ${MAX_FILES_PER_MESSAGE} pièces jointes par message (${totalCount} sélectionnées).`);
    return { accepted: [], errors };
  }

  let currentTotalSize = existingFiles.reduce((acc, f) => acc + f.size, 0);

  for (const file of newFiles) {
    // Vérifier les doublons
    const alreadyExists = existingFiles.some((f) => f.name === file.name && f.size === file.size);
    if (alreadyExists) {
      errors.push(`Le fichier "${file.name}" est déjà joint.`);
      continue;
    }

    const singleCheck = await validateSingleAttachment(file);
    if (!singleCheck.valid) {
      if (singleCheck.error) errors.push(singleCheck.error);
      continue;
    }

    if (currentTotalSize + file.size > MAX_TOTAL_SIZE_BYTES) {
      errors.push(
        `L'ajout de "${file.name}" dépasserait la limite totale de 50 Mo par message.`
      );
      continue;
    }

    currentTotalSize += file.size;
    accepted.push(file);
  }

  return { accepted, errors };
}

