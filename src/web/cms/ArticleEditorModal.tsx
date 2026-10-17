'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Upload, Image as ImageIcon, Sparkles, Loader2, FileText, HelpCircle, Globe, ExternalLink, Package } from 'lucide-react';
import type { InsightArticle, InsightFaqItem } from '@/web/data/insights-articles-content';
import { useCms } from '@/lib/site-web/cms-context';

import { subscribeProducts } from '@/lib/products/products-service';
import { isSystemTemplate } from '@/lib/products/system-template';
import type { ProductRecord } from '@/lib/products/types';

/** Produits de secours pour le sélecteur si hors ligne ou avant le chargement */
const FALLBACK_PRODUCTS = [
  { slug: 'caisson-dynamique', name: 'Caisson dynamique' },
  { slug: 'pxt-fine', name: 'PXT FINE' },
  { slug: 'pxt-seamless', name: 'PXT SEAMLESS' },
  { slug: 'pxt-wrap', name: 'PXT WRAP' },
];

interface ArticleEditorModalProps {
  article: InsightArticle;
  isOpen: boolean;
  initialTab?: 'content' | 'metadata' | 'faqs';
  onClose: () => void;
  onSaved: (updated: InsightArticle) => void;
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  article,
  isOpen,
  initialTab = 'content',
  onClose,
  onSaved,
}) => {
  const { uploadMedia, currentLang } = useCms();
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'faqs'>(initialTab);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronise initialTab si rouvert
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // États du formulaire
  const [title, setTitle] = useState(article.title);
  const [titleFr, setTitleFr] = useState(article.titleFr ?? article.title);
  const [desc, setDesc] = useState(article.desc ?? '');
  const [descFr, setDescFr] = useState(article.descFr ?? article.desc ?? '');
  const [img, setImg] = useState(article.img);
  const [category, setCategory] = useState(article.category);
  const [chip, setChip] = useState(article.chip);
  const [read, setRead] = useState(article.read);
  const [date, setDate] = useState(article.date);
  const [dateFr, setDateFr] = useState(article.dateFr ?? article.date);
  const [content, setContent] = useState(article.content);
  const [contentFr, setContentFr] = useState(article.contentFr ?? article.content);
  const [faqs, setFaqs] = useState<InsightFaqItem[]>(article.faqs || []);
  const [faqsFr, setFaqsFr] = useState<InsightFaqItem[]>(article.faqsFr || article.faqs || []);
  const [relatedProductSlug, setRelatedProductSlug] = useState(article.relatedProductSlug ?? '');
  const [relatedProductName, setRelatedProductName] = useState(article.relatedProductName ?? '');
  const [availableProducts, setAvailableProducts] = useState<Array<{ slug: string; name: string }>>(FALLBACK_PRODUCTS);

  // Charge dynamiquement les vrais produits depuis Firestore (avec exclusion du template maître et des produits supprimés)
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeProducts(
      (records: ProductRecord[]) => {
        const filtered = records
          .filter((p) => !isSystemTemplate(p) && p.status !== 'deleted')
          .map((p) => ({
            slug: p.slug,
            name: p.name || p.slug,
          }));

        if (filtered.length > 0) {
          setAvailableProducts(filtered);
        }
      },
      (err) => {
        console.warn('[ArticleEditorModal] Erreur chargement produits:', err);
      }
    );
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload: Partial<InsightArticle> = {
        slug: article.slug,
        title,
        titleFr,
        desc,
        descFr,
        img,
        category,
        chip,
        read,
        date,
        dateFr,
        content,
        contentFr,
        faqs,
        faqsFr,
        relatedProductSlug: relatedProductSlug || undefined,
        relatedProductName: relatedProductName || undefined,
      };

      const res = await fetch(`/api/site-web/articles/${article.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Erreur lors de l\'enregistrement de l\'article.');
      }

      const data = await res.json();
      const updatedArticle = data.article || payload;
      onSaved(updatedArticle as InsightArticle);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadMedia(file);
      setImg(url);
    } catch (err) {
      console.error(err);
      setErrorMsg('Échec du téléversement de l\'image.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-cms-ui
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#111110] border border-[#2b2b28] w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-[#f5f4f0]">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#181816]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#C3F910]/15 text-[#C3F910]">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Éditer l’article : <span className="font-mono text-[#C3F910] text-sm">{article.slug}</span>
              </h2>
              <p className="text-xs text-[#888] font-mono">
                Modifications enregistrées directement dans la source de vérité PixiaTech
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#222] bg-[#141412] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'content'
                ? 'border-[#C3F910] text-[#C3F910]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            Contenu & Textes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'metadata'
                ? 'border-[#C3F910] text-[#C3F910]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            Image & Métadonnées
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'faqs'
                ? 'border-[#C3F910] text-[#C3F910]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            FAQ ({faqs.length})
          </button>
        </div>

        {/* Corps des onglets */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-[#3a1111] border border-[#ff4444] text-[#ff8888] p-3 rounded-lg text-xs font-mono">
              ✕ {errorMsg}
            </div>
          )}

          {/* Onglet 1 : Contenu */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              {/* Titres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">
                    Titre Français (titleFr)
                  </label>
                  <input
                    type="text"
                    value={titleFr}
                    onChange={(e) => setTitleFr(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">
                    Titre Anglais (title)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
              </div>

              {/* Extraits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">
                    Extrait / Résumé Français (descFr)
                  </label>
                  <textarea
                    rows={3}
                    value={descFr}
                    onChange={(e) => setDescFr(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:border-[#C3F910] focus:outline-none resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">
                    Extrait / Résumé Anglais (desc)
                  </label>
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:border-[#C3F910] focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* Contenu complet Markdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold text-[#aaa]">
                    Corps de l’article en Français (Markdown)
                  </label>
                  <span className="text-[11px] font-mono text-[#666]">
                    Supporte ## Titres, ### Sous-titres, &gt; Citations, Listes
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={contentFr}
                  onChange={(e) => setContentFr(e.target.value)}
                  className="w-full bg-[#181816] border border-[#333] rounded-lg p-3 text-xs font-mono text-white focus:border-[#C3F910] focus:outline-none leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">
                  Corps de l’article en Anglais (content)
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#181816] border border-[#333] rounded-lg p-3 text-xs font-mono text-white focus:border-[#C3F910] focus:outline-none leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {/* Onglet 2 : Métadonnées */}
          {activeTab === 'metadata' && (
            <div className="space-y-5">
              {/* Image de couverture */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#aaa] mb-2">
                  Image de couverture (URL ou fichier)
                </label>
                <div className="flex items-center gap-4">
                  {img && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden border border-[#333] bg-[#000] shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={img}
                      onChange={(e) => setImg(e.target.value)}
                      placeholder="https://... ou /uploads/site/..."
                      className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-xs font-mono cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#C3F910]" />
                      <span>Téléverser une image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Catégorie & Tag */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                  >
                    <option value="GUIDE">GUIDE</option>
                    <option value="GUIDE — FEATURED">GUIDE — FEATURED (À la une)</option>
                    <option value="LED TECHNOLOGY">LED TECHNOLOGY</option>
                    <option value="COMPARISON">COMPARISON</option>
                    <option value="DOOH">DOOH</option>
                    <option value="RETAIL">RETAIL</option>
                    <option value="CORPORATE AV">CORPORATE AV</option>
                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                    <option value="VIRTUAL PRODUCTION">VIRTUAL PRODUCTION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">Filtre (Chip)</label>
                  <input
                    type="text"
                    value={chip}
                    onChange={(e) => setChip(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">Temps de lecture</label>
                  <input
                    type="text"
                    value={read}
                    onChange={(e) => setRead(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">Date Française</label>
                  <input
                    type="text"
                    value={dateFr}
                    onChange={(e) => setDateFr(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#aaa] mb-1.5">Date Anglaise</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                  />
                </div>
              </div>

              {/* Produit associé */}
              <div className="border border-[#333] rounded-xl p-4 bg-[#141412] space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#C3F910]" />
                  <span className="text-xs font-mono font-bold text-[#aaa]">Produit PixiaTech associé</span>
                </div>
                <p className="text-[11px] font-mono text-[#666] leading-relaxed">
                  Sélectionnez un produit de la gamme PixiaTech à afficher sous l'introduction de cet article.
                  Si aucun produit n'est sélectionné, le produit par défaut (s'il existe) sera utilisé.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#aaa] mb-1">Produit</label>
                    <select
                      value={relatedProductSlug}
                      onChange={(e) => {
                        const val = e.target.value;
                        const selected = availableProducts.find(p => p.slug === val);
                        setRelatedProductSlug(val);
                        if (selected) {
                          setRelatedProductName(selected.name);
                        } else if (!val) {
                          setRelatedProductName('');
                        }
                      }}
                      className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                    >
                      <option value="">— Aucun / Défaut automatique —</option>
                      {/* Si un produit actuellement configuré sur l'article n'est pas encore dans availableProducts, on l'affiche */}
                      {relatedProductSlug && !availableProducts.some(p => p.slug === relatedProductSlug) && (
                        <option value={relatedProductSlug}>
                          {relatedProductName || relatedProductSlug} ({relatedProductSlug})
                        </option>
                      )}
                      {availableProducts.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#aaa] mb-1">Nom d'affichage personnalisé</label>
                    <input
                      type="text"
                      value={relatedProductName}
                      onChange={(e) => setRelatedProductName(e.target.value)}
                      placeholder={relatedProductSlug ? (availableProducts.find(p => p.slug === relatedProductSlug)?.name ?? relatedProductName ?? '') : 'Sélectionnez un produit'}
                      className="w-full bg-[#181816] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                    />
                  </div>
                </div>
                {relatedProductSlug && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#C3F910]">
                    <Check className="w-3 h-3" />
                    <span>Sera affiché : <strong>{relatedProductName || '—'}</strong> → /web/product/{relatedProductSlug}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet 3 : FAQ */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#aaa]">Questions fréquentes pour cet article</span>
                <button
                  type="button"
                  onClick={() => {
                    setFaqs([...faqs, { question: 'Nouvelle question ?', answer: 'Réponse...' }]);
                    setFaqsFr([...faqsFr, { question: 'Nouvelle question ?', answer: 'Réponse...' }]);
                  }}
                  className="px-3 py-1 bg-[#C3F910] text-[#080808] rounded text-xs font-mono font-bold hover:bg-[#b0e20e]"
                >
                  + Ajouter une FAQ
                </button>
              </div>

              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-[#181816] border border-[#333] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#C3F910] font-bold">FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFaqs(faqs.filter((_, i) => i !== idx));
                        setFaqsFr(faqsFr.filter((_, i) => i !== idx));
                      }}
                      className="text-xs text-[#ff6666] hover:underline font-mono"
                    >
                      Supprimer
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#aaa] mb-1">Question (FR)</label>
                    <input
                      type="text"
                      value={faqsFr[idx]?.question ?? faq.question}
                      onChange={(e) => {
                        const next = [...faqsFr];
                        next[idx] = { ...(next[idx] || faq), question: e.target.value };
                        setFaqsFr(next);
                      }}
                      className="w-full bg-[#111] border border-[#444] rounded px-3 py-1.5 text-xs text-white focus:border-[#C3F910]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#aaa] mb-1">Réponse (FR)</label>
                    <textarea
                      rows={2}
                      value={faqsFr[idx]?.answer ?? faq.answer}
                      onChange={(e) => {
                        const next = [...faqsFr];
                        next[idx] = { ...(next[idx] || faq), answer: e.target.value };
                        setFaqsFr(next);
                      }}
                      className="w-full bg-[#111] border border-[#444] rounded px-3 py-1.5 text-xs text-white focus:border-[#C3F910] resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222] bg-[#181816]">
          <span className="text-xs text-[#777] font-mono">
            {saving ? 'Synchronisation Firestore…' : 'Prêt à enregistrer'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-white text-xs font-mono font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] text-xs font-mono font-bold shadow-lg transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>ENREGISTRER L’ARTICLE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
