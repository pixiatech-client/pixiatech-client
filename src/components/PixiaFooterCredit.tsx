'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PixiaFooterCreditProps {
  className?: string;
  style?: React.CSSProperties;
  /** Permet de personnaliser le fond si besoin (ex. transparent dans PixiaFooter) */
  background?: string;
}

export const PixiaFooterCredit: React.FC<PixiaFooterCreditProps> = ({
  className = '',
  style = {},
  background,
}) => {
  const footerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        .px-credit-footer {
          --px-bg: ${background || 'var(--black-4, #050505)'};
          --px-text: #8E8E93;
          --px-strong: #FFFFFF;
          --px-accent: var(--accent, #C3F910);
          --px-accent2: #38E044;
          position: relative;
          background: var(--px-bg);
          color: var(--px-text);
          font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
          font-size: 0.8125rem;
          line-height: 1.5;
          padding: 1.25rem 1.5rem;
          overflow: hidden;
          pointer-events: auto !important;
          z-index: 10;
        }

        /* Ligne lumineuse animée aux couleurs Pixiatech en haut */
        .px-credit-footer::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--px-accent2), var(--px-accent), transparent);
          background-size: 200% 100%;
          animation: px-sweep 4s linear infinite;
        }

        .px-credit-footer__inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem 1.5rem;
          pointer-events: auto !important;
        }

        .px-credit-footer p {
          margin: 0;
        }

        .px-credit-footer strong {
          color: var(--px-strong);
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        /* Apparition fluide lors de l'entrée à l'écran */
        .px-credit-footer__copy,
        .px-credit-footer__credit {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .px-credit-footer__credit {
          transition-delay: 0.15s;
        }

        .px-credit-footer.is-visible .px-credit-footer__copy,
        .px-credit-footer.is-visible .px-credit-footer__credit {
          opacity: 1;
          transform: none;
        }

        /* Lien Promedia Audiovisuelle */
        .px-credit-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--px-strong);
          text-decoration: none;
          font-weight: 600;
          padding: 0.15rem 0.2rem;
          border-radius: 4px;
          transition: color 0.25s ease;
          pointer-events: auto !important;
        }

        /* Point d'état lumineux pulsant (vert néon Pixiatech) */
        .px-credit-link__dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--px-accent);
          box-shadow: 0 0 8px var(--px-accent);
          animation: px-pulse 2.2s ease-out infinite;
          flex-shrink: 0;
        }

        /* Effet "roll" : texte glissant remplacé par dégradé vibrant */
        .px-credit-link__roll {
          position: relative;
          display: inline-block;
          overflow: hidden;
          line-height: 1.5;
        }

        .px-credit-link__roll span {
          display: block;
          transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .px-credit-link__roll::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 100%;
          white-space: nowrap;
          background: linear-gradient(90deg, var(--px-accent2), var(--px-accent));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
        }

        /* Soulignement néon dynamique */
        .px-credit-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 1.5px;
          background: linear-gradient(90deg, var(--px-accent2), var(--px-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }

        .px-credit-link:hover .px-credit-link__roll span,
        .px-credit-link:focus-visible .px-credit-link__roll span {
          transform: translateY(-100%);
        }

        .px-credit-link:hover .px-credit-link__roll::after,
        .px-credit-link:focus-visible .px-credit-link__roll::after {
          transform: translateY(-100%);
        }

        .px-credit-link:hover::after,
        .px-credit-link:focus-visible::after {
          transform: scaleX(1);
        }

        .px-credit-link:focus-visible {
          outline: 2px solid var(--px-accent);
          outline-offset: 3px;
        }

        @keyframes px-sweep {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes px-pulse {
          70% {
            box-shadow: 0 0 0 7px rgba(195, 249, 16, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(195, 249, 16, 0);
          }
        }

        @media (max-width: 640px) {
          .px-credit-footer__inner {
            justify-content: center;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .px-credit-footer::before,
          .px-credit-link__dot {
            animation: none;
          }
          .px-credit-footer__copy,
          .px-credit-footer__credit {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .px-credit-link__roll span,
          .px-credit-link__roll::after,
          .px-credit-link::after {
            transition: none;
          }
        }
      `}</style>

      <footer
        ref={footerRef}
        id="px-footer"
        className={`px-credit-footer ${isVisible ? 'is-visible' : ''} ${className}`}
        style={style}
      >
        <div className="px-credit-footer__inner">
          <p className="px-credit-footer__copy">
            © {new Date().getFullYear()} <strong>Pixiatech</strong>. Tous droits réservés.
          </p>
          <p className="px-credit-footer__credit">
            Créé par{' '}
            <a
              className="px-credit-link"
              href="https://promedia-audiovisuelle.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Promedia Audiovisuelle (ouvre le site dans un nouvel onglet)"
            >
              <span className="px-credit-link__dot" aria-hidden="true" />
              <span
                className="px-credit-link__roll"
                data-text="Promedia Audiovisuelle"
              >
                <span>Promedia Audiovisuelle</span>
              </span>
            </a>
          </p>
        </div>
      </footer>
    </>
  );
};
