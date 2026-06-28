'use client';

import { useState, useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import type { SystemMessage } from '@/lib/types';

const DISMISSED_KEY = 'dismissed-system-alerts';

function getDismissedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissedId(id: string) {
  try {
    const ids = getDismissedIds();
    if (!ids.includes(id)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids, id]));
    }
  } catch {}
}

function getIcon(name: string) {
  const icons: Record<string, typeof Info> = {
    Info, CheckCircle, AlertTriangle, AlertOctagon,
    info: Info, success: CheckCircle, warning: AlertTriangle, alert: AlertOctagon,
  };
  return icons[name] || Info;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-800' },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-800' },
  alert: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', text: 'text-red-800' },
};

export function SystemMessageBanner({ location }: { location: 'homepage' | 'boutique' | 'client-area' }) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
    fetch(`/api/system-messages?active=true&location=${location}`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data.filter((m: SystemMessage) => !m.permanent) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location]);

  const visible = messages.filter(m => !dismissedIds.includes(m.id));

  if (loading || visible.length === 0) return null;

  const msg = visible[0];
  const colors = TYPE_COLORS[msg.type] || TYPE_COLORS.info;
  const Icon = getIcon(msg.icon);

  const handleDismiss = () => {
    addDismissedId(msg.id);
    setDismissedIds(prev => [...prev, msg.id]);
  };

  return (
    <div className="space-y-2 px-4 md:px-6 max-w-7xl mx-auto w-full">
      <div
        className={`flex items-start gap-3 p-3 md:p-4 rounded-xl border ${colors.bg} ${colors.border}`}
        style={msg.color ? { borderLeftColor: msg.color, borderLeftWidth: 4 } : undefined}
      >
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} style={msg.color ? { color: msg.color } as React.CSSProperties : undefined} />
        <div className="flex-1 min-w-0">
          {msg.title && (
            <p className={`text-sm font-bold ${colors.text}`} style={msg.color ? { color: msg.color } as React.CSSProperties : undefined}>
              {msg.title}
            </p>
          )}
          <p className={`text-sm ${colors.text} mt-0.5 whitespace-pre-line`}>
            {msg.content}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-all mt-0.5"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
