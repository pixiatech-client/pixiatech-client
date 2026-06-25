'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, X, Check, Info, CheckCircle, AlertTriangle, AlertOctagon, Bell, Home, Store, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminT } from '@/hooks/useAdminT';
import { useI18n } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { SystemMessage, SystemMessageType } from '@/lib/types';

function getTypeIcon(type: string) {
  const icons: Record<string, typeof Info> = { info: Info, success: CheckCircle, warning: AlertTriangle, alert: AlertOctagon };
  return icons[type] || Info;
}

const TYPE_OPTIONS = [
  { value: 'info' as SystemMessageType, label: 'Information', icon: Info, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'success' as SystemMessageType, label: 'Succès', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'warning' as SystemMessageType, label: 'Avertissement', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'alert' as SystemMessageType, label: 'Alerte', icon: AlertOctagon, color: 'bg-red-100 text-red-700 border-red-300' },
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
  permanent: false,
};

export default function AlertesSystemePage() {
  const { t } = useI18n();
  const { t: nt } = useAdminT();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<SystemMessage | null>(null);

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
    setShowForm(true);
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
      permanent: msg.permanent,
    });
    setEditingId(msg.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(t('admin.systemAlerts.titleRequired'));
      return;
    }

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
      setShowForm(false);
      setEditingId(null);
      loadMessages();
    } catch (err: any) {
      toast.error(err.message);
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

  const locationLabel = (msg: SystemMessage) => {
    const labels: string[] = [];
    if (msg.showHomepage) labels.push(t('admin.systemAlerts.locationHomepage'));
    if (msg.showBoutique) labels.push(t('admin.systemAlerts.locationShop'));
    if (msg.showClientArea) labels.push(t('admin.systemAlerts.locationClientArea'));
    return labels.join(', ') || t('admin.systemAlerts.none');
  };

  const typeInfo = (type: string) => TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0];
  const getInfoIcon = (type: string) => getTypeIcon(type);

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
        
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-gray-200 shadow-inner">
                <Bell className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('admin.systemAlerts.noAlerts')}</h3>
              <p className="mt-2 text-sm text-gray-500">{t('admin.systemAlerts.createFirst')}</p>
            </div>
          )}

          {messages.map(msg => {
            const info = typeInfo(msg.type);
            const Icon = getInfoIcon(msg.type);
            const isPermanent = msg.permanent;

            return (
              <div key={msg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`flex items-center gap-3 shrink-0 px-3 py-2 rounded-xl border ${info.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{info.label}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{msg.title}</h3>
                      {isPermanent && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          {t('admin.systemAlerts.permanent')}
                        </span>
                      )}
                      {msg.permanent && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          B2B/B2C
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{msg.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 pointer-events-auto max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingId ? t('admin.systemAlerts.editMessage') : t('admin.systemAlerts.newMessage')}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.type')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TYPE_OPTIONS.map(opt => {
                        const isActive = form.type === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                              isActive
                                ? `${opt.color} shadow-sm`
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {getTypeIcon(opt.value)({ className: 'w-4 h-4' })}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

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

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.customColor')}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.color || '#3B82F6'}
                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={form.color}
                        onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
                        placeholder="#HEX ou laisser vide"
                      />
                      {form.color && (
                        <button
                          onClick={() => setForm(f => ({ ...f, color: '' }))}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('admin.systemAlerts.displayLocations')}</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showHomepage}
                          onChange={e => setForm(f => ({ ...f, showHomepage: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            <Home className="w-4 h-4 text-gray-400" />
                            {t('admin.systemAlerts.homepage')}
                          </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showBoutique}
                          onChange={e => setForm(f => ({ ...f, showBoutique: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            <Store className="w-4 h-4 text-gray-400" />
                            {t('admin.systemAlerts.boutique')}
                          </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showClientArea}
                          onChange={e => setForm(f => ({ ...f, showClientArea: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="w-4 h-4 text-gray-400" />
                            {t('admin.systemAlerts.clientArea')}
                          </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
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

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg"
                    >
                      <Check className="w-4 h-4 inline mr-1.5" />
                      {editingId ? t('admin.systemAlerts.update') : t('admin.systemAlerts.create')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

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
