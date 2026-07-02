'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, RefreshCw, Package } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';

import type { ProviderSettings } from '@/lib/tracking/types';

const DEFAULT_PROVIDERS = [
  { provider: '17track' as const, label: '17TRACK', defaultKey: 'Clé API 17TRACK' },
  { provider: 'dhl' as const, label: 'DHL', defaultKey: 'Clé API DHL' },
  { provider: 'ups' as const, label: 'UPS', defaultKey: 'Clé API UPS' },
  { provider: 'fedex' as const, label: 'FedEx', defaultKey: 'Clé API FedEx' },
  { provider: 'gls' as const, label: 'GLS', defaultKey: 'Clé API GLS' },
  { provider: 'laposte' as const, label: 'La Poste', defaultKey: 'Clé API La Poste' },
  { provider: 'chronopost' as const, label: 'Chronopost', defaultKey: 'Clé API Chronopost' },
];

export default function TrackSettingsPage() {
  const { t } = useAdminT();
  const [providers, setProviders] = useState<ProviderSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('');

  useEffect(() => {
    setWebhookBaseUrl(window.location.origin);
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const res = await fetch('/api/tracking/providers');
      if (res.ok) {
        const data = await res.json();
        const merged = DEFAULT_PROVIDERS.map((def) => {
          const existing = data.find((p: any) => p.provider === def.provider);
          return {
            id: existing?.id || def.provider,
            provider: def.provider,
            label: def.label,
            apiKey: existing?.apiKey || '',
            enabled: existing?.enabled ?? false,
            webhookUrl: existing?.webhookUrl || `${window.location.origin}/api/tracking/webhook`,
            lastTestAt: existing?.lastTestAt || null,
            lastTestOk: existing?.lastTestOk ?? null,
          };
        });
        setProviders(merged);
      } else {
        setProviders(
          DEFAULT_PROVIDERS.map((def) => ({
            id: def.provider,
            provider: def.provider,
            label: def.label,
            apiKey: '',
            enabled: false,
            webhookUrl: `${window.location.origin}/api/tracking/webhook`,
            lastTestAt: null,
            lastTestOk: null,
          }))
        );
      }
    } catch {
      toast.error(t('Error loading carriers'));
    } finally {
      setLoading(false);
    }
  }

  function updateProvider(id: string, patch: Partial<ProviderSettings>) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function saveProvider(id: string) {
    setSaving(id);
    try {
      const provider = providers.find((p) => p.id === id);
      if (!provider) return;
      const res = await fetch('/api/tracking/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider),
      });
      if (!res.ok) throw new Error();
      toast.success(`${provider.label} ${t('saved')}`);
    } catch {
      toast.error(t('Save error'));
    } finally {
      setSaving(null);
    }
  }

  async function testConnection(id: string) {
    setTesting(id);
    try {
      const provider = providers.find((p) => p.id === id);
      if (!provider || !provider.apiKey) {
        toast.error(t('Missing API key'));
        return;
      }
      const res = await fetch('/api/tracking/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.provider, apiKey: provider.apiKey }),
      });
      const ok = res.ok;
      updateProvider(id, { lastTestOk: ok, lastTestAt: new Date().toISOString() });
      await saveProvider(id);
      if (ok) {
        toast.success(`${provider.label} — ${t('connection OK')}`);
      } else {
        toast.error(`${provider.label} — ${t('connection failed')}`);
      }
    } catch {
      toast.error(t('Connection test error'));
    } finally {
      setTesting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Package className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold tracking-tight">{t('Package Tracking')}</h1>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">
        {t('Configure your shipping carriers for package tracking.')}
      </p>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(v) => updateProvider(provider.id, { enabled: v })}
                  />
                  <CardTitle className="text-lg">{provider.label}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!provider.apiKey || testing === provider.id}
                    onClick={() => testConnection(provider.id)}
                  >
                    {testing === provider.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    )}
                    {t('Test')}
                  </Button>
                  <Button
                    size="sm"
                    disabled={saving === provider.id}
                    onClick={() => saveProvider(provider.id)}
                  >
                    {saving === provider.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : null}
                    {t('Save')}
                  </Button>
                </div>
              </div>
              {provider.lastTestAt && (
                <div className="flex items-center gap-1.5 text-xs mt-1">
                  {provider.lastTestOk ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className={provider.lastTestOk ? 'text-green-600' : 'text-red-600'}>
                    {t('Last test')}: {new Date(provider.lastTestAt).toLocaleString('fr-FR')}
                    {provider.lastTestOk ? ` — ${t('OK')}` : ` — ${t('Failed')}`}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label>{t('API Key')}</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey[provider.id] ? 'text' : 'password'}
                    value={provider.apiKey}
                    onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                    placeholder={t('Enter your API key...')}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowKey((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))
                    }
                    className="shrink-0"
                  >
                    {showKey[provider.id] ? t('Hide') : t('Show')}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Webhook URL</Label>
                <Input
                  value={provider.webhookUrl}
                  onChange={(e) => updateProvider(provider.id, { webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
