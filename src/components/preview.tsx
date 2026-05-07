"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

interface PreviewProps {
  width: number; // meters
  height: number; // meters
  screenImageUrl?: string;
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
  const availableHeight = containerDimensions.height > 0 ? containerDimensions.height - 32 : 250;

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

  let screenElement: React.ReactNode = null;
  if (screenImageUrl) {
    if (isVideo) {
      screenElement = (
        <video
          src={screenImageUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px`, objectFit: "cover" }}
          className="flex-shrink-0 shadow-lg relative overflow-hidden border rounded bg-black"
        />
      );
    } else {
      screenElement = (
        <div
          style={{ width: `${screenWidthPx}px`, height: `${screenHeightPx}px`, position: "relative" }}
          className="flex-shrink-0 shadow-lg overflow-hidden border rounded bg-black"
        >
          <Image src={screenImageUrl} alt={t('common.screenContent')} fill className="object-cover" />
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
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-4 rounded-lg bg-slate-100 border">
      <div className="preview-screen" style={{ position: "relative", display: "inline-block" }}>
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
