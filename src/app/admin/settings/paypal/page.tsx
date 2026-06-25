'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getPayPalSettings, updatePayPalSettings } from '@/app/admin/actions';
import { useAdminT } from '@/hooks/useAdminT';
import { CreditCard, Save, RefreshCw, Eye, EyeOff, ShieldCheck, Globe, Pencil } from 'lucide-react';

export default function PayPalSettingsPage() {
  const { toast } = useToast();
  const { t } = useAdminT();

  const [settings, setSettings] = useState({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox' as 'sandbox' | 'live',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPayPalSettings();
        setSettings({
          clientId: data.clientId || '',
          clientSecret: data.clientSecret || '',
          environment: data.environment || 'sandbox',
        });
      } catch (error) {
        console.error('Failed to load PayPal settings:', error);
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: t('Unable to load PayPal settings.'),
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [toast, t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePayPalSettings(settings);
      if (result.success) {
        toast({
          title: t('Settings saved'),
          description: t('PayPal configuration has been updated.'),
          variant: 'success',
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: result.error || t('An error occurred while saving.'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('An unexpected error occurred.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-theme-card-border shadow-sm bg-theme-card overflow-hidden">
      <CardHeader className="pb-6 border-b border-theme-card-border bg-theme-card">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#003087]" />
            </div>
            {t('PayPal Configuration')}
          </CardTitle>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <Pencil className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t('Editable')}</span>
          </div>
        </div>
        <CardDescription className="text-sm font-medium text-theme-text-secondary mt-3">
          {t('Configure your PayPal professional account credentials.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">

        {/* Environment selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-black text-theme-text flex items-center gap-2">
            <Globe className="w-5 h-5 text-theme-text-secondary" />
            {t('Environment')}
          </h3>
          <RadioGroup
            value={settings.environment}
            onValueChange={(val) => setSettings({ ...settings, environment: val as 'sandbox' | 'live' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sandbox" id="sandbox" />
              <Label htmlFor="sandbox" className="font-medium text-theme-text cursor-pointer">Sandbox</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="live" id="live" />
              <Label htmlFor="live" className="font-medium text-theme-text cursor-pointer">Production (Live)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Client ID */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-theme-text">{t('PayPal Client ID')}</Label>
            <Input
              type="text"
              placeholder="Axxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={settings.clientId}
              onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
              className="h-11 rounded-xl bg-theme-card border-theme-card-border focus:ring-theme-sidebar-active-bg font-mono text-sm text-theme-text"
            />
            <p className="text-[10px] text-theme-text-secondary">
              {t('Found in your PayPal Developer Dashboard under "API Credentials".')}
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-theme-text">{t('PayPal Client Secret')}</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                placeholder={settings.clientSecret ? '••••••••' : t('Enter your secret')}
                value={settings.clientSecret}
                onChange={(e) => setSettings({ ...settings, clientSecret: e.target.value })}
                className="h-11 rounded-xl bg-theme-card border-theme-card-border focus:ring-theme-sidebar-active-bg font-mono text-sm text-theme-text pr-12"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-theme-text-secondary hover:text-theme-text transition-colors"
                aria-label={showSecret ? t('Hide secret') : t('Show secret')}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-theme-text-secondary">
              {t('The secret is never displayed by default for security reasons.')}
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{t('Security notice')}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {t('These credentials are stored securely in Firestore and are never exposed in the client-side code. Only administrators can access this page.')}
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2 border-t border-theme-card-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto min-w-[200px] h-12 rounded-xl font-black bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('Save settings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
