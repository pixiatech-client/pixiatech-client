import React from 'react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { DynamicIcon } from '../ui/DynamicIcon';
import { Edit2, ArrowUpRight } from 'lucide-react';

export const ApplicationsGallerySection: React.FC = () => {
  const {
    data,
    updateField,
    updateData,
    toggleSectionVisibility,
    toggleItemVisibility,
    setItemIcon,
    openIconPicker,
    isEditMode,
    isVisitorPreview,
    setIsQuoteModalOpen
  } = useProduct();

  const applications = data.applications;

  if (!applications.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const handleUpdateCase = (id: string, field: string, value: any) => {
    updateData((prev) => ({
      ...prev,
      applications: {
        ...prev.applications,
        cases: prev.applications.cases.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        )
      }
    }));
  };

  return (
    <section id="applications" className={`py-16 bg-[#080a0e] border-t border-white/5 relative ${
      !applications.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={applications.visible} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={applications.badge}
                onSave={(val) => updateField('applications', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={applications.title}
                onSave={(val) => updateField('applications', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={applications.subtitle}
                onSave={(val) => updateField('applications', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <CardSwitch
            visible={applications.visible}
            onToggle={() => toggleSectionVisibility('applications')}
            label="Section Applications"
          />
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.cases.map((appCase) => {
            const isItemHidden = !appCase.visible;
            if (isItemHidden && (!isEditMode || isVisitorPreview)) {
              return null;
            }

            return (
              <div
                key={appCase.id}
                className={`relative group p-6 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isItemHidden
                    ? 'bg-red-950/20 border-red-500/40 opacity-50'
                    : 'bg-[#0e111a] border-white/10 hover:border-[#c6ff00]/30 hover:shadow-2xl'
                }`}
              >
                <HiddenOverlayBadge visible={appCase.visible} />

                <div>
                  {/* Top: Sector & Switch */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        <EditableText
                          value={appCase.sector}
                          onSave={(val) => handleUpdateCase(appCase.id, 'sector', val)}
                        />
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#c6ff00]/10 text-[#c6ff00] border border-[#c6ff00]/30 font-bold">
                        <EditableText
                          value={appCase.badge}
                          onSave={(val) => handleUpdateCase(appCase.id, 'badge', val)}
                        />
                      </span>
                    </div>

                    <CardSwitch
                      visible={appCase.visible}
                      onToggle={() => toggleItemVisibility('applications', 'cases', appCase.id)}
                      compact
                    />
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      onClick={() => {
                        if (isEditMode && !isVisitorPreview) {
                          openIconPicker(appCase.icon, (newIcon) => {
                            setItemIcon('applications', 'cases', appCase.id, newIcon);
                          }, `Choisir l'icône pour ${appCase.title}`);
                        }
                      }}
                      className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c6ff00] ${
                        isEditMode && !isVisitorPreview ? 'cursor-pointer hover:border-[#c6ff00]' : ''
                      }`}
                    >
                      <DynamicIcon name={appCase.icon} className="w-5 h-5" />
                    </div>
                    <h3 className="font-tech text-lg sm:text-xl font-bold text-white tracking-wide">
                      <EditableText
                        value={appCase.title}
                        onSave={(val) => handleUpdateCase(appCase.id, 'title', val)}
                      />
                    </h3>
                  </div>

                  {/* Description */}
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    <EditableText
                      value={appCase.description}
                      onSave={(val) => handleUpdateCase(appCase.id, 'description', val)}
                      multiline
                    />
                  </div>
                </div>

                {/* Bottom: Key Impact Stat & CTA */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs font-mono text-[#c6ff00] font-semibold flex items-center gap-1.5">
                    <EditableText
                      value={appCase.stats}
                      onSave={(val) => handleUpdateCase(appCase.id, 'stats', val)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="text-xs text-slate-400 group-hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Étudier ce cas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
