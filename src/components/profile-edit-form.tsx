'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Building2, MapPin, Globe, MapPinned, Hash,
  Briefcase, Users, Link as LinkIcon, Printer, Mail, CheckCircle2, AlertCircle,
  Loader2, Save,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateCustomerProfile } from '@/app/actions/customer-actions';

interface ProfileData {
  displayName?: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  country?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  officePhone?: string;
  companyEmail?: string;
  position?: string;
  employees?: string;
  website?: string;
  fax?: string;
}

const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5";

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {children}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

export function ProfileEditForm({
  customerId,
  customerEmail,
  initialData,
}: {
  customerId: string;
  customerEmail: string;
  initialData: ProfileData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ProfileData>({
    displayName: initialData.displayName || '',
    phone: initialData.phone || '',
    companyName: initialData.companyName || '',
    companyAddress: initialData.companyAddress || '',
    country: initialData.country || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    officePhone: initialData.officePhone || '',
    companyEmail: initialData.companyEmail || '',
    position: initialData.position || '',
    employees: initialData.employees || '',
    website: initialData.website || '',
    fax: initialData.fax || '',
  });

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const fd = new FormData();
    for (const [key, value] of Object.entries(form)) {
      fd.set(key, value || '');
    }

    const result = await updateCustomerProfile(customerId, fd);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Une erreur est survenue.' });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Section title="Informations de base" icon={User}>
        <Field icon={User} label="Nom complet">
          <Input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Votre nom"
            className={inputClass}
          />
        </Field>
        <div className="space-y-1.5">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={customerEmail} disabled className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm text-slate-500" />
          </div>
          <p className="ml-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Vérifié
          </p>
        </div>
        <Field icon={Phone} label="Téléphone">
          <Input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+33 6 XX XX XX XX"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Informations professionnelles" icon={Building2}>
        <div className="md:col-span-2">
          <Field icon={Building2} label="Société">
            <Input
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Nom de votre entreprise"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field icon={MapPin} label="Adresse">
            <Input
              value={form.companyAddress}
              onChange={(e) => set('companyAddress', e.target.value)}
              placeholder="Adresse complète"
              className={inputClass}
            />
          </Field>
        </div>
        <Field icon={Globe} label="Pays">
          <Input
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="France"
            className={inputClass}
          />
        </Field>
        <Field icon={MapPinned} label="Ville">
          <Input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Paris"
            className={inputClass}
          />
        </Field>
        <Field icon={MapPinned} label="État / Région">
          <Input
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="Île-de-France"
            className={inputClass}
          />
        </Field>
        <Field icon={Hash} label="Code postal">
          <Input
            value={form.zipCode}
            onChange={(e) => set('zipCode', e.target.value)}
            placeholder="75001"
            className={inputClass}
          />
        </Field>
        <Field icon={Phone} label="Téléphone professionnel">
          <Input
            value={form.officePhone}
            onChange={(e) => set('officePhone', e.target.value)}
            placeholder="+33 1 XX XX XX XX"
            className={inputClass}
          />
        </Field>
        <Field icon={Mail} label="Email professionnel">
          <Input
            value={form.companyEmail}
            onChange={(e) => set('companyEmail', e.target.value)}
            placeholder="contact@entreprise.com"
            className={inputClass}
          />
        </Field>
        <Field icon={Briefcase} label="Poste">
          <Input
            value={form.position}
            onChange={(e) => set('position', e.target.value)}
            placeholder="Gérant, Directeur, ..."
            className={inputClass}
          />
        </Field>
        <Field icon={Users} label="Nombre d'employés">
          <div className="relative">
            <Users className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Select value={form.employees} onValueChange={(v) => set('employees', v)}>
              <SelectTrigger className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10</SelectItem>
                <SelectItem value="11-50">11-50</SelectItem>
                <SelectItem value="51-200">51-200</SelectItem>
                <SelectItem value="201-500">201-500</SelectItem>
                <SelectItem value="501-1000">501-1000</SelectItem>
                <SelectItem value="1000+">1000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Field>
        <Field icon={LinkIcon} label="Site web">
          <Input
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </Field>
        <Field icon={Printer} label="Fax">
          <Input
            value={form.fax}
            onChange={(e) => set('fax', e.target.value)}
            placeholder="+33 1 XX XX XX XX"
            className={inputClass}
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-black px-8 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}
