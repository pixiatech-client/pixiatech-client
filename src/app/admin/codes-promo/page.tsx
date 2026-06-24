'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Copy, Check, Percent, Euro, Edit2, AlertTriangle } from 'lucide-react';
import { Pagination } from '@/components/pagination';

interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  assignedTo: string;
  assignedType: 'influencer' | 'collaborator';
  maxUses: number;
  currentUses: number;
  minPurchase: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

const PAGE_SIZE = 8;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const emptyForm = {
  code: '', type: 'percentage' as 'percentage' | 'fixed', value: '',
  assignedTo: '', assignedType: 'collaborator' as 'influencer' | 'collaborator',
  maxUses: '', minPurchase: '', expiresAt: '',
};

export default function CodesPromoPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promo/list');
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch { setCodes([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const totalPages = Math.ceil(codes.length / PAGE_SIZE);
  const paginated = codes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const openEdit = (pc: PromoCode) => {
    setForm({
      code: pc.code, type: pc.type, value: String(pc.value),
      assignedTo: pc.assignedTo, assignedType: pc.assignedType,
      maxUses: String(pc.maxUses), minPurchase: String(pc.minPurchase),
      expiresAt: pc.expiresAt ? pc.expiresAt.split('T')[0] : '',
    });
    setEditing(pc.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.value) return;
    const url = editing ? '/api/promo/update' : '/api/promo/create';
    const method = editing ? 'PATCH' : 'POST';
    const body: any = editing
      ? { id: editing, ...form }
      : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      resetForm();
      fetchCodes();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/promo/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setConfirmDelete(null);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  const toggleActive = async (pc: PromoCode) => {
    await fetch('/api/promo/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pc.id, active: !pc.active }),
    });
    setCodes(prev => prev.map(c => c.id === pc.id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes Promo</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les codes promotionnels pour influenceurs et collaborateurs</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all">
          <Plus size={16} /> Nouveau code
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{editing ? 'Modifier le code' : 'Nouveau code promo'}</h3>
            <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-900 font-semibold">Annuler</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Code *</label>
              <input type="text" placeholder="EX: PROMO10" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {[ { value: 'percentage' as const, label: 'Pourcentage', icon: Percent }, { value: 'fixed' as const, label: 'Montant fixe', icon: Euro } ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, type: opt.value }))} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${form.type === opt.value ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    <opt.icon size={14} /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Valeur {form.type === 'percentage' ? '(%)' : '(€)'} *</label>
              <input type="number" placeholder={form.type === 'percentage' ? '10' : '5'} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Assigné à</label>
              <input type="text" placeholder="Nom influenceur / collaborateur" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {[ { value: 'collaborator' as const, label: 'Collaborateur' }, { value: 'influencer' as const, label: 'Influenceur' } ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, assignedType: opt.value }))} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${form.assignedType === opt.value ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Expire le</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Utilisations max (0 = illimité)</label>
              <input type="number" placeholder="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Achat min. (€)</label>
              <input type="number" placeholder="0" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all">
              {editing ? 'Enregistrer' : 'Créer le code'}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Annuler</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Tag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Aucun code promo pour le moment</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(pc => {
              const expired = pc.expiresAt && new Date(pc.expiresAt) < new Date();
              const exhausted = pc.maxUses > 0 && pc.currentUses >= pc.maxUses;
              const inactive = !pc.active || expired || exhausted;
              return (
                <div key={pc.id} className={`bg-white border rounded-2xl p-5 transition-all ${inactive ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inactive ? 'bg-gray-100' : 'bg-emerald-50'}`}>
                        <Tag size={18} className={inactive ? 'text-gray-400' : 'text-emerald-600'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900 tracking-wider">{pc.code}</span>
                          <button onClick={() => copyCode(pc.code)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            {copied === pc.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                          <span className={pc.type === 'percentage' ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
                            {pc.type === 'percentage' ? `${pc.value}%` : `${pc.value}€`}
                          </span>
                          {pc.assignedTo && <span>Assigné à <strong>{pc.assignedTo}</strong> ({pc.assignedType === 'influencer' ? 'Influenceur' : 'Collaborateur'})</span>}
                          <span>Utilisé {pc.currentUses}/{pc.maxUses || '∞'}</span>
                          {pc.minPurchase > 0 && <span>Min. {pc.minPurchase}€</span>}
                          {pc.expiresAt && <span>Expire {formatDate(pc.expiresAt)}{expired ? ' (expiré)' : ''}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expired ? (
                        <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700">Expiré</span>
                      ) : exhausted ? (
                        <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700">Épuisé</span>
                      ) : (
                        <button
                          onClick={() => toggleActive(pc)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${pc.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {pc.active ? 'Actif' : 'Inactif'}
                        </button>
                      )}
                      <button onClick={() => openEdit(pc)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={14} className="text-gray-400" />
                      </button>
                      {confirmDelete === pc.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(pc.id)} className="p-2 bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <AlertTriangle size={14} className="text-gray-400" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(pc.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination current={page} total={codes.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}
    </div>
  );
}
