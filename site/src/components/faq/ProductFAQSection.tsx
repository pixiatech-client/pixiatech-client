import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { FAQItem } from '../../types/product';

export const ProductFAQSection: React.FC = () => {
  const {
    data,
    updateField,
    updateData,
    toggleSectionVisibility,
    toggleItemVisibility,
    isEditMode,
    isVisitorPreview
  } = useProduct();

  const faq = data.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faq.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const handleUpdateItem = (id: string, field: keyof FAQItem, value: any) => {
    updateData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((it) =>
          it.id === id ? { ...it, [field]: value } : it
        )
      }
    }));
  };

  const handleAddFaq = () => {
    const newId = 'faq-' + Date.now();
    const newItem: FAQItem = {
      id: newId,
      question: 'Nouvelle question fréquente ?',
      answer: 'Réponse détaillée pour conseiller les clients et détailler la technologie...',
      visible: true
    };
    updateData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [...prev.faq.items, newItem]
      }
    }));
    setOpenIndex(faq.items.length);
  };

  const handleDeleteFaq = (id: string) => {
    if (!window.confirm('Supprimer cette question FAQ ?')) return;
    updateData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((it) => it.id !== id)
      }
    }));
  };

  return (
    <section id="faq" className={`py-16 bg-[#080a0e] border-t border-white/5 relative ${
      !faq.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={faq.visible} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={faq.badge}
                onSave={(val) => updateField('faq', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={faq.title}
                onSave={(val) => updateField('faq', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={faq.subtitle}
                onSave={(val) => updateField('faq', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <CardSwitch
            visible={faq.visible}
            onToggle={() => toggleSectionVisibility('faq')}
            label="Section FAQ"
          />
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faq.items.map((item, index) => {
            const isItemHidden = !item.visible;
            if (isItemHidden && (!isEditMode || isVisitorPreview)) {
              return null;
            }

            const isOpen = openIndex === index;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden relative ${
                  isItemHidden
                    ? 'bg-red-950/20 border-red-500/40 opacity-50'
                    : isOpen
                    ? 'bg-[#0e111a] border-[#c6ff00]/30 shadow-lg'
                    : 'bg-[#0a0c12] border-white/10 hover:border-white/20'
                }`}
              >
                <HiddenOverlayBadge visible={item.visible} />

                {/* Accordion Header */}
                <div
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 pr-2">
                    <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#c6ff00] text-xs font-mono font-bold flex-shrink-0">
                      0{index + 1}
                    </span>
                    <h3 className="font-tech text-base sm:text-lg font-bold text-white text-left tracking-wide">
                      <EditableText
                        value={item.question}
                        onSave={(val) => handleUpdateItem(item.id, 'question', val)}
                      />
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditMode && !isVisitorPreview && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <CardSwitch
                          visible={item.visible}
                          onToggle={() => toggleItemVisibility('faq', 'items', item.id)}
                          compact
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="Supprimer la question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#c6ff00]' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                    <EditableText
                      value={item.answer}
                      onSave={(val) => handleUpdateItem(item.id, 'answer', val)}
                      multiline
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add FAQ Button in Admin Mode */}
        {isEditMode && !isVisitorPreview && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleAddFaq}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c6ff00]/10 hover:bg-[#c6ff00]/20 text-[#c6ff00] border border-[#c6ff00]/30 text-xs font-mono font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une question FAQ</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
