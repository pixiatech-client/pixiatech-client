'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdminT } from '@/hooks/useAdminT';
import { getSettings, updateSettings, resetEstimationCounter } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { Eraser, Check, PenTool, RotateCcw, Save } from 'lucide-react';

interface SignatureFormProps {
  initialSettings: AppSettings;
}

export function SignatureForm({ initialSettings }: SignatureFormProps) {
  const { toast } = useToast();
  const { t } = useAdminT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [savedSignature, setSavedSignature] = useState(initialSettings.estimationFlow?.companySignatureDataUrl || '');
  const [counterValue, setCounterValue] = useState('');
  const [saving, setSaving] = useState(false);

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
  }, []);

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const currentSettings = await getSettings();
      const payload = {
        ...currentSettings,
        estimationFlow: {
          ...currentSettings.estimationFlow,
          companySignatureDataUrl: dataUrl,
        },
      };
      const result = await updateSettings(payload);
      if (result.success) {
        setSavedSignature(dataUrl);
        toast({ title: t('Signature sauvegardée'), description: t('La signature de l\'entreprise a été mise à jour.'), variant: 'success' });
      } else {
        toast({ variant: 'destructive', title: t('Error'), description: t('Une erreur est survenue lors de la sauvegarde.') });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Une erreur est survenue.') });
    } finally {
      setSaving(false);
    }
  };

  const resetCounter = async () => {
    const num = parseInt(counterValue, 10);
    if (isNaN(num) || num < 1) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Veuillez entrer un nombre valide (ex: 100001)') });
      return;
    }
    try {
      const result = await resetEstimationCounter(num);
      if (result.success) {
        toast({ title: t('Compteur réinitialisé'), description: t(`Le prochain numéro d'estimation sera EST-${String(num).padStart(8, '0')}`), variant: 'success' });
      } else {
        toast({ variant: 'destructive', title: t('Error'), description: result.error || t('Une erreur est survenue.') });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Une erreur est survenue.') });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('Signature entreprise & Compteur')}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{t('Gérez la signature de PIXIATECH et le compteur des estimations.')}</p>
        </div>
      </div>

      {/* COMPANY SIGNATURE */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs">
              <PenTool size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t('Signature de l\'entreprise')}</h4>
              <p className="text-[10px] text-slate-400">{t('Cette signature apparaîtra sur les contrats signés par les clients.')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signature Pad */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-transparent select-none">_</span>
              <div className="relative border border-zinc-200 rounded-xl bg-zinc-50/50 shadow-inner overflow-hidden">
                {!hasDrawn && !savedSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs sm:text-sm font-light select-none gap-2">
                    <PenTool size={16} className="text-rose-500" />
                    <span>{t('Signez ici avec votre souris')}</span>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="w-full h-44 block touch-none cursor-crosshair bg-white transition-colors"
                  style={{ cursor: 'crosshair' }}
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
                    {t('Signature')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearCanvas}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
                >
                  <Eraser size={16} />
                  <span>{t('Effacer')}</span>
                </Button>
                <Button
                  type="button"
                  onClick={saveSignature}
                  disabled={!hasDrawn || saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Save size={16} />
                  <span>{saving ? t('Sauvegarde...') : t('Sauvegarder la signature')}</span>
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-700">{t('Aperçu de la signature')}</Label>
              <div className="border border-zinc-200 rounded-xl bg-zinc-50/40 p-6 flex items-center justify-center min-h-[200px]">
                {savedSignature ? (
                  <img
                    src={savedSignature}
                    alt="Signature PIXIATECH"
                    className="max-w-full max-h-32 object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center text-zinc-400">
                    <PenTool size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">{t('Aucune signature enregistrée')}</p>
                    <p className="text-[10px] mt-1">{t('Dessinez et sauvegardez votre signature')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ESTIMATION COUNTER */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
              <RotateCcw size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t('Réinitialisation du compteur')}</h4>
              <p className="text-[10px] text-slate-400">{t('Modifier le numéro de départ des estimations (ex: EST-00100001)')}</p>
            </div>
          </div>

          <div className="flex items-end gap-4 max-w-md">
            <div className="space-y-1 flex-1">
              <Label className="text-xs font-semibold text-slate-700">{t('Prochain numéro d\'estimation')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">EST-</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="00000001"
                  value={counterValue}
                  onChange={(e) => setCounterValue(e.target.value.replace(/\D/g, ''))}
                  className="h-11 rounded-xl bg-white border-slate-200 pl-14 font-mono text-sm tracking-wider"
                />
              </div>
              {counterValue && (
                <p className="text-[10px] text-slate-400 font-mono">
                  {t('Prochain numéro')}: <strong>EST-{String(parseInt(counterValue) || 0).padStart(8, '0')}</strong>
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={resetCounter}
              disabled={!counterValue}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white h-11"
            >
              <RotateCcw size={16} />
              <span>{t('Réinitialiser')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
