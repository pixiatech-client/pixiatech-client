import { Eraser, FileCheck2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../../core/i18n/translations.ts';
import type { Language } from '../../../core/types.ts';

interface ContractSignatureStepProps {
  lang: Language;
  contractText: string;
  isSubmitting: boolean;
  error: string | null;
  onError?: (hasError: boolean) => void;
  onInvalidSubmit?: () => void;
  onSubmit: (signatureDataUrl: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export function ContractSignatureStep({
  lang,
  contractText,
  isSubmitting,
  error,
  onError,
  onInvalidSubmit,
  onSubmit,
}: ContractSignatureStepProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const strokesRef = useRef<Point[][]>([]);
  const activeStrokeRef = useRef<Point[] | null>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const hasSignedRef = useRef(false);
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({ w: 340, h: 128, dpr: 2 });

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [readApproved, setReadApproved] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) {
      setHasScrolledToBottom(true);
      setReadApproved(true);
    }
  }, [contractText, lang]);

  // Redraw entire signature smoothly via quadratic midpoint spline with zero segment cap artifacts
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#141413';
    ctx.fillStyle = '#141413';
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;

    for (const stroke of allStrokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, 1.15, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      if (stroke.length === 2) {
        ctx.lineTo(stroke[1].x, stroke[1].y);
      } else {
        for (let i = 1; i < stroke.length - 1; i += 1) {
          const midX = (stroke[i].x + stroke[i + 1].x) * 0.5;
          const midY = (stroke[i].y + stroke[i + 1].y) * 0.5;
          ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
        }
        const last = stroke[stroke.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
    }
  }, []);

  // ResizeObserver guarantees 1:1 HiDPI coordinates with zero stretching or jitter
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      redrawCanvas();
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [redrawCanvas]);

  const scheduleRedraw = useCallback(() => {
    if (dirtyRef.current) return;
    dirtyRef.current = true;
    rafRef.current = window.requestAnimationFrame(() => {
      dirtyRef.current = false;
      redrawCanvas();
    });
  }, [redrawCanvas]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
      setHasScrolledToBottom(true);
    }
  };

  const appendSample = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const stroke = activeStrokeRef.current;
    if (!canvas || !stroke) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const prev = stroke[stroke.length - 1];

    // Filter sub-pixel micro-jitter so quadratic curves remain organically smooth
    if (prev && Math.hypot(x - prev.x, y - prev.y) < 2.2) return;
    stroke.push({ x, y });
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawingRef.current = true;
    activeStrokeRef.current = [pt];
    scheduleRedraw();

    if (!hasSignedRef.current) {
      hasSignedRef.current = true;
      setHasSigned(true);
      if (readApproved) {
        setWarning(null);
        onError?.(false);
      }
    }
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const native = e.nativeEvent as PointerEvent;
    const coalesced =
      typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : null;

    if (coalesced && coalesced.length > 0) {
      for (const sample of coalesced) {
        appendSample(sample.clientX, sample.clientY);
      }
    } else {
      appendSample(e.clientX, e.clientY);
    }
    scheduleRedraw();
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (activeStrokeRef.current && activeStrokeRef.current.length > 0) {
      strokesRef.current.push(activeStrokeRef.current);
      activeStrokeRef.current = null;
      redrawCanvas();
    }
  };

  const clearSignature = () => {
    strokesRef.current = [];
    activeStrokeRef.current = null;
    hasSignedRef.current = false;
    redrawCanvas();
    setHasSigned(false);
  };

  const handleConfirm = () => {
    if (!readApproved || !hasSigned || !canvasRef.current) {
      setWarning(t(lang, 'signature.requiredWarning'));
      onError?.(true);
      onInvalidSubmit?.();
      return;
    }
    setWarning(null);
    onError?.(false);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSubmit(dataUrl);
  };

  const hasAlert = Boolean(warning || error);

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3.5 transition-colors duration-300 ${
        hasAlert
          ? 'border-[#EF4444]/75 bg-[#26161B] shadow-[0_0_24px_rgba(239,68,68,0.24)]'
          : 'border-white/10 bg-[#202025]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileCheck2 className={`h-4 w-4 ${hasAlert ? 'text-[#FB7185]' : 'text-[#38BDF8]'}`} />
          {t(lang, 'signature.title')}
        </h4>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`max-h-36 overflow-y-auto rounded-xl border bg-[#141417] p-3 text-xs leading-relaxed text-[#D4D4D8] whitespace-pre-line transition-colors ${
          hasAlert && !hasScrolledToBottom ? 'border-[#EF4444]/70' : 'border-white/10'
        }`}
      >
        {contractText}
      </div>

      {!hasScrolledToBottom && (
        <p className="text-xs text-[#38BDF8] font-medium">
          {t(lang, 'signature.scrollRequired')}
        </p>
      )}

      <label className="flex items-start gap-2.5 text-xs sm:text-sm text-[#F4F4F5] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={readApproved}
          disabled={!hasScrolledToBottom}
          onChange={(e) => {
            const checked = e.target.checked;
            setReadApproved(checked);
            if (checked && hasSigned) {
              setWarning(null);
              onError?.(false);
            }
          }}
          className={`mt-0.5 h-4 w-4 rounded accent-white disabled:opacity-40 ${
            hasAlert && !readApproved ? 'ring-1 ring-[#EF4444]' : 'border-white/20'
          }`}
        />
        <span
          className={
            hasAlert && !readApproved
              ? 'text-[#FDA4AF]'
              : !hasScrolledToBottom
                ? 'text-[#71717A]'
                : ''
          }
        >
          {t(lang, 'signature.readAndApprove')}
        </span>
      </label>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#A1A1AA]">
            {t(lang, 'signature.padLabel')}
          </span>
          <button
            type="button"
            onClick={clearSignature}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#A1A1AA] hover:text-white cursor-pointer"
          >
            <Eraser className="h-3.5 w-3.5" />
            {t(lang, 'signature.clear')}
          </button>
        </div>

        <div
          ref={wrapRef}
          className={`relative h-32 w-full overflow-hidden rounded-xl border bg-white transition-all ${
            hasAlert && !hasSigned
              ? 'border-[#EF4444] ring-2 ring-[#EF4444]/45'
              : 'border-white/20'
          }`}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
            className="block h-full w-full touch-none bg-white cursor-crosshair select-none"
          />
          {!hasSigned && (
            <span className="pointer-events-none absolute inset-x-6 bottom-5 border-b border-dashed border-[#D4D4D8] text-center pb-1 text-[11px] text-[#A1A1AA]">
              {lang === 'fr' ? 'Signez ici d’un trait fluide' : 'Sign smoothly here'}
            </span>
          )}
        </div>
      </div>

      {(warning || error) && (
        <p className="text-xs font-medium text-[#FB7185]">{warning || error}</p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
      >
        {isSubmitting ? t(lang, 'signature.submitting') : t(lang, 'signature.submit')}
      </button>
    </div>
  );
}
