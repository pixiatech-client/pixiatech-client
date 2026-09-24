import React, { useEffect, useRef } from "react";
import { Language } from "../data/translations";

interface ManifestoSectionProps {
  lang?: Language;
}

export const ManifestoSection: React.FC<ManifestoSectionProps> = ({
  lang = "FR",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = {
    eyebrow: lang === "FR" ? "01 / MANIFESTE" : "01 / MANIFESTO",
    line1:
      lang === "FR"
        ? "Nous ne plaçons pas des écrans dans des espaces."
        : "We don't place screens into spaces.",
    line2:
      lang === "FR"
        ? "Nous faisons des écrans"
        : "We make screens",
    line3:
      lang === "FR"
        ? "une partie intégrante de l'espace."
        : "part of the space.",
    body:
      lang === "FR"
        ? "PIXIATECH combine des technologies LED de pointe, une ingénierie de précision et une vision architecturale pour concevoir des systèmes visuels conçus sur-mesure autour de chaque environnement."
        : "PIXIATECH combines advanced LED technologies, engineering and architectural thinking to create visual systems designed around each environment.",
  };

  // Exact PixelGrid reactive canvas from xeron.co module 18283
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mouseX = -9999;
    let mouseY = -9999;
    let animFrame = 0;

    const render = () => {
      animFrame = 0;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);

      for (let y = 30; y < h; y += 30) {
        for (let x = 30; x < w; x += 30) {
          const dist = Math.hypot(x - mouseX, y - mouseY);
          const alpha = dist < 180 ? 0.05 + (1 - dist / 180) * 0.3 : 0.05;
          ctx.fillStyle = `rgba(17,17,16,${alpha.toFixed(3)})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    };

    const scheduleRender = () => {
      if (!animFrame) animFrame = requestAnimationFrame(render);
    };
    scheduleRender();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      scheduleRender();
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      scheduleRender();
    };

    if (!prefersReducedMotion) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    const ro = new ResizeObserver(scheduleRender);
    ro.observe(parent);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      ro.disconnect();
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <section
      id="manifesto"
      className="sec-manifesto theme-light"
      style={{
        position: "relative",
        background: "#f5f4f0",
        color: "#080808",
        borderBottom: "1px solid #e5e4de",
        padding: "clamp(110px, 14vh, 170px) clamp(16px, 3.5vw, 64px)",
        overflow: "hidden",
      }}
    >
      {/* Interactive Pixel Grid reactive to mouse */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1520, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".24em",
            color: "#7A7A76",
            marginBottom: 36,
            textTransform: "uppercase",
            fontFamily: "monospace",
            fontWeight: 700,
          }}
        >
          {t.eyebrow}
        </div>

        <h2
          className="h-manifesto"
          style={{
            fontSize: "clamp(40px, 4.8vw, 78px)",
            fontWeight: 900,
            letterSpacing: "-.03em",
            lineHeight: 1.04,
            color: "#080808",
            maxWidth: 1180,
            margin: "0 0 54px",
          }}
        >
          <span>{t.line1}</span>
          <br />
          <span>{t.line2} </span>
          <span style={{ color: "#649600", display: "inline-block" }}>{t.line3}</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: "40px 60px",
            paddingTop: 36,
            borderTop: "1px solid #dfddd5",
            alignItems: "end",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "clamp(17px, 1.4vw, 22px)",
                color: "#333",
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {t.body}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "36px 48px",
              justifyContent: "flex-start",
              fontSize: 11,
              letterSpacing: ".2em",
              color: "#7A7A76",
              fontFamily: "monospace",
            }}
          >
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#000", fontFamily: "sans-serif" }}>39+</div>
              <div>SÉRIES D'AFFICHAGE CERTIFIÉES</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#000", fontFamily: "sans-serif" }}>100%</div>
              <div>CALIBRATION SPECTROMÉTRIQUE</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#000", fontFamily: "sans-serif" }}>5 ANS</div>
              <div>GARANTIE & TÉLÉ-DIAGNOSTIC</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
