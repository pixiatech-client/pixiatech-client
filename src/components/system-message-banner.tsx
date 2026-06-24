'use client';

import { useState, useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { SystemMessage } from '@/lib/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Info, CheckCircle, AlertTriangle, AlertOctagon,
  info: Info, success: CheckCircle, warning: AlertTriangle, alert: AlertOctagon,
};

const TYPE_COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-800' },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-800' },
  alert: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', text: 'text-red-800' },
};

export function SystemMessageBanner({ location }: { location: 'homepage' | 'boutique' | 'client-area' }) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/system-messages?active=true&location=${location}`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data.filter((m: SystemMessage) => !m.permanent) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location]);

  if (loading || messages.length === 0) return null;

  return (
    <div className="space-y-2 px-4 md:px-6 max-w-7xl mx-auto w-full">
      {messages.map(msg => {
        if (dismissed.has(msg.id)) return null;
        const colors = TYPE_COLORS[msg.type] || TYPE_COLORS.info;
        const Icon = ICON_MAP[msg.icon] || ICON_MAP[msg.type] || Info;

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 p-3 md:p-4 rounded-xl border ${colors.bg} ${colors.border}`}
            style={msg.color ? { borderLeftColor: msg.color, borderLeftWidth: 4 } : undefined}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} style={msg.color ? { color: msg.color } : undefined} />
            <div className="flex-1 min-w-0">
              {msg.title && (
                <p className={`text-sm font-bold ${colors.text}`} style={msg.color ? { color: msg.color } : undefined}>
                  {msg.title}
                </p>
              )}
              <p className={`text-sm ${colors.text} mt-0.5 whitespace-pre-line`}>
                {msg.content}
              </p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(msg.id))}
              className={`shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors ${colors.text}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
