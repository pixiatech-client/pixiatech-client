'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Hash, Globe, MapPin, Save, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function InformationsFiscalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();
  const [form, setForm] = useState({
    companyName: '',
    siret: '',
    vatNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
  });

  useEffect(() => {
    fetch('/api/boutique/customer/get-fiscal')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setForm(prev => ({ ...prev, ...data }));
      })
      .catch(() => setError(t('client.fiscal.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch('/api/boutique/customer/update-fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(t('client.fiscal.saveError'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('client.fiscal.genericError'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/mon-compte/parametres" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('client.fiscal.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('client.fiscal.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              {t('client.fiscal.companyName')}
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder={t('client.fiscal.companyPlaceholder')}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                {t('client.fiscal.siret')}
              </label>
              <input
                type="text"
                value={form.siret}
                onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                placeholder={t('client.fiscal.siretPlaceholder')}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                {t('client.fiscal.vatNumber')}
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))}
                placeholder={t('client.fiscal.vatPlaceholder')}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {t('client.fiscal.billingAddress')}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder={t('client.fiscal.addressPlaceholder')}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{t('client.fiscal.postalCode')}</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                placeholder={t('client.fiscal.postalPlaceholder')}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{t('client.fiscal.city')}</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder={t('client.fiscal.cityPlaceholder')}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{t('client.fiscal.country')}</label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder={t('client.fiscal.countryPlaceholder')}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                {t('client.fiscal.saved')}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-black text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-black/10"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('client.fiscal.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
