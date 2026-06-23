'use client';

import { useState, useEffect } from 'react';
import { User, Shield, Send } from 'lucide-react';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ClientDisputeConversation({
  disputeId,
  messages: initialMessages,
  isClosed,
}: {
  disputeId: string;
  messages: Array<{ sender: string; text: string; createdAt: string }>;
  isClosed: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/boutique/litige/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId }),
    }).catch(() => {});
  }, [disputeId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/boutique/litige/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, text: text.trim() }),
      });
      if (!res.ok) throw new Error('Erreur');
      const msg = { sender: 'customer', text: text.trim(), createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch {
      // silent
    }
    setSending(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Aucun message</p>
        )}
        {messages.map((msg, i) => {
          const isAdmin = msg.sender === 'admin';
          return (
            <div key={i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isAdmin ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {isAdmin ? <Shield className="h-3 w-3 opacity-70" /> : <User className="h-3 w-3 opacity-70" />}
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    {isAdmin ? 'Support' : 'Moi'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 opacity-60 ${isAdmin ? '' : 'text-right'}`}>
                  {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <form onSubmit={handleSend} className="border-t border-gray-100 p-4 flex gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Votre réponse..."
            rows={2}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="self-end px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            {sending ? 'Envoi...' : 'Envoyer'}
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
