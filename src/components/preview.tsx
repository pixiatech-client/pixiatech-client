"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

interface PreviewProps {
  width: number; // meters
  height: number; // meters
  screenImageUrl?: string;
  fallbackImageUrl?: string;
  humanScaleImageUrl?: string;
  humanPosition?: "side" | "front";
  noAnimation?: boolean;
  fixedHuman?: boolean;
}

const DEFAULT_HUMAN_IMAGE = "/images/human-silhouette.png";

export default function Preview({
  width,
  height,
  screenImageUrl,
  fallbackImageUrl,
  humanScaleImageUrl,
  humanPosition = "front",
  noAnimation = false,
  fixedHuman = false,
}: PreviewProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const availableWidth = containerDimensions.width > 0 ? containerDimensions.width - 32 : 450;
  const availableHeight = containerDimensions.height > 0 ? containerDimensions.height - 64 : 250;

  const HUMAN_HEIGHT_M = 1.8;
  const HUMAN_WIDTH_M = 0.5;

  const heightInMetersWithPerson = Math.max(height, HUMAN_HEIGHT_M);
  const totalSceneWidthInMeters = width + (humanPosition === "side" ? HUMAN_WIDTH_M + 1 : 0);

  const pxPerMFromWidth = availableWidth / Math.max(0.0001, totalSceneWidthInMeters);
  const pxPerMFromHeight = availableHeight / Math.max(0.0001, heightInMetersWithPerson);

  const PX_PER_M = Math.min(pxPerMFromWidth, pxPerMFromHeight, 150);

  const screenWidthPx = Math.max(1, Math.round(width * PX_PER_M));
  const screenHeightPx = Math.max(1, Math.round(height * PX_PER_M));

  const hauteurMetres = Math.max(0.0001, height);
  const silhouetteHeight = Math.max(
    30,
    Math.min(screenHeightPx * (1.8 / hauteurMetres), screenHeightPx)
  );

  const isVideo = !!screenImageUrl && /\.(mp4|webm|mov)(\?.*)?$/i.test(screenImageUrl.split("?")[0]);
  const isYouTube = !!screenImageUrl && /youtube\.com|youtu\.be|vimeo\.com/i.test(screenImageUrl);
  const [videoFailed, setVideoFailed] = useState(false);

  const effectiveImageUrl = videoFailed && fallbackImageUrl ? fallbackImageUrl : screenImageUrl;

  let screenElement: React.ReactNode = null;
  if (effectiveImageUrl) {
    const effectiveIsVideo = !videoFailed && isVideo;
    const effectiveIsYouTube = !videoFailed && isYouTube;

    if (effectiveIsYouTube) {
      screenElement = (
        <div
          style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px` }}
          className="flex-shrink-0 shadow-lg bg-slate-200 border rounded flex items-center justify-center text-center text-xs text-slate-500 p-4"
        >
          {fallbackImageUrl
            ? t('La vidéo YouTube/Vimeo n\'est pas supportée. L\'image de secours est affichée.')
            : t('Les URLs YouTube/Vimeo ne sont supportées que dans le simulateur 3D, pas dans les images de prévisualisation.')}
        </div>
      );
    } else if (effectiveIsVideo) {
      screenElement = (
        <div className="relative">
          <video
            src={effectiveImageUrl}
            autoPlay
            loop
            muted
            playsInline
            controlsList="nodownload"
            onError={() => {
              if (fallbackImageUrl) {
                setVideoFailed(true);
              }
            }}
            style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px`, objectFit: "cover" }}
            className="flex-shrink-0 shadow-lg relative overflow-hidden border rounded bg-black pointer-events-none select-none"
          />
          <div className="absolute inset-0 z-10" />
        </div>
      );
    } else {
      screenElement = (
        <div
          style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px`, position: "relative" }}
          className="flex-shrink-0 shadow-lg overflow-hidden border rounded bg-black"
        >
          <Image src={effectiveImageUrl} alt={t('common.screenContent')} fill className="object-cover pointer-events-none select-none" draggable={false} />
          <div className="absolute inset-0 z-10" />
        </div>
      );
    }
  } else {
    screenElement = (
      <div style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px` }} className="flex-shrink-0 shadow-lg bg-slate-200 border rounded" />
    );
  }

  const humanSrc = humanScaleImageUrl || "/images/human-silhouette.png"; // or "/silhouette.png" if the prompt specifically asked for it, but let's stick to "/images/human-silhouette.png" or "/silhouette.png"

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center pt-4 px-4 pb-10 rounded-lg bg-slate-100 border">
      <div className="preview-screen" style={{ position: "relative", display: "inline-block", marginBottom: '12px' }}>
        {screenElement}
        
        {humanPosition === "side" && (
          <div className="silhouette-wrapper" style={{ height: `${silhouetteHeight}px` }}>
            <img
              src={humanSrc || "/silhouette.png"}
              alt={t('common.humanSilhouette')}
              className="silhouette-img"
            />
            <span className="silhouette-label">1.80 m</span>
          </div>
        )}
        
        {humanPosition === "front" && (
          <div className="silhouette-wrapper" style={{ height: `${silhouetteHeight}px` }}>
            <img
              src={humanSrc || "/silhouette.png"}
              alt={t('common.humanSilhouette')}
              className="silhouette-img"
            />
            <span className="silhouette-label">1.80 m</span>
          </div>
        )}
      </div>
    </div>
  );
}
