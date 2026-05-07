
/**
 * Utility to preload images to improve UX and avoid layout shifts or loading flickers.
 */
const imageCache = new Map<string, boolean>();

export function preloadImage(src: string): Promise<void> {
  if (!src || typeof window === 'undefined') return Promise.resolve();
  if (imageCache.has(src)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageCache.set(src, true);
      resolve();
    };
    img.onerror = (err) => {
      console.warn(`Failed to preload image: ${src}`, err);
      reject(err);
    };
  });
}

/**
 * Preloads an array of image URLs.
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(src => preloadImage(src).catch(() => {})));
}
