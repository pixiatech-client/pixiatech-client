'use client';

import { MapPin, User, Mail, Phone, Check } from 'lucide-react';
import CityInput from '@/components/CityInput';
import type { VatStatus } from '@/hooks/useVatValidation';
import { useI18n } from '@/lib/i18n';
import {
  type CustomerInfoValues,
  type CustomerInfoField,
  DEFAULT_COUNTRY_OPTIONS,
  fieldMeta,
} from '@/lib/customer-form-utils';

export type { CustomerInfoValues, CustomerInfoField } from '@/lib/customer-form-utils';

interface ErrorMeta {
  error: string;
  hasError: boolean;
  isValid: boolean;
}

export interface CustomerInfoFormProps {
  values: CustomerInfoValues;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isB2B: boolean;
  onFieldChange: (field: CustomerInfoField, value: string) => void;
  onFieldBlur: (field: CustomerInfoField, value: string) => void;
  onCitySelect?: (cityName: string, postcode: string) => void;
  onAddressLine2Change?: (value: string) => void;
  banner?: React.ReactNode | null;
  vatStatus?: VatStatus;
  vatErrorMessage?: string;
  vatValidating?: boolean;
  onVatChange?: (value: string) => void;
  onVatValidate?: () => void;
  countryOptions?: { value: string; label: string }[];
}

function ErrorMessage({ id, message }: { id: string; message: string }) {
  return (
    <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
      {message && (
        <p id={id} className="text-[10px] text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          {message}
        </p>
      )}
    </div>
  );
}

function inputCls(meta: ErrorMeta, withIcon = true, extra?: Record<string, string>) {
  return `${withIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white placeholder:text-gray-300 w-full ${
    meta.hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : meta.isValid
        ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
        : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
  }`;
}

function plainInputCls(meta: ErrorMeta) {
  return `w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white ${
    meta.hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
  }`;
}

export default function CustomerInfoForm({
  values,
  errors,
  touched,
  isB2B,
  onFieldChange,
  onFieldBlur,
  onCitySelect,
  onAddressLine2Change,
  banner,
  vatStatus = 'idle',
  vatErrorMessage = '',
  vatValidating = false,
  onVatChange,
  onVatValidate,
  countryOptions = DEFAULT_COUNTRY_OPTIONS,
}: CustomerInfoFormProps) {
  const { t } = useI18n();

  const meta = (field: string, value: string) => fieldMeta(errors, touched, field, value);

  return (
    <>
      {banner && (
        <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <Check size={14} className="text-blue-600 shrink-0" />
          <span>{banner}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.firstName')}</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="text"
              placeholder={t('checkout.firstNamePlaceholder')}
              value={values.firstName}
              onChange={e => onFieldChange('firstName', e.target.value)}
              onBlur={e => onFieldBlur('firstName', e.target.value)}
              aria-invalid={meta('firstName', values.firstName).hasError}
              aria-describedby={meta('firstName', values.firstName).error ? 'err-firstName' : undefined}
              className={inputCls(meta('firstName', values.firstName))}
            />
          </div>
          <ErrorMessage id="err-firstName" message={meta('firstName', values.firstName).error} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.lastName')}</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="text"
              placeholder={t('checkout.lastNamePlaceholder')}
              value={values.lastName}
              onChange={e => onFieldChange('lastName', e.target.value)}
              onBlur={e => onFieldBlur('lastName', e.target.value)}
              aria-invalid={meta('lastName', values.lastName).hasError}
              aria-describedby={meta('lastName', values.lastName).error ? 'err-lastName' : undefined}
              className={inputCls(meta('lastName', values.lastName))}
            />
          </div>
          <ErrorMessage id="err-lastName" message={meta('lastName', values.lastName).error} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.email')}</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="email"
              placeholder={t('checkout.emailPlaceholder')}
              value={values.email}
              onChange={e => onFieldChange('email', e.target.value)}
              onBlur={e => onFieldBlur('email', e.target.value)}
              aria-invalid={meta('email', values.email).hasError}
              aria-describedby={meta('email', values.email).error ? 'err-email' : undefined}
              className={inputCls(meta('email', values.email))}
            />
          </div>
          <ErrorMessage id="err-email" message={meta('email', values.email).error} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.mobilePhone')}</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="tel"
              placeholder={t('checkout.phonePlaceholder')}
              value={values.phone}
              onChange={e => onFieldChange('phone', e.target.value)}
              onBlur={e => onFieldBlur('phone', e.target.value)}
              aria-invalid={meta('phone', values.phone).hasError}
              aria-describedby={meta('phone', values.phone).error ? 'err-phone' : undefined}
              className={inputCls(meta('phone', values.phone))}
            />
          </div>
          <ErrorMessage id="err-phone" message={meta('phone', values.phone).error} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.addressLine1')}</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="text"
              placeholder={t('checkout.addressLine1Placeholder')}
              value={values.addressLine1}
              onChange={e => onFieldChange('addressLine1', e.target.value)}
              onBlur={e => onFieldBlur('addressLine1', e.target.value)}
              aria-invalid={meta('addressLine1', values.addressLine1).hasError}
              aria-describedby={meta('addressLine1', values.addressLine1).error ? 'err-addressLine1' : undefined}
              className={inputCls(meta('addressLine1', values.addressLine1))}
            />
          </div>
          <ErrorMessage id="err-addressLine1" message={meta('addressLine1', values.addressLine1).error} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('checkout.addressLine2')}</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
            <input
              type="text"
              placeholder={t('checkout.addressLine2Placeholder')}
              value={values.addressLine2}
              onChange={e => (onAddressLine2Change ? onAddressLine2Change(e.target.value) : onFieldChange('addressLine2', e.target.value))}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <CityInput
            value={values.city ? `${values.city} (${values.postcode})` : ''}
            onChange={(cityName, postcode) => onCitySelect ? onCitySelect(cityName, postcode) : undefined}
            error={!!(errors.city || errors.postcode)}
            errorMessage={errors.city || errors.postcode}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Pays</label>
          <select
            value={values.country}
            onChange={e => onFieldChange('country', e.target.value)}
            onBlur={e => onFieldBlur('country', e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white ${
              meta('country', values.country).hasError
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
            }`}
          >
            {countryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      {isB2B && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 border-t border-gray-100 pt-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Raison sociale *</label>
            <input
              type="text"
              placeholder="Nom de l'entreprise"
              value={values.companyName}
              onChange={e => onFieldChange('companyName', e.target.value)}
              onBlur={e => onFieldBlur('companyName', e.target.value)}
              className={plainInputCls(meta('companyName', values.companyName))}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">SIREN / SIRET *</label>
            <input
              type="text"
              placeholder="123 456 789"
              value={values.siren}
              onChange={e => onFieldChange('siren', e.target.value)}
              onBlur={e => onFieldBlur('siren', e.target.value)}
              className={plainInputCls(meta('siren', values.siren))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Numéro de TVA intracommunautaire</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="FRXX999999999"
                value={values.vatNumber}
                onChange={e => onVatChange ? onVatChange(e.target.value) : onFieldChange('vatNumber', e.target.value)}
                onBlur={e => onFieldBlur('vatNumber', e.target.value)}
                className={`flex-1 px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white ${
                  vatStatus === 'valid'
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : vatStatus === 'invalid'
                      ? 'border-red-300 bg-red-50/30'
                      : meta('vatNumber', values.vatNumber).hasError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
                }`}
              />
              <button
                type="button"
                disabled={vatValidating || !values.vatNumber}
                onClick={onVatValidate}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  vatStatus === 'valid'
                    ? 'bg-emerald-500 text-white'
                    : vatStatus === 'invalid'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                }`}
              >
                {vatValidating ? '...' : vatStatus === 'valid' ? '✓ Valide' : vatStatus === 'invalid' ? '✗ Invalide' : 'Valider'}
              </button>
            </div>
            {vatStatus === 'valid' && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Numéro de TVA valide — TVA autoliquidée</p>
            )}
            {vatStatus === 'invalid' && (
              <p className="text-[10px] text-red-500 font-semibold mt-1">{vatErrorMessage}</p>
            )}
            {vatStatus === 'error' && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1">{vatErrorMessage}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
