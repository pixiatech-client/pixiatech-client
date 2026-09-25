'use client';
import React, { useState } from 'react';
import { 
  Send, CheckCircle2, AlertCircle, Loader2, Sparkles, 
  Shield, ArrowRight, Check, Layers, User, Mail, Phone, Building, 
  FileText, MessageSquare, Plus, Trash2, Eye, EyeOff 
} from 'lucide-react';
import type { ContactSubmissionPayload, PageContentConfig, ProjectCategoryConfig } from '@/lib/site-web/types';
import { EditableText } from './EditableText';
import { CardSwitch, CardHiddenNotice } from './CardSwitch';

interface ContactFormProps {
  content: PageContentConfig['form'];
  visibility: PageContentConfig['visibility'];
  isAdmin: boolean;
  onUpdateForm: (patch: Partial<PageContentConfig['form']>) => void;
  onUpdateVisibility: (patch: Partial<PageContentConfig['visibility']>) => void;
  onSuccessSubmission?: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  content,
  visibility,
  isAdmin,
  onUpdateForm,
  onUpdateVisibility,
  onSuccessSubmission 
}) => {
  const categories = content.categories || [];
  const firstVisibleCategory = categories.find(c => c.visible)?.title || categories[0]?.title || 'Général';
  const [selectedCategory, setSelectedCategory] = useState<string>(firstVisibleCategory);
  
  const [formData, setFormData] = useState<ContactSubmissionPayload>({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: firstVisibleCategory,
    subject: '',
    message: '',
    consent: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    message: string;
    deliveryStatus?: string;
  } | null>(null);

  if (!visibility.contactFormCard && !isAdmin) {
    return null;
  }

  const handleSelectCategory = (catTitle: string) => {
    setSelectedCategory(catTitle);
    setFormData(prev => ({ ...prev, projectType: catTitle }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      // In admin mode, prevent real form submission so admin can freely test clicking
      alert("Mode Éditeur : Le formulaire fonctionne en direct pour vos visiteurs.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/site-web/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erreur lors de l'envoi de votre demande.");
      }

      setSuccessResult({
        message: result.message,
        deliveryStatus: result.data?.deliveryStatus,
      });

      if (onSuccessSubmission) {
        onSuccessSubmission();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Erreur inattendue lors de l'envoi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      projectType: firstVisibleCategory,
      subject: '',
      message: '',
      consent: true,
    });
  };

  // Admin helpers for categories
  const handleUpdateCategory = (id: string, patch: Partial<ProjectCategoryConfig>) => {
    const updated = categories.map(cat => cat.id === id ? { ...cat, ...patch } : cat);
    onUpdateForm({ categories: updated });
  };

  const handleAddCategory = () => {
    const newId = `cat-${Date.now()}`;
    const newCat: ProjectCategoryConfig = {
      id: newId,
      title: 'Nouvelle Solution Écran LED',
      desc: 'Description de la technologie et caractéristiques clés',
      tag: 'Technologie',
      visible: true,
    };
    onUpdateForm({ categories: [...categories, newCat] });
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    const updated = categories.filter(c => c.id !== id);
    onUpdateForm({ categories: updated });
  };

  return (
    <div className="space-y-4">
      {/* Admin Notice if hidden */}
      {isAdmin && !visibility.contactFormCard && (
        <CardHiddenNotice
          title="Carte Formulaire Principal"
          onRestore={() => onUpdateVisibility({ contactFormCard: true })}
        />
      )}

      <div 
        id="contact-form-container"
        className={`bg-white rounded-2xl border transition-all duration-200 relative ${
          !visibility.contactFormCard 
            ? 'opacity-60 border-amber-300 border-dashed p-6' 
            : 'border-gray-100 p-6 sm:p-8 lg:p-10 shadow-sm hover:border-gray-200'
        }`}
      >
        {/* Admin Card Switch Header */}
        {isAdmin && (
          <div className="mb-4 pb-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50/80 -mt-2 -mx-2 p-2.5 rounded-xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Paramètres de la Carte Formulaire
            </span>
            <div className="flex items-center space-x-2">
              <CardSwitch
                label="Carte Formulaire"
                checked={visibility.contactFormCard}
                onChange={(val) => onUpdateVisibility({ contactFormCard: val })}
                isAdmin={isAdmin}
                compact
              />
            </div>
          </div>
        )}

        {/* Header Form */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 rounded-full bg-gray-50 border border-gray-200/60 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
              <Sparkles size={14} strokeWidth={1.5} className="text-[#7c3aed]" />
              <EditableText
                as="span"
                value={content.badge}
                onChange={(val) => onUpdateForm({ badge: val })}
                isAdmin={isAdmin}
                label="Badge du formulaire"
              />
            </div>

            <EditableText
              as="span"
              value={content.headerSubtext}
              onChange={(val) => onUpdateForm({ headerSubtext: val })}
              isAdmin={isAdmin}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400"
              label="Mention d'assistance"
            />
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
            <EditableText
              as="span"
              value={content.title}
              onChange={(val) => onUpdateForm({ title: val })}
              isAdmin={isAdmin}
              label="Titre du formulaire"
            />
          </h2>
          <EditableText
            as="p"
            multiline
            value={content.subtitle}
            onChange={(val) => onUpdateForm({ subtitle: val })}
            isAdmin={isAdmin}
            className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl block"
            label="Sous-titre explicatif"
          />
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center animate-in fade-in">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
              Demande envoyée avec succès !
            </h3>

            <p className="mt-2 text-sm text-emerald-800 max-w-lg mx-auto">
              {successResult.message}
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left text-xs text-slate-700 space-y-2 shadow-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Demandeur :</span>
                <span className="font-bold text-slate-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email :</span>
                <span className="font-semibold text-slate-900">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Technologie :</span>
                <span className="font-semibold text-[#007bff]">{selectedCategory}</span>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <span>Envoyer une nouvelle demande</span>
                <ArrowRight size={14} strokeWidth={1.5} className="text-[#c6ff00]" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="flex items-start space-x-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <AlertCircle size={14} strokeWidth={1.5} className="shrink-0 text-red-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Select Technology Category */}
            {(visibility.formCategorySelection || isAdmin) && (
              <div className={!visibility.formCategorySelection ? 'opacity-50 border border-dashed border-amber-300 rounded-xl p-3' : ''}>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
                    <EditableText
                      as="span"
                      value={content.step1Title}
                      onChange={(val) => onUpdateForm({ step1Title: val })}
                      isAdmin={isAdmin}
                      label="Titre de l'étape 1"
                    /> <span className="text-red-500">*</span>
                  </label>

                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <Plus size={11} />
                        <span>Ajouter une technologie</span>
                      </button>
                      <CardSwitch
                        label="Bloc Catégories"
                        checked={visibility.formCategorySelection}
                        onChange={(val) => onUpdateVisibility({ formCategorySelection: val })}
                        isAdmin={isAdmin}
                        compact
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    if (!cat.visible && !isAdmin) return null;
                    const isSelected = selectedCategory === cat.title;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.title)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between relative ${
                          !cat.visible
                            ? 'opacity-50 border-dashed border-amber-300 bg-amber-50/20'
                            : isSelected 
                              ? 'border-black bg-black text-white shadow-md' 
                              : 'border-gray-200 bg-gray-50/30 text-slate-800 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        {/* Admin controls for category card */}
                        {isAdmin && (
                          <div 
                            className="absolute top-2 right-2 flex items-center space-x-1 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id, { visible: !cat.visible })}
                              className="p-1 rounded bg-white/80 hover:bg-white text-gray-700 shadow-sm text-[10px]"
                              title={cat.visible ? "Masquer cette catégorie" : "Afficher cette catégorie"}
                            >
                              {cat.visible ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-rose-500" />}
                            </button>
                            {categories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 rounded bg-white/80 hover:bg-white text-rose-600 shadow-sm"
                                title="Supprimer cette catégorie"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${
                              isSelected ? 'bg-white/20 text-[#c6ff00]' : 'bg-gray-200/80 text-slate-600'
                            }`}>
                              <EditableText
                                as="span"
                                value={cat.tag}
                                onChange={(val) => handleUpdateCategory(cat.id, { tag: val })}
                                isAdmin={isAdmin}
                                label="Tag catégorie"
                              />
                            </span>
                            {isSelected && (
                              <div className="h-4 w-4 rounded-full bg-[#c6ff00] text-black flex items-center justify-center">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="font-bold text-sm leading-snug">
                            <EditableText
                              as="div"
                              value={cat.title}
                              onChange={(val) => handleUpdateCategory(cat.id, { title: val })}
                              isAdmin={isAdmin}
                              label="Titre de la catégorie"
                            />
                          </div>
                          <div className={`mt-1 text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            <EditableText
                              as="div"
                              value={cat.desc}
                              onChange={(val) => handleUpdateCategory(cat.id, { desc: val })}
                              isAdmin={isAdmin}
                              label="Description de la catégorie"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
                  <EditableText
                    as="span"
                    value={content.step2Title}
                    onChange={(val) => onUpdateForm({ step2Title: val })}
                    isAdmin={isAdmin}
                    label="Titre de l'étape 2"
                  />
                </label>

                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <CardSwitch
                      label="Téléphone"
                      checked={visibility.formPhoneField}
                      onChange={(val) => onUpdateVisibility({ formPhoneField: val })}
                      isAdmin={isAdmin}
                      compact
                    />
                    <CardSwitch
                      label="Entreprise"
                      checked={visibility.formCompanyField}
                      onChange={(val) => onUpdateVisibility({ formCompanyField: val })}
                      isAdmin={isAdmin}
                      compact
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Nom & Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <User size={14} strokeWidth={1.5} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ex: Alexandre Bernard"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email Professionnel <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Mail size={14} strokeWidth={1.5} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@entreprise.fr"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                {(visibility.formPhoneField || isAdmin) && (
                  <div className={!visibility.formPhoneField ? 'opacity-50' : ''}>
                    <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Phone size={14} strokeWidth={1.5} />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Company */}
                {(visibility.formCompanyField || isAdmin) && (
                  <div className={!visibility.formCompanyField ? 'opacity-50' : ''}>
                    <label htmlFor="company" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Entreprise / Société
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Building size={14} strokeWidth={1.5} />
                      </div>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Nom de votre société"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Message & Specs */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">
                  <EditableText
                    as="span"
                    value={content.step3Title}
                    onChange={(val) => onUpdateForm({ step3Title: val })}
                    isAdmin={isAdmin}
                    label="Titre de l'étape 3"
                  />
                </label>

                {isAdmin && (
                  <CardSwitch
                    label="Champ Objet"
                    checked={visibility.formSubjectField}
                    onChange={(val) => onUpdateVisibility({ formSubjectField: val })}
                    isAdmin={isAdmin}
                    compact
                  />
                )}
              </div>

              <div className="space-y-4">
                {(visibility.formSubjectField || isAdmin) && (
                  <div className={!visibility.formSubjectField ? 'opacity-50' : ''}>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <FileText size={14} strokeWidth={1.5} />
                      </div>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Objet : ex. Écran vitrine 3m x 2m pour boutique Haussmann"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3.5 text-gray-400">
                      <MessageSquare size={14} strokeWidth={1.5} />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Décrivez votre besoin : dimensions prévues, environnement intérieur ou vitrine, ville d'installation, planning souhaité..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RGPD Consent */}
            <div className="flex items-start space-x-3 pt-1">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                J'accepte que mes informations soient traitées par <strong>PIXIATECH</strong> dans le cadre de ma demande de devis et d'échange technique, conformément à notre politique de confidentialité (RGPD).
              </label>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                id="btn-submit-contact"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 text-white font-bold py-3.5 px-8 text-sm btn-pixia-clip shadow-xl transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #7c3aed 0%, #ef4444 50%, #f97316 100%)',
                  borderRadius: '0 16px 0 16px'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Transmission vers nos serveurs en cours...</span>
                  </>
                ) : (
                  <>
                    <EditableText
                      as="span"
                      value={content.submitButtonText}
                      onChange={(val) => onUpdateForm({ submitButtonText: val })}
                      isAdmin={isAdmin}
                      label="Texte du bouton d'envoi"
                    />
                    <Send size={15} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </div>

            {/* Trust reassurance */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 pt-1">
              <Shield size={14} strokeWidth={1.5} className="text-emerald-600 shrink-0" />
              <EditableText
                as="span"
                value={content.trustReassuranceText}
                onChange={(val) => onUpdateForm({ trustReassuranceText: val })}
                isAdmin={isAdmin}
                label="Mention de réassurance"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
