import React, { useEffect, useRef } from "react";

interface LedCanvasTextProps {
  label?: string;
  className?: string;
}

export const LedCanvasText: React.FC<LedCanvasTextProps> = ({
  label = "PXT Fine",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animId = 0;
    let lastWidth = 0;

    const render = () => {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 200;
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Offscreen canvas to measure and rasterize the text
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const oCtx = off.getContext("2d");
      if (!oCtx) return;

      let fontSize = 0.92 * h;
      oCtx.font = `900 ${fontSize}px Satoshi, Arial, sans-serif`;
      let textWidth = oCtx.measureText(label).width;
      if (textWidth > 0.98 * w) {
        fontSize = fontSize * (0.98 * w / textWidth);
        oCtx.font = `900 ${fontSize}px Satoshi, Arial, sans-serif`;
      }
      oCtx.textBaseline = "middle";
      oCtx.fillStyle = "#fff";
      oCtx.fillText(label, 0, h / 2);

      const imgData = oCtx.getImageData(0, 0, w, h).data;
      const step = Math.max(5, Math.round(w / 190));
      const points: { x: number; y: number; d: number }[] = [];

      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          const alpha = imgData[((Math.floor(y) * w + Math.floor(x)) * 4) + 3];
          if (alpha > 120) {
            points.push({ x, y, d: Math.random() });
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dotSize = Math.max(2, step - 2.2);

      // Default static draw
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#F5F4F0";
      for (const p of points) {
        ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
      }

      if (prefersReducedMotion) return;

      const startTime = performance.now();
      const rgbColors = ["#ff3b30", "#34d97b", "#3b7bff"];

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / 1000, 1);
        ctx.clearRect(0, 0, w, h);

        for (const p of points) {
          const pointProg = Math.min(Math.max((progress - 0.7 * p.d) / 0.3, 0), 1);
          if (pointProg <= 0) continue;
          ctx.globalAlpha = pointProg;
          ctx.fillStyle = pointProg < 1 ? rgbColors[(p.d * 3) | 0] : "#F5F4F0";
          ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
        }
        ctx.globalAlpha = 1;
        if (progress < 1) {
          animId = requestAnimationFrame(animate);
        }
      };

      animId = requestAnimationFrame(animate);
    };

    if (document.fonts?.load) {
      Promise.race([
        document.fonts.load("900 100px Satoshi"),
        new Promise((resolve) => setTimeout(resolve, 400))
      ]).then(render).catch(render);
    } else {
      render();
    }

    const observer = new ResizeObserver(() => {
      if (lastWidth && Math.abs(canvas.clientWidth - lastWidth) < 4) return;
      lastWidth = canvas.clientWidth;
      render();
    });
    lastWidth = canvas.clientWidth;
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [label]);

  return (
    <div className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: "clamp(120px, 17vw, 260px)" }}
        aria-hidden="true"
      />
      <h1 className="sr-only">{label}</h1>
    </div>
  );
};
