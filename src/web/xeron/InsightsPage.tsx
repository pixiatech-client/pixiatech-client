'use client';

import { useMemo, useState } from 'react';
import '../xeron.css';
import { XerHeader } from './XerHeader';
import { XerFooter } from './XerFooter';
import { RevealRoot } from './RevealRoot';
import { INSIGHT_CHIPS, XERON_INSIGHTS } from '../xeron-data';

export function XerInsightsPage() {
  const [chip, setChip] = useState('All');
  const featured = XERON_INSIGHTS.find((a) => a.featured) ?? XERON_INSIGHTS[0];
  const grid = useMemo(() => XERON_INSIGHTS.filter((a) => !a.featured), []);

  const visible = chip === 'All' ? grid : grid.filter((a) => a.chip === chip);

  return (
    <RevealRoot className="xer-site" style={{ background: 'var(--paper)' }}>
      <XerHeader />
      <main>
        <section className="section-hero theme-light" style={{ color: 'var(--ink)' }}>
          <div className="wrap">
            <div className="eyebrow">PIXIATECH / INSIGHTS</div>
            <h1 className="display" data-reveal="true" style={{ marginBottom: 20, color: 'var(--ink)' }}>
              Notes on light,
              <br />
              pixels and space.
            </h1>
            <p className="lede" data-reveal="true" style={{ marginBottom: 64, maxWidth: 560 }}>
              Guides, technical notes and field observations from the PixiaTech engineering team.
            </p>
            <div
              data-reveal="true"
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '20px 0', marginBottom: 64 }}
            >
              {INSIGHT_CHIPS.map((c) => (
                <button
                  key={c}
                  className={`chip${chip === c ? ' on' : ''}`}
                  onClick={() => setChip(c)}
                  style={{
                    fontSize: 11,
                    letterSpacing: '.1em',
                    color: chip === c ? 'var(--paper)' : 'var(--body)',
                    background: chip === c ? 'var(--ink)' : 'transparent',
                    borderColor: chip === c ? 'var(--ink)' : '#c9c7c2',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <a className="art g-lead" href="/web/insights" data-reveal="true" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(28px,4vw,64px)', alignItems: 'end', marginBottom: 96, color: 'var(--ink)' }}>
                <div className="art-lead-media" style={{ position: 'relative', height: 'min(64vh,620px)', overflow: 'hidden' }}>
                  <div className="art-img" style={{ position: 'absolute', inset: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="slot-img" src={featured.img} alt="" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--accent)', marginBottom: 16 }}>
                    {featured.category.slice(0, featured.category.indexOf('—')).trim()} — FEATURED
                  </div>
                  <div className="art-t pretty" style={{ fontSize: 'clamp(30px,2.8vw,44px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.015em', marginBottom: 18 }}>
                    {featured.title}
                  </div>
                  {featured.desc && (
                    <p className="pretty" style={{ margin: '0 0 24px', fontSize: 16, lineHeight: 1.6, color: 'var(--body)' }}>
                      {featured.desc}
                    </p>
                  )}
                  <div style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--muted)' }}>
                    {featured.read} · {featured.date}
                  </div>
                </div>
              </a>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: '32px 28px' }}>
              {visible.map((a) => (
                <a className="art" href="/web/insights" key={a.slug} data-reveal="true" style={{ color: 'var(--ink)' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
                      <div className="art-img" style={{ position: 'absolute', inset: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="slot-img" src={a.img} alt="" />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--accent)', marginBottom: 10 }}>{a.category}</div>
                  <div className="art-t pretty" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-.01em', marginBottom: 12 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--muted)' }}>
                    {a.read} · {a.date}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <XerFooter />
    </RevealRoot>
  );
}
