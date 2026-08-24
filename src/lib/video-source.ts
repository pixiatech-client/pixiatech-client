export type VideoSourceType = 'direct' | 'youtube' | 'vimeo' | 'none';

export interface VideoSourceInfo {
  type: VideoSourceType;
  url: string;
  embedUrl?: string;
}

function isHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function getYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (isHost(host, 'youtu.be')) {
    return url.pathname.split('/').filter(Boolean)[0] || null;
  }
  const v = url.searchParams.get('v');
  if (v) return v;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
    return parts[1];
  }
  return null;
}

function getVimeoId(url: URL): string | null {
  const parts = url.pathname.split('/').filter(Boolean);
  return parts.find((p) => /^\d+$/.test(p)) || null;
}

/**
 * Detects the video source type from a URL.
 * - YouTube / Vimeo -> official embed URL (iframe)
 * - Everything else (MP4, WebM direct files, Firebase Storage links) -> direct <video> source
 */
export function detectVideoSource(rawUrl?: string | null): VideoSourceInfo {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: 'none', url: '' };
  }

  const urlStr = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { type: 'none', url: urlStr };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { type: 'none', url: urlStr };
  }

  const host = parsed.hostname.toLowerCase();

  if (isHost(host, 'youtube.com') || isHost(host, 'youtu.be') || isHost(host, 'youtube-nocookie.com')) {
    const id = getYouTubeId(parsed);
    if (!id) {
      return { type: 'youtube', url: urlStr };
    }
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '1',
      playlist: id,
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
    });
    return {
      type: 'youtube',
      url: urlStr,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    };
  }

  if (isHost(host, 'vimeo.com')) {
    const id = getVimeoId(parsed);
    if (!id) {
      return { type: 'vimeo', url: urlStr };
    }
    const params = new URLSearchParams({
      autoplay: '1',
      muted: '1',
      loop: '1',
      background: '1',
    });
    return {
      type: 'vimeo',
      url: urlStr,
      embedUrl: `https://player.vimeo.com/video/${id}?${params.toString()}`,
    };
  }

  // MP4/WebM direct files and Firebase Storage links (firebasestorage.googleapis.com/...?alt=media)
  return { type: 'direct', url: urlStr };
}

export function isEmbeddableSource(info: VideoSourceInfo): boolean {
  return Boolean(info.embedUrl);
}
