import React from 'react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { DynamicIcon } from '../ui/DynamicIcon';
import { Edit2, CheckCircle2 } from 'lucide-react';

export const TechFeaturesSection: React.FC = () => {
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

  const features = data.features;

  if (!features.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const handleUpdateItem = (id: string, field: string, value: any) => {
    updateData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.map((it) =>
          it.id === id ? { ...it, [field]: value } : it
        )
      }
    }));
  };

  return (
    <section id="technologies" className={`py-16 bg-[#080a0e] relative border-t border-white/5 ${
      !features.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={features.visible} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={features.badge}
                onSave={(val) => updateField('features', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={features.title}
                onSave={(val) => updateField('features', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={features.subtitle}
                onSave={(val) => updateField('features', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <CardSwitch
            visible={features.visible}
            onToggle={() => toggleSectionVisibility('features')}
            label="Section Technologies"
          />
        </div>

        {/* 2x2 Rich Technical Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.items.map((item) => {
            const isItemHidden = !item.visible;
            if (isItemHidden && (!isEditMode || isVisitorPreview)) {
              return null;
            }

            return (
              <div
                key={item.id}
                className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
                  isItemHidden
                    ? 'bg-red-950/20 border-red-500/40 opacity-50'
                    : 'bg-[#0e111a] border-white/10 hover:border-[#c6ff00]/30 hover:shadow-xl'
                }`}
              >
                <HiddenOverlayBadge visible={item.visible} />

                <div className="flex items-start justify-between gap-4 mb-6">
                  {/* Icon & tag */}
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => {
                        if (isEditMode && !isVisitorPreview) {
                          openIconPicker(item.icon, (newIcon) => {
                            setItemIcon('features', 'items', item.id, newIcon);
                          }, `Choisir l'icône pour ${item.title}`);
                        }
                      }}
                      className={`relative w-14 h-14 rounded-2xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00] shadow-[0_0_20px_rgba(198,255,0,0.15)] ${
                        isEditMode && !isVisitorPreview ? 'cursor-pointer hover:scale-105' : ''
                      }`}
                    >
                      <DynamicIcon name={item.icon} className="w-7 h-7" />
                      {isEditMode && !isVisitorPreview && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#c6ff00] text-black rounded-full flex items-center justify-center text-[10px] shadow">
                          <Edit2 className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#c6ff00] font-semibold">
                        <EditableText
                          value={item.tag}
                          onSave={(val) => handleUpdateItem(item.id, 'tag', val)}
                        />
                      </span>
                    </div>
                  </div>

                  <CardSwitch
                    visible={item.visible}
                    onToggle={() => toggleItemVisibility('features', 'items', item.id)}
                    compact
                  />
                </div>

                <h3 className="font-tech text-lg sm:text-xl font-bold text-white mb-3 tracking-wide">
                  <EditableText
                    value={item.title}
                    onSave={(val) => handleUpdateItem(item.id, 'title', val)}
                  />
                </h3>

                <div className="text-sm text-slate-300 leading-relaxed">
                  <EditableText
                    value={item.description}
                    onSave={(val) => handleUpdateItem(item.id, 'description', val)}
                    multiline
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
