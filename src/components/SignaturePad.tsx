/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  isValidated: boolean;
}

export default function SignaturePad({ onSave, onClear, isValidated }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas with smooth rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable smooth line joints
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2563eb'; // Sleek royal blue signature ink
    ctx.lineWidth = 2.5;
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if it's a touch event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    // Default to mouse event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onClear();
  };

  const validateSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    
    // Save image
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Canvas container */}
      <div className="relative border border-zinc-200 rounded-xl bg-zinc-50/50 shadow-inner overflow-hidden">
        
        {/* Helper overlay when not signed or validated */}
        {!hasDrawn && !isValidated && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs sm:text-sm font-light select-none gap-2">
            <PenTool size={16} className="animate-pulse text-blue-600" />
            <span>Signez ici avec votre souris ou votre doigt</span>
          </div>
        )}

        {/* Confirmed Indicator */}
        {isValidated && (
          <div className="absolute top-3 right-3 bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 z-10">
            <Check size={12} />
            <span>Validé</span>
          </div>
        )}

        <canvas
          id="signature-canvas"
          ref={canvasRef}
          width={600}
          height={180}
          className={`w-full h-44 block cursor-crosshair bg-white transition-colors ${
            isValidated ? 'opacity-80 pointer-events-none bg-blue-50/20' : ''
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Subtle grid line indicator inside signature zone */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-zinc-200 pointer-events-none select-none">
          <span className="absolute -top-4 left-0 text-[10px] text-zinc-400 font-mono tracking-wider">
            Signature
          </span>
        </div>
      </div>

      {/* Signature control buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          id="btn-clear-sig"
          type="button"
          onClick={clearCanvas}
          disabled={isValidated}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all cursor-pointer text-zinc-650 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed"
        >
          <Eraser size={16} />
          <span>Effacer</span>
        </button>

        <button
          id="btn-validate-sig"
          type="button"
          onClick={validateSignature}
          disabled={!hasDrawn || isValidated}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl select-none transition-all cursor-pointer ${
            isValidated
              ? 'bg-blue-50 border border-blue-200 text-blue-600 shadow-inner'
              : hasDrawn
              ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/10 active:translate-y-0.5'
              : 'bg-zinc-100 border border-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}
        >
          <Check size={16} />
          <span>{isValidated ? 'Signature validée avec succès' : 'Valider ma signature'}</span>
        </button>
      </div>
    </div>
  );
}
