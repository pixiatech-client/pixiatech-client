import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  isValidated: boolean;
}

export default function SignaturePad({ onSave, onClear, isValidated }: SignaturePadProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * ratio);
      const h = Math.round(rect.height * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(ratio, ratio);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = useCallback((e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }, []);

  const startDrawing = useCallback((e: any) => {
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    setIsDrawing(true);
    lastRef.current = p;
    setHasDrawn(true);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  }, [getPos]);

  const draw = useCallback((e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    if (!p || !lastRef.current) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const mid = { x: (lastRef.current.x + p.x) / 2, y: (lastRef.current.y + p.y) / 2 };
    ctx.quadraticCurveTo(lastRef.current.x, lastRef.current.y, mid.x, mid.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);

    lastRef.current = p;
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onClear();
  }, [onClear]);

  const validateSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    onSave(canvas.toDataURL('image/png'));
  }, [hasDrawn, onSave]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative border border-zinc-200 rounded-xl bg-zinc-50/50 shadow-inner overflow-hidden">
        {!hasDrawn && !isValidated && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs sm:text-sm font-light select-none gap-2">
            <PenTool size={16} className="animate-pulse text-blue-600" />
            <span>Signez ici avec votre souris ou votre doigt</span>
          </div>
        )}
        {isValidated && (
          <div className="absolute top-3 right-3 bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 z-10">
            <Check size={12} />
            <span>Validé</span>
          </div>
        )}
        <canvas
          id="signature-canvas"
          ref={canvasRef}
          className="w-full h-44 block touch-none cursor-crosshair bg-white transition-colors"
          style={{ cursor: isValidated ? 'default' : 'crosshair', opacity: isValidated ? 0.8 : 1, pointerEvents: isValidated ? 'none' : 'auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-zinc-200 pointer-events-none select-none">
          <span className="absolute -top-4 left-0 text-[10px] text-zinc-400 font-mono tracking-wider">
            Signature
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          id="btn-clear-sig"
          type="button"
          onClick={clearCanvas}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all cursor-pointer text-zinc-650 hover:text-zinc-900"
        >
          <Eraser size={16} />
          <span>Effacer</span>
        </button>
        <button
          id="btn-validate-sig"
          type="button"
          onClick={validateSignature}
          disabled={!hasDrawn && !isValidated}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl select-none transition-all cursor-pointer ${
            isValidated
              ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 shadow-sm font-bold'
              : hasDrawn
              ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/10 active:translate-y-0.5'
              : 'bg-zinc-100 border border-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
        >
          <Check size={16} />
          <span>{isValidated ? 'Signé' : 'Signer & accepter'}</span>
        </button>
      </div>
    </div>
  );
}
