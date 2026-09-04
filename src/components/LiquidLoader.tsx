'use client';

import { useId } from 'react';

interface LiquidLoaderProps {
  size?: number;
  className?: string;
}

export default function LiquidLoader({ size = 150, className }: LiquidLoaderProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `liquid-gegga-${uid}`;
  const gradId = `liquid-grad-${uid}`;
  const strokeId = `liquid-gradient-${uid}`;

  return (
    <span className={className} style={{ display: 'inline-flex' }} aria-hidden="true">
      <svg className="liquid-gegga" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 1 1 0 1 0 1 0 1 0 0 0 1 0 0 0 0 0 20 -10"
              result="liquid-inre"
            />
            <feComposite in="SourceGraphic" in2="liquid-inre" operator="atop" />
          </filter>
        </defs>
      </svg>

      <svg
        className="liquid-snurra"
        width={size}
        height={size}
        viewBox="0 0 200 200"
        style={{ filter: `url(#${filterId})` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId}>
            <stop className="liquid-stopp1" offset="0" />
            <stop className="liquid-stopp3" offset="0.33" />
            <stop className="liquid-stopp4" offset="0.66" />
            <stop className="liquid-stopp2" offset="1" />
          </linearGradient>
          <linearGradient
            y2="160"
            x2="160"
            y1="40"
            x1="40"
            gradientUnits="userSpaceOnUse"
            id={strokeId}
            xlinkHref={`#${gradId}`}
          />
        </defs>
        <path
          className="liquid-halvan"
          stroke={`url(#${strokeId})`}
          d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64"
        />
        <circle className="liquid-strecken" stroke={`url(#${strokeId})`} cx="100" cy="100" r="64" />
      </svg>
    </span>
  );
}
