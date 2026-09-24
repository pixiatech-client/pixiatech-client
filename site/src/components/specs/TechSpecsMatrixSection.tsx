import React, { useState } from 'react';
import { Plus, Trash2, Download, Table, Check } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { SpecRow } from '../../types/product';

export const TechSpecsMatrixSection: React.FC = () => {
  const {
    data,
    updateField,
    updateData,
    toggleSectionVisibility,
    toggleItemVisibility,
    isEditMode,
    isVisitorPreview,
    setIsSpecSheetModalOpen
  } = useProduct();

  const specifications = data.specifications;

  const [activeCategory, setActiveCategory] = useState<string>('Tous');

  if (!specifications.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const handleUpdateRow = (id: string, field: keyof SpecRow, value: any) => {
    updateData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        rows: prev.specifications.rows.map((r) =>
          r.id === id ? { ...r, [field]: value } : r
        )
      }
    }));
  };

  const handleAddRow = () => {
    const newId = 'spec-' + Date.now();
    const newRow: SpecRow = {
      id: newId,
      category: 'Général',
      param: 'Nouveau paramètre technique',
      p28: 'Valeur P2.8',
      p39: 'Valeur P3.9',
      p78: 'Valeur P7.8',
      visible: true
    };
    updateData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        rows: [...prev.specifications.rows, newRow]
      }
    }));
  };

  const handleDeleteRow = (id: string) => {
    if (!window.confirm('Supprimer cette ligne technique ?')) return;
    updateData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        rows: prev.specifications.rows.filter((r) => r.id !== id)
      }
    }));
  };

  const categories = ['Tous', 'Optique', 'Performance', 'Structure', 'Énergie', 'Fiabilité', 'Contrôle'];

  const filteredRows = specifications.rows.filter((r) => {
    if (activeCategory === 'Tous') return true;
    return r.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <section id="specifications" className={`py-16 border-t border-white/5 relative ${
      !specifications.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={specifications.visible} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={specifications.badge}
                onSave={(val) => updateField('specifications', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={specifications.title}
                onSave={(val) => updateField('specifications', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={specifications.subtitle}
                onSave={(val) => updateField('specifications', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSpecSheetModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#c6ff00]" />
              <span>Exporter PDF certifié</span>
            </button>
            <CardSwitch
              visible={specifications.visible}
              onToggle={() => toggleSectionVisibility('specifications')}
              label="Section Spécifications"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 text-xs font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategory === cat
                  ? 'bg-[#c6ff00] text-black font-bold shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Specifications Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0c0f16] overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs font-tech text-slate-300 uppercase tracking-wider">
                <th className="py-4 px-6">Paramètre technique</th>
                <th className="py-4 px-6 text-[#c6ff00]">Modèle WP P2.8</th>
                <th className="py-4 px-6 text-[#c6ff00]">Modèle WP P3.91</th>
                <th className="py-4 px-6 text-[#c6ff00]">Modèle WP P7.82</th>
                {isEditMode && !isVisitorPreview && (
                  <th className="py-4 px-6 text-center text-slate-400">Actions Admin</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((row) => {
                const isRowHidden = !row.visible;
                if (isRowHidden && (!isEditMode || isVisitorPreview)) {
                  return null;
                }

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isRowHidden
                        ? 'bg-red-950/20 opacity-50'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-6 font-medium text-white flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                        {row.category}
                      </span>
                      <EditableText
                        value={row.param}
                        onSave={(val) => handleUpdateRow(row.id, 'param', val)}
                      />
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      <EditableText
                        value={row.p28}
                        onSave={(val) => handleUpdateRow(row.id, 'p28', val)}
                      />
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      <EditableText
                        value={row.p39}
                        onSave={(val) => handleUpdateRow(row.id, 'p39', val)}
                      />
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      <EditableText
                        value={row.p78}
                        onSave={(val) => handleUpdateRow(row.id, 'p78', val)}
                      />
                    </td>
                    {isEditMode && !isVisitorPreview && (
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CardSwitch
                            visible={row.visible}
                            onToggle={() => toggleItemVisibility('specifications', 'rows', row.id)}
                            compact
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Row Button in Admin Mode */}
        {isEditMode && !isVisitorPreview && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c6ff00]/10 hover:bg-[#c6ff00]/20 text-[#c6ff00] border border-[#c6ff00]/30 text-xs font-mono font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une ligne technique</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
