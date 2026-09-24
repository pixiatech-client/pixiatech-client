'use client';

import { useState } from 'react';
import { XERON_TECHS } from '../../xeron-data';
import { usePrefersReducedMotion } from '../../xeron-hooks';

/**
 * 06 / TECHNOLOGY — five proprietary tech rows; hovering a row expands it
 * (flex grow) and reveals its description, like the original hover interplay.
 */
export function TechnologySection() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <section id="technology" className="theme-dark sec-lg">
      <div className="wrap">
        <div style={{ fontSize: 11, letterSpacing: '.24em', color: 'var(--dark-muted)', marginBottom: 36 }}>
          06 / TECHNOLOGY
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap', marginBottom: 56 }}>
          <h2 className="display">
            Technology inside
            <br />
            every pixel.
          </h2>
          <p className="pretty" style={{ margin: '0 0 8px', maxWidth: 420, fontSize: 16, lineHeight: 1.6, color: 'var(--dark-body)' }}>
            Five proprietary display technologies delivering exceptional performance, proven reliability and enhanced sustainability.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1720, margin: '0 auto', padding: '0 var(--gutter)' }}>
        <div className="tech-row" data-reveal="true" style={{ display: 'flex', gap: 6, height: 'min(64vh,620px)' }}>
          {XERON_TECHS.map((t, i) => {
            const isActive = reduced ? i === 0 : active === i;
            return (
              <div
                key={t.name}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(0)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(0)}
                aria-pressed={isActive}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  flex: isActive ? '2.8 1 0%' : '1 1 0%',
                  transition: 'flex .65s cubic-bezier(.2,.8,.2,1)',
                  minWidth: 0,
                  cursor: 'pointer',
                  border: '1px solid var(--dark-line)',
                  background: 'var(--black-3)',
                }}
              >
                <div style={{ position: 'absolute', inset: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="slot-img" src={t.img} alt="" />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg,rgba(8,8,8,.6) 0%,rgba(8,8,8,.12) 42%,rgba(8,8,8,.85) 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 22,
                    left: 24,
                    right: 24,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 14,
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{ fontSize: 11, letterSpacing: '.14em', color: isActive ? 'var(--accent)' : 'rgba(245,244,240,.55)', transition: 'color .4s ease' }}>
                    {t.index}
                  </span>
                  <span style={{ fontSize: 14, letterSpacing: '.2em', fontWeight: 700, color: '#F5F4F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </span>
                </div>
                <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, pointerEvents: 'none' }}>
                  <p
                    className="pretty"
                    style={{
                      margin: 0,
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      color: '#E5E3DE',
                      maxWidth: 400,
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(14px)',
                      transition: 'opacity .5s ease .12s,transform .5s ease .12s',
                    }}
                  >
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--dark-muted)', marginTop: 18 }}>
          Proprietary technologies across the PixiaTech display portfolio.
        </div>
      </div>
    </section>
  );
}