'use client';
import React, { useState } from 'react';
import { 
  ChevronDown, HelpCircle, Plus, Trash2, Eye, EyeOff 
} from 'lucide-react';
import type { PageContentConfig, FaqItemConfig } from '@/lib/site-web/types';
import { EditableText } from './EditableText';
import { CardSwitch, CardHiddenNotice } from './CardSwitch';

interface FaqSectionProps {
  content: PageContentConfig['faq'];
  visibility: PageContentConfig['visibility'];
  isAdmin: boolean;
  onUpdateFaq: (patch: Partial<PageContentConfig['faq']>) => void;
  onUpdateVisibility: (patch: Partial<PageContentConfig['visibility']>) => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  content,
  visibility,
  isAdmin,
  onUpdateFaq,
  onUpdateVisibility,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = content.items || [];

  if (!visibility.faqSection && !isAdmin) {
    return null;
  }

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleUpdateItem = (id: string, patch: Partial<FaqItemConfig>) => {
    const updated = items.map(item => item.id === id ? { ...item, ...patch } : item);
    onUpdateFaq({ items: updated });
  };

  const handleAddItem = () => {
    const newId = `faq-${Date.now()}`;
    const newItem: FaqItemConfig = {
      id: newId,
      category: 'NOUVELLE CATÉGORIE',
      question: 'Nouvelle question fréquente ?',
      answer: 'Réponse détaillée et explicative rédigée par vos soins.',
      visible: true,
    };
    onUpdateFaq({ items: [...items, newItem] });
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    const updated = items.filter(item => item.id !== id);
    onUpdateFaq({ items: updated });
  };

  return (
    <section className={`border-t border-slate-200/80 bg-white py-16 sm:py-20 relative ${
      !visibility.faqSection ? 'opacity-60 border-amber-300 border-dashed bg-amber-50/10' : ''
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Admin Section Switch Header */}
        {isAdmin && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Paramètres de la Section FAQ
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors"
              >
                <Plus size={13} />
                <span>Ajouter une question FAQ</span>
              </button>
              <CardSwitch
                label="Section FAQ Entière"
                checked={visibility.faqSection}
                onChange={(val) => onUpdateVisibility({ faqSection: val })}
                isAdmin={isAdmin}
                compact
              />
            </div>
          </div>
        )}

        {isAdmin && !visibility.faqSection && (
          <CardHiddenNotice
            title="Section FAQ Technique"
            onRestore={() => onUpdateVisibility({ faqSection: true })}
          />
        )}

        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center space-x-2 rounded-full bg-gray-50 border border-gray-200/60 px-3 py-1 text-slate-700">
            <HelpCircle size={14} strokeWidth={1.5} className="text-gray-900" />
            <EditableText
              as="span"
              value={content.badge}
              onChange={(val) => onUpdateFaq({ badge: val })}
              isAdmin={isAdmin}
              className="tracking-[0.2em] uppercase text-[11px] font-black text-gray-500"
              label="Badge FAQ"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
            <EditableText
              as="span"
              value={content.title}
              onChange={(val) => onUpdateFaq({ title: val })}
              isAdmin={isAdmin}
              label="Titre de la FAQ"
            />
          </h2>
          <div className="mt-2 text-sm text-slate-600 leading-relaxed">
            <EditableText
              as="p"
              multiline
              value={content.subtitle}
              onChange={(val) => onUpdateFaq({ subtitle: val })}
              isAdmin={isAdmin}
              label="Sous-titre de la FAQ"
            />
          </div>
        </div>

        <div className="mt-10 max-w-3xl space-y-4">
          {items.map((faq, index) => {
            if (!faq.visible && !isAdmin) return null;
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 relative ${
                  !faq.visible
                    ? 'opacity-50 border-dashed border-amber-300 bg-amber-50/20'
                    : isOpen 
                      ? 'border-gray-300 bg-gray-50/50 shadow-sm' 
                      : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                {/* Admin controls for FAQ item */}
                {isAdmin && (
                  <div className="absolute top-3 right-12 flex items-center space-x-2 z-20">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(faq.id, { visible: !faq.visible })}
                      className="p-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 shadow-sm"
                      title={faq.visible ? "Masquer cette question" : "Afficher cette question"}
                    >
                      {faq.visible ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-rose-500" />}
                    </button>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(faq.id)}
                        className="p-1 rounded bg-white hover:bg-rose-50 border border-gray-200 text-rose-600 shadow-sm"
                        title="Supprimer cette question"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-start justify-between p-5 sm:p-6 text-left"
                >
                  <div className="pr-4 flex-1">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <EditableText
                        as="span"
                        value={faq.category}
                        onChange={(val) => handleUpdateItem(faq.id, { category: val })}
                        isAdmin={isAdmin}
                        label="Catégorie question"
                      />
                    </div>
                    <div className="mt-1 text-base font-bold text-gray-900">
                      <EditableText
                        as="div"
                        value={faq.question}
                        onChange={(val) => handleUpdateItem(faq.id, { question: val })}
                        isAdmin={isAdmin}
                        label="Texte de la question"
                      />
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`shrink-0 text-gray-700 transition-transform duration-200 mt-1 ${
                      isOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-gray-100">
                    <EditableText
                      as="div"
                      multiline
                      value={faq.answer}
                      onChange={(val) => handleUpdateItem(faq.id, { answer: val })}
                      isAdmin={isAdmin}
                      label="Réponse de la FAQ"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
