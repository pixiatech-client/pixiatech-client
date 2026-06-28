'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Eye, X, Check, Info, CheckCircle, AlertTriangle, AlertOctagon, Bell, Building2, Home, Store, User, RefreshCw, Calendar, Globe, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { SystemMessage, SystemMessageType } from '@/lib/types';

function getTypeIcon(type: string) {
  const icons: Record<string, typeof Info> = { info: Info, success: CheckCircle, warning: AlertTriangle, alert: AlertOctagon };
  return icons[type] || Info;
}

const TYPE_COLORS = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-800' },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-800' },
  alert: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', text: 'text-red-800' },
};

const TYPE_OPTIONS = [
  { value: 'info' as SystemMessageType, label: 'Information', icon: Info },
  { value: 'success' as SystemMessageType, label: 'Succès', icon: CheckCircle },
  { value: 'warning' as SystemMessageType, label: 'Avertissement', icon: AlertTriangle },
  { value: 'alert' as SystemMessageType, label: 'Alerte', icon: AlertOctagon },
];

const ICON_OPTIONS = [
  { value: 'Info', label: 'Info' },
  { value: 'CheckCircle', label: 'Succès' },
  { value: 'AlertTriangle', label: 'Attention' },
  { value: 'AlertOctagon', label: 'Danger' },
  { value: 'Bell', label: 'Cloche' },
];

const defaultForm: Omit<SystemMessage, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'info',
  title: '',
  content: '',
  color: '',
  icon: 'Info',
  active: true,
  showHomepage: false,
  showBoutique: false,
  showClientArea: false,
  showAllPages: false,
  startDate: null,
  endDate: null,
  permanent: false,
};

export default function AlertesSystemePage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<SystemMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [b2bForm, setB2bForm] = useState({ title: '', content: '', active: true, showHomepage: true, showBoutique: true, showClientArea: true });
  const [b2bSaving, setB2bSaving] = useState(false);
  const [b2bOpen, setB2bOpen] = useState(false);

  const b2bMsg = useMemo(() => messages.find(m => m.id === 'b2b-profile'), [messages]);

  useEffect(() => {
    if (b2bMsg) {
      setB2bForm({ title: b2bMsg.title, content: b2bMsg.content, active: b2bMsg.active, showHomepage: b2bMsg.showHomepage, showBoutique: b2bMsg.showBoutique, showClientArea: b2bMsg.showClientArea });
    }
  }, [b2bMsg]);

  const handleB2bSave = async () => {
    if (!b2bForm.title.trim()) return;
    setB2bSaving(true);
    try {
      const res = await fetch('/api/system-messages/b2b-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b2bForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Message B2B mis à jour');
      loadMessages();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setB2bSaving(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/system-messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('admin.systemAlerts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowSheet(true);
  };

  const openEdit = (msg: SystemMessage) => {
    setForm({
      type: msg.type,
      title: msg.title,
      content: msg.content,
      color: msg.color,
      icon: msg.icon,
      active: msg.active,
      showHomepage: msg.showHomepage,
      showBoutique: msg.showBoutique,
      showClientArea: msg.showClientArea,
      showAllPages: msg.showAllPages,
      startDate: msg.startDate,
      endDate: msg.endDate,
      permanent: msg.permanent,
    });
    setEditingId(msg.id);
    setShowSheet(true);
  };

  // Live preview data derived from current form
  const livePreview = useMemo(() => {
    const Icon = getTypeIcon(form.icon);
    return { Icon, typeInfo: TYPE_OPTIONS.find(o => o.value === form.type) || TYPE_OPTIONS[0] };
  }, [form.type, form.icon]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(t('admin.systemAlerts.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/system-messages/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success(t('admin.systemAlerts.updated'));
      } else {
        const res = await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success(t('admin.systemAlerts.created'));
      }
      setShowSheet(false);
      setEditingId(null);
      loadMessages();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/system-messages/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(t('admin.systemAlerts.deleted'));
      setDeleteId(null);
      loadMessages();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (msg: SystemMessage) => {
    try {
      await fetch(`/api/system-messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !msg.active }),
      });
      loadMessages();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const typeInfo = (type: string) => TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--theme-page-bg)', color: 'var(--theme-sidebar-text)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('admin.systemAlerts.title')}</h1>
            <p className="mt-1 text-sm opacity-60">{t('admin.systemAlerts.subtitle')}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            {t('admin.systemAlerts.newMessage')}
          </button>
        </div>

        {/* B2B Profile Message - Accordion */}
        <div className="mb-6 rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-purple-50/80 to-indigo-50/40 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => setB2bOpen(!b2bOpen)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-purple-50/50 transition-colors -m-2 p-2 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900">Espace réservé aux professionnels (B2B)</h2>
                <p className="text-xs text-gray-500 truncate">{b2bForm.content || 'Message B2B/B2C'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${b2bOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                const next = !b2bForm.active;
                setB2bForm(f => ({ ...f, active: next }));
                try {
                  await fetch('/api/system-messages/b2b-profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: next }),
                  });
                  loadMessages();
                } catch { toast.error(t('common.error')); }
              }}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0 ${b2bForm.active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${b2bForm.active ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          {b2bOpen && (
            <div className="px-4 pb-4 space-y-4">
              <div className="h-px bg-purple-200/60" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Titre</label>
                  <input
                    type="text"
                    value={b2bForm.title}
                    onChange={e => setB2bForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-purple-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Contenu</label>
                  <textarea
                    value={b2bForm.content}
                    onChange={e => setB2bForm(f => ({ ...f, content: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none min-h-[60px]"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={b2bForm.showHomepage} onChange={e => setB2bForm(f => ({ ...f, showHomepage: e.target.checked }))} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <Home className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Homepage</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={b2bForm.showBoutique} onChange={e => setB2bForm(f => ({ ...f, showBoutique: e.target.checked }))} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <Store className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Boutique</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={b2bForm.showClientArea} onChange={e => setB2bForm(f => ({ ...f, showClientArea: e.target.checked }))} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Espace client</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleB2bSave}
                  disabled={b2bSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all"
                >
                  {b2bSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {messages.filter(m => m.id !== 'b2b-profile').length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-gray-200 shadow-inner">
                <Bell className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('admin.systemAlerts.noAlerts')}</h3>
              <p className="mt-2 text-sm text-gray-500">{t('admin.systemAlerts.createFirst')}</p>
            </div>
          )}

          {messages.filter(m => m.id !== 'b2b-profile').map(msg => {
            const iconInfo = typeInfo(msg.type);
            const colors = TYPE_COLORS[msg.type] || TYPE_COLORS.info;
            const Icon = getTypeIcon(msg.type);
            const isPermanent = msg.permanent;
            const hasSchedule = msg.startDate || msg.endDate;

            return (
              <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`flex items-center gap-3 shrink-0 px-3 py-2 rounded-xl border ${colors.bg} ${colors.icon} ${colors.border}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{iconInfo.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{msg.title}</h3>
                      {msg.showAllPages && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          <Globe className="w-3 h-3 inline mr-0.5" />
                          {t('admin.systemAlerts.showAllPages')}
                        </span>
                      )}
                      {isPermanent && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          {t('admin.systemAlerts.permanent')}
                        </span>
                      )}
                      {hasSchedule && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <Calendar className="w-3 h-3 inline mr-0.5" />
                          Planifié
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{msg.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {msg.showAllPages ? (
                        <span className="flex items-center gap-1 text-blue-500">
                          <Globe className="w-3 h-3" />
                          {t('admin.systemAlerts.showAllPages')}
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {msg.showHomepage ? t('common.yes') : t('common.no')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {msg.showBoutique ? t('common.yes') : t('common.no')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {msg.showClientArea ? t('common.yes') : t('common.no')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(msg)}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${msg.active ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${msg.active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>

                    <button
                      onClick={() => setPreviewMsg(msg)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('common.preview')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEdit(msg)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                      title={t('common.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {!isPermanent && (
                      <button
                        onClick={() => setDeleteId(msg.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sheet Drawer - Form */}
        <Sheet open={showSheet} onOpenChange={(o) => { if (!o) { setShowSheet(false); setEditingId(null); } }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5">
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-bold text-gray-900">
                  {editingId ? t('admin.systemAlerts.editMessage') : t('admin.systemAlerts.newMessage')}
                </SheetTitle>
              </SheetHeader>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Live Preview */}
              {form.title || form.content ? (
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-3">{t('admin.systemAlerts.preview')}</p>
                  {(() => {
                    const previewColors = TYPE_COLORS[form.type] || TYPE_COLORS.info;
                    return (
                      <div
                        className={`p-3 rounded-xl border ${form.color ? '' : `${previewColors.bg} ${previewColors.border}`}`}
                        style={{
                          backgroundColor: form.color ? `${form.color}15` : undefined,
                          borderColor: form.color || undefined,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <livePreview.Icon
                            className={`w-5 h-5 mt-0.5 shrink-0 ${form.color ? '' : previewColors.icon}`}
                            style={{ color: form.color || undefined } as React.CSSProperties}
                          />
                          <div className="min-w-0">
                            {form.title && (
                              <p className={`text-sm font-bold ${form.color ? 'text-gray-900' : previewColors.text}`}>{form.title}</p>
                            )}
                            {form.content && (
                              <p className={`text-sm mt-0.5 whitespace-pre-line ${form.color ? 'text-gray-600' : previewColors.text}`}>{form.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-400">{t('admin.systemAlerts.previewDesc')}</p>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map(opt => {
                    const isActive = form.type === opt.value;
                    const colors = TYPE_COLORS[opt.value] || TYPE_COLORS.info;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          isActive
                            ? `${colors.bg} ${colors.icon} ${colors.border} shadow-sm`
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {(() => { const Icon = getTypeIcon(opt.value); return <Icon className="w-4 h-4" />; })()}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.icon')}</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(opt => {
                    const Icon = getTypeIcon(opt.value);
                    const isActive = form.icon === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, icon: opt.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                          isActive
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.title')}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder={t('admin.systemAlerts.titlePlaceholder')}
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.content')}</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none min-h-[80px]"
                  placeholder={t('admin.systemAlerts.contentPlaceholder')}
                  rows={3}
                />
              </div>

              {/* Custom Color */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.customColor')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color || '#3B82F6'}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 shrink-0"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                    placeholder="#HEX"
                  />
                  {form.color && (
                    <button
                      onClick={() => setForm(f => ({ ...f, color: '' }))}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Display Locations */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.displayLocations')}</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-blue-200 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/50">
                    <input
                      type="checkbox"
                      checked={form.showAllPages}
                      onChange={e => setForm(f => ({
                        ...f,
                        showAllPages: e.target.checked,
                        showHomepage: e.target.checked,
                        showBoutique: e.target.checked,
                        showClientArea: e.target.checked,
                      }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <Globe className="w-4 h-4 text-blue-500" />
                        {t('admin.systemAlerts.showAllPages')}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">Afficher sur toutes les pages du site</p>
                    </div>
                  </label>

                  <div className="space-y-1">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-gray-300 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/50 ${form.showAllPages ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.showHomepage}
                        onChange={e => setForm(f => ({ ...f, showHomepage: e.target.checked }))}
                        disabled={form.showAllPages}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <Home className="w-4 h-4 text-gray-400" />
                          {t('admin.systemAlerts.homepage')}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{t('admin.systemAlerts.homepageDesc')}</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-gray-300 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/50 ${form.showAllPages ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.showBoutique}
                        onChange={e => setForm(f => ({ ...f, showBoutique: e.target.checked }))}
                        disabled={form.showAllPages}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <Store className="w-4 h-4 text-gray-400" />
                          {t('admin.systemAlerts.boutique')}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{t('admin.systemAlerts.boutiqueDesc')}</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-gray-300 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/50 ${form.showAllPages ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.showClientArea}
                        onChange={e => setForm(f => ({ ...f, showClientArea: e.target.checked }))}
                        disabled={form.showAllPages}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                          <User className="w-4 h-4 text-gray-400" />
                          {t('admin.systemAlerts.clientArea')}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{t('admin.systemAlerts.clientAreaDesc')}</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.scheduling')}</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{t('admin.systemAlerts.startDate')}</p>
                    <input
                      type="date"
                      value={form.startDate?.split('T')[0] || ''}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{t('admin.systemAlerts.endDate')}</p>
                    <input
                      type="date"
                      value={form.endDate?.split('T')[0] || ''}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : null }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  {(form.startDate || form.endDate) && (
                    <button
                      onClick={() => setForm(f => ({ ...f, startDate: null, endDate: null }))}
                      className="self-end px-3 py-2.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors"
                    >
                      {t('admin.systemAlerts.clearSchedule')}
                    </button>
                  )}
                </div>
                {!form.startDate && !form.endDate && (
                  <p className="text-xs text-gray-400 mt-1">{t('admin.systemAlerts.noSchedule')}</p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 pb-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('admin.systemAlerts.active')}</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={() => { setShowSheet(false); setEditingId(null); }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4 inline mr-1.5" />
                  {saving ? t('common.loading') : (editingId ? t('admin.systemAlerts.update') : t('admin.systemAlerts.create'))}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Preview Modal */}
        {previewMsg && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setPreviewMsg(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{t('common.preview')}</h2>
                  <button onClick={() => setPreviewMsg(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 rounded-xl border" style={{
                  backgroundColor: previewMsg.color ? `${previewMsg.color}15` : undefined,
                  borderColor: previewMsg.color || undefined,
                }}>
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = getTypeIcon(previewMsg.icon);
                      return <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: previewMsg.color || undefined } as React.CSSProperties} />;
                    })()}
                    <div>
                      <p className="text-sm font-bold text-gray-900">{previewMsg.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{previewMsg.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(o) => { if (!o) setDeleteId(null); }}
          title={t('admin.systemAlerts.deleteTitle')}
          description={t('admin.systemAlerts.deleteConfirm')}
          confirmText={t('common.delete')}
          headerColor="bg-red-600"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          icon={<Trash2 className="w-6 h-6 text-white" />}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
