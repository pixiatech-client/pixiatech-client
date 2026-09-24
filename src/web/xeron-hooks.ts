import { useEffect, useRef, useState, type RefObject } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

export interface RevealOptions {
  /** Fraction of the element that must be visible before it reveals. */
  threshold?: number;
  /** RootMargin passed to IntersectionObserver (applied to the viewport). */
  rootMargin?: string;
  /** Set immediately without waiting (used for reduced motion). */
  immediate?: boolean;
}

export function useRevealObserver(
  root: RefObject<HTMLElement | null>,
  { threshold = 0.12, rootMargin = '0px 0px -8% 0px', immediate = false }: RevealOptions = {},
) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal="true"]'));

    if (immediate) {
      targets.forEach((t) => t.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [root, threshold, rootMargin, immediate]);
}

export function useElementInView<T extends HTMLElement>(
  { threshold = 0.15, rootMargin = '0px 0px -10% 0px' }: RevealOptions = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}