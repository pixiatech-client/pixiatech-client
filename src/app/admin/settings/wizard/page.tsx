'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Image, Sparkles, ExternalLink } from 'lucide-react';
import { getWizardSettings, updateWizardSettings, getSettings, updateSettings } from '@/app/admin/actions';
import type { WizardSettings, PixelPitchOption, ViewingDistanceOption, Settings as AppSettings } from '@/lib/types';
import { InputWithUpload } from '../_components/input-with-upload';
import { useAdminT } from '@/hooks/useAdminT';
import { detectVideoSource } from '@/lib/video-source';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function WizardPage() {
  const { toast } = useToast();
  const { t } = useAdminT();
  const [settings, setSettings] = useState<WizardSettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([getWizardSettings(), getSettings()]).then(([wizardData, appData]) => {
      setSettings(wizardData);
      setAppSettings(appData);
      setIsLoading(false);
    });
  }, []);

  const validateImageUrl = (url: string): boolean => {
    if (!url) return true;
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) {
      return false;
    }
    try {
      new URL(url);
    } catch {
      return false;
    }
    return true;
  };

  const validateFallbackImageUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
    } catch {
      return false;
    }
    const path = new URL(url).pathname.toLowerCase();
    if (!/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/.test(path)) {
      return false;
    }
    return true;
  };

  const validateVideoUrl = (url: string): boolean => {
    if (!url) return true;
    return detectVideoSource(url).type !== 'none';
  };

  const handleSave = async () => {
    if (!settings || !appSettings) return;

    if (appSettings.previewScreenImageUrl && !validateImageUrl(appSettings.previewScreenImageUrl)) {
      toast({ title: t('Error'), description: t('Home page image URL is not valid. YouTube/Vimeo URLs are not accepted in this field.'), variant: 'destructive' });
      return;
    }
    if (appSettings.previewScreenVideoUrl && !validateVideoUrl(appSettings.previewScreenVideoUrl)) {
      toast({ title: t('Error'), description: t('3D simulator video URL is not valid.'), variant: 'destructive' });
      return;
    }
    if (appSettings.previewScreenFallbackImageUrl && !validateFallbackImageUrl(appSettings.previewScreenFallbackImageUrl)) {
      toast({ title: t('Error'), description: t('3D simulator fallback image URL is not valid.'), variant: 'destructive' });
      return;
    }
    if (appSettings.previewScreenHomeFallbackImageUrl && !validateFallbackImageUrl(appSettings.previewScreenHomeFallbackImageUrl)) {
      toast({ title: t('Error'), description: t('Home page fallback image URL is not valid.'), variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const [wizardResult, appResult] = await Promise.all([
        updateWizardSettings(settings),
        updateSettings(appSettings)
      ]);
      if (wizardResult.success && appResult.success) {
        toast({ title: t('Settings saved'), variant: 'success' });
      } else {
        toast({ title: t('Error'), description: t('Save failed'), variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('Error'), description: t('Save failed'), variant: 'destructive' });
    }
    setIsSaving(false);
  };



  if (isLoading || !settings || !appSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 hidden md:block">{t('Wizard Settings')}</h1>
          <p className="text-slate-500 mt-1 hidden md:block">{t('Configure the options and content of the guided configurator.')}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
          {t('Save')}
        </Button>
      </div>

      {/* Project Types */}
      <Card className="rounded-xl border border-slate-200/60 bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('Project Types')}</CardTitle>
          <CardDescription>{t('Configure the available project types in the wizard.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.projectTypes).map(([key, value]) => (
              <div key={key} className="space-y-3 p-4 bg-white/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={value.enabled}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        projectTypes: { ...settings.projectTypes, [key]: { ...value, enabled: checked } }
                      })}
                    />
                    <Label className="font-medium capitalize">{key === 'location' ? t('Rental') : t('Sale')}</Label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-slate-400">{t('Image')}</Label>
                  <InputWithUpload
                    placeholder="https://..."
                    value={value.imageUrl || ''}
                    onChange={(newUrl) => setSettings({
                      ...settings,
                      projectTypes: { ...settings.projectTypes, [key]: { ...value, imageUrl: newUrl } }
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environments */}
      <Card className="rounded-xl border border-slate-200/60 bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('Environments')}</CardTitle>
          <CardDescription>{t('Configure images for each environment.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(settings.environments).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">
                  {key === 'interieur' ? t('Indoor') : key === 'semi-exterieur' ? t('Semi-outdoor') : t('Outdoor')}
                </Label>
                <InputWithUpload
                  placeholder={t('Image URL')}
                  value={value.imageUrl || ''}
                  onChange={(newUrl) => setSettings({
                    ...settings,
                    environments: { ...settings.environments, [key]: { ...value, imageUrl: newUrl } }
                  })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Home Page Preview */}
      <Card className="rounded-xl border border-slate-200/60 bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('Home Page Preview')}</CardTitle>
          <CardDescription>{t('Configure the home page image or video displayed on the configurator home screen.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Preview URL')}</Label>
            <p className="text-xs text-slate-500">{t('Accepts image URLs (PNG, JPG) and video URLs (MP4, WebM).')}</p>
            <InputWithUpload
              placeholder="https://..."
              value={appSettings.previewScreenImageUrl || ''}
              onChange={(newUrl) => setAppSettings(prev => prev ? { ...prev, previewScreenImageUrl: newUrl } : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Fallback Image URL (Home Page)')}</Label>
            <p className="text-xs text-slate-500">{t('Image displayed when the video is unavailable or fails to load.')}</p>
            <InputWithUpload
              placeholder="https://..."
              value={appSettings.previewScreenHomeFallbackImageUrl || ''}
              onChange={(newUrl) => setAppSettings(prev => prev ? { ...prev, previewScreenHomeFallbackImageUrl: newUrl } : null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3D Simulator */}
      <Card className="rounded-xl border border-slate-200/60 bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('3D Simulator')}</CardTitle>
          <CardDescription>{t('Video and fallback image for the 3D screen simulator.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Video URL')}</Label>
            <p className="text-xs text-slate-500">{t('Accepts direct video URLs (MP4, WebM), Firebase Storage links, YouTube and Vimeo URLs.')}</p>
            <InputWithUpload
              placeholder="https://..."
              value={appSettings.previewScreenVideoUrl || ''}
              onChange={(newUrl) => setAppSettings(prev => prev ? { ...prev, previewScreenVideoUrl: newUrl } : null)}
            />
            {(() => {
              const source = detectVideoSource(appSettings.previewScreenVideoUrl);
              if (source.type === 'none') return null;
              const label = source.type === 'youtube'
                ? t('Detected source: YouTube')
                : source.type === 'vimeo'
                  ? t('Detected source: Vimeo')
                  : t('Detected source: direct video / Firebase Storage');
              return (
                <p className="text-xs font-medium text-emerald-600">
                  {label}
                </p>
              );
            })()}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Fallback Image URL (3D Simulator)')}</Label>
            <p className="text-xs text-slate-500">{t('Image displayed when the video is unavailable or fails to load.')}</p>
            <InputWithUpload
              placeholder="https://..."
              value={appSettings.previewScreenFallbackImageUrl || ''}
              onChange={(newUrl) => setAppSettings(prev => prev ? { ...prev, previewScreenFallbackImageUrl: newUrl } : null)}
            />
          </div>
          {/* Simulator Link */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('/?step=5', '_blank')}
            >
              <span>{t('View 3D Simulator')}</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step Images */}
      <Card className="rounded-xl border border-slate-200/60 bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('Step Images')}</CardTitle>
          <CardDescription>{t('Configure images displayed in the Viewing Distance and Pixel Pitch steps.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Viewing Distance')}</Label>
            <InputWithUpload
              placeholder="URL de l'image"
              value={settings.viewingDistanceImageUrl || ''}
              onChange={(newUrl) => setSettings({ ...settings, viewingDistanceImageUrl: newUrl })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">{t('Recommended Pixel Pitch')}</Label>
            <InputWithUpload
              placeholder="URL de l'image"
              value={settings.pixelPitchImageUrl || ''}
              onChange={(newUrl) => setSettings({ ...settings, pixelPitchImageUrl: newUrl })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
