/**
 * Utilitaires pour la gestion unifiée des médias CMS (Images et Vidéos).
 */

export function isMediaVideo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.avi') ||
    clean.endsWith('.mkv') ||
    url.startsWith('data:video/')
  );
}

export function looksLikeMediaUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('data:image') || value.startsWith('data:video')) return true;
  if (value.startsWith('/uploads/') || value === '/youtube-video.mp4') return true;
  if (value.includes('firebasestorage.googleapis.com')) return true;
  return (
    /^https?:\/\//.test(value) &&
    /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|mp4|webm|mov|avi)(\?|#|$)/i.test(value)
  );
}

