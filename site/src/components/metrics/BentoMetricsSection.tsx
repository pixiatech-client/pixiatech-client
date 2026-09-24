import React from 'react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { DynamicIcon } from '../ui/DynamicIcon';
import { Edit2 } from 'lucide-react';

export const BentoMetricsSection: React.FC = () => {
  const {
    data,
    updateField,
    updateData,
    toggleSectionVisibility,
    toggleItemVisibility,
    setItemIcon,
    openIconPicker,
    isEditMode,
    isVisitorPreview
  } = useProduct();

  const metrics = data.metrics;

  if (!metrics.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const handleUpdateCard = (id: string, field: string, value: any) => {
    updateData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        cards: prev.metrics.cards.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        )
      }
    }));
  };

  return (
    <section id="metrics" className={`py-16 border-t border-white/5 relative ${
      !metrics.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={metrics.visible} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={metrics.badge}
                onSave={(val) => updateField('metrics', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={metrics.title}
                onSave={(val) => updateField('metrics', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={metrics.subtitle}
                onSave={(val) => updateField('metrics', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <CardSwitch
            visible={metrics.visible}
            onToggle={() => toggleSectionVisibility('metrics')}
            label="Section Métriques"
          />
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.cards.map((card) => {
            const isItemHidden = !card.visible;
            if (isItemHidden && (!isEditMode || isVisitorPreview)) {
              return null;
            }

            return (
              <div
                key={card.id}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isItemHidden
                    ? 'bg-red-950/20 border-red-500/40 opacity-50'
                    : 'bg-[#0d1017] border-white/10 hover:border-[#c6ff00]/40 hover:shadow-[0_0_30px_rgba(198,255,0,0.1)]'
                }`}
              >
                <HiddenOverlayBadge visible={card.visible} />

                {/* Top bar of Card: Icon & Switch */}
                <div className="flex items-center justify-between mb-6">
                  {/* Icon with interactive picker in edit mode */}
                  <div className="relative">
                    <div
                      onClick={() => {
                        if (isEditMode && !isVisitorPreview) {
                          openIconPicker(card.icon, (newIcon) => {
                            setItemIcon('metrics', 'cards', card.id, newIcon);
                          }, `Choisir l'icône pour ${card.title}`);
                        }
                      }}
                      className={`w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#c6ff00] transition-transform ${
                        isEditMode && !isVisitorPreview
                          ? 'cursor-pointer hover:border-[#c6ff00] hover:scale-105 group/icon'
                          : ''
                      }`}
                      title={isEditMode && !isVisitorPreview ? 'Cliquer pour changer l\'icône' : ''}
                    >
                      <DynamicIcon name={card.icon} className="w-6 h-6" />
                      {isEditMode && !isVisitorPreview && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#c6ff00] text-black rounded-full flex items-center justify-center text-[10px] shadow">
                          <Edit2 className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                      <EditableText
                        value={card.badge}
                        onSave={(val) => handleUpdateCard(card.id, 'badge', val)}
                      />
                    </span>
                    <CardSwitch
                      visible={card.visible}
                      onToggle={() => toggleItemVisibility('metrics', 'cards', card.id)}
                      compact
                    />
                  </div>
                </div>

                {/* Card Main Numbers */}
                <div className="mb-4">
                  <div className="font-tech text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
                    <EditableText
                      value={card.value}
                      onSave={(val) => handleUpdateCard(card.id, 'value', val)}
                    />
                  </div>
                  <div className="text-xs font-mono text-[#c6ff00] uppercase tracking-wider">
                    <EditableText
                      value={card.unit}
                      onSave={(val) => handleUpdateCard(card.id, 'unit', val)}
                    />
                  </div>
                </div>

                {/* Card Title & Description */}
                <div>
                  <h3 className="font-tech text-base font-bold text-white mb-2">
                    <EditableText
                      value={card.title}
                      onSave={(val) => handleUpdateCard(card.id, 'title', val)}
                    />
                  </h3>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <EditableText
                      value={card.description}
                      onSave={(val) => handleUpdateCard(card.id, 'description', val)}
                      multiline
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
