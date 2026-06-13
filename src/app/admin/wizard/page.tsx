'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Image, Sparkles } from 'lucide-react';
import { getWizardSettings, updateWizardSettings } from '@/app/admin/actions';
import type { WizardSettings, PixelPitchOption, ViewingDistanceOption } from '@/lib/types';
import { InputWithUpload } from '../settings/_components/input-with-upload';
import { useAdminT } from '@/hooks/useAdminT';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function WizardPage() {
  const { toast } = useToast();
  const { t } = useAdminT();
  const [settings, setSettings] = useState<WizardSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getWizardSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const result = await updateWizardSettings(settings);
      if (result.success) {
        toast({ title: t('Settings saved'), variant: 'success' });
      } else {
        toast({ title: t('Error'), description: t('Save failed'), variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('Error'), description: t('Save failed'), variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const addPixelPitch = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      pixelPitches: [...settings.pixelPitches, { id: generateId(), value: 'P NEW', recommended: false }]
    });
  };

  const removePixelPitch = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      pixelPitches: settings.pixelPitches.filter(p => p.id !== id)
    });
  };

  const updatePixelPitch = (id: string, field: keyof PixelPitchOption, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      pixelPitches: settings.pixelPitches.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const addViewingDistance = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      viewingDistances: [...settings.viewingDistances, { id: generateId(), value: '0-0m', recommended: false }]
    });
  };

  const removeViewingDistance = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      viewingDistances: settings.viewingDistances.filter(v => v.id !== id)
    });
  };

  const updateViewingDistance = (id: string, field: string | boolean, value?: string | boolean) => {
    if (!settings) return;
    if (typeof field === 'string' && value !== undefined) {
      setSettings({
        ...settings,
        viewingDistances: settings.viewingDistances.map(v => v.id === id ? { ...v, [field]: value } : v)
      });
    }
  };

  if (isLoading || !settings) {
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
      <Card className="rounded-xl border border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">{t('Project Types')}</CardTitle>
          <CardDescription>{t('Configure the available project types in the wizard.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.projectTypes).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environments */}
      <Card className="rounded-xl border border-slate-200/60">
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

      {/* Step Images */}
      <Card className="rounded-xl border border-slate-200/60">
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

      {/* Pixel Pitches */}
      <Card className="rounded-xl border border-slate-200/60">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{t('Pixel Pitches')}</CardTitle>
            <CardDescription>{t('Configure the available pixel pitches.')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addPixelPitch} className="gap-2">
            <Plus className="w-4 h-4" /> {t('Add')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {settings.pixelPitches.map((pp, index) => (
              <div key={pp.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <span className="text-xs font-mono text-slate-400 w-6">{index + 1}</span>
                <Input
                  value={pp.value}
                  onChange={(e) => updatePixelPitch(pp.id, 'value', e.target.value)}
                  className="w-24"
                  placeholder="P2.5"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pp.recommended}
                    onCheckedChange={(checked) => updatePixelPitch(pp.id, 'recommended', checked)}
                  />
                  <Label className="text-xs text-slate-500">{t('Recommended')}</Label>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePixelPitch(pp.id)} className="ml-auto text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Viewing Distances */}
      <Card className="rounded-xl border border-slate-200/60">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{t('Viewing Distances')}</CardTitle>
            <CardDescription>{t('Configure the available viewing distances.')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addViewingDistance} className="gap-2">
            <Plus className="w-4 h-4" /> {t('Add')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {settings.viewingDistances.map((vd, index) => (
              <div key={vd.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <span className="text-xs font-mono text-slate-400 w-6">{index + 1}</span>
                <Input
                  value={vd.value}
                  onChange={(e) => updateViewingDistance(vd.id, 'value', e.target.value)}
                  className="w-32"
                  placeholder="0-5m"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={vd.recommended ?? false}
                    onCheckedChange={(checked) => updateViewingDistance(vd.id, 'recommended', checked)}
                  />
                  <Label className="text-xs text-slate-500">{t('Recommended')}</Label>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeViewingDistance(vd.id)} className="ml-auto text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}