'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight, ChevronDown, Send, MessageSquare, User, Shield, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDisputes, updateDisputeStatus, replyToDispute } from '../actions';
import { normalizeSearchText } from '@/lib/utils';
import type { Dispute, DisputeMessage } from '@/lib/types';

const statusConfig: Record<Dispute['status'], { label: string; color: string; icon: any }> = {
  open: { label: 'Ouvert', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
};

const nextStatus: Record<Dispute['status'], Dispute['status']> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: 'open',
};

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LitigesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await getDisputes();
      setDisputes(data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des litiges');
    }
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleStatusUpdate = async (id: string, currentStatus: Dispute['status']) => {
    const next = nextStatus[currentStatus];
    try {
      await updateDisputeStatus(id, next);
      setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: next, updatedAt: new Date().toISOString() } : d));
      toast.success(`Statut passé à "${statusConfig[next].label}"`);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSendingId(id);
    try {
      const msg: DisputeMessage = { sender: 'admin', text: replyText.trim(), createdAt: new Date().toISOString() };
      await replyToDispute(id, replyText.trim());
      setDisputes(prev => prev.map(d =>
        d.id === id ? { ...d, messages: [...(d.messages || []), msg], status: 'in_progress', updatedAt: new Date().toISOString() } : d
      ));
      setReplyText('');
      toast.success('Réponse envoyée');
    } catch {
      toast.error('Erreur lors de l\'envoi');
    }
    setSendingId(null);
  };

  const q = normalizeSearchText(search);
  const filtered = disputes.filter(d =>
    normalizeSearchText(d.customerEmail).includes(q) ||
    normalizeSearchText(d.reason).includes(q)
  );

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--theme-page-bg)', color: 'var(--theme-sidebar-text)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--theme-sidebar-text)' }}>
              Litiges clients
            </h1>
            <p className="mt-1 text-sm opacity-60">Gérez les litiges ouverts par les clients</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDisputes}
            disabled={loading}
            className="gap-2 text-xs font-semibold rounded-xl border-gray-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par email ou motif..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 rounded-xl border-gray-200 bg-white"
          />
        </div>

        <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-8"></TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-gray-500">Client</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-gray-500">Motif</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-gray-500">Statut</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-gray-500 hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">Chargement...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">Aucun litige trouvé</TableCell>
                </TableRow>
              ) : filtered.map((dispute, i) => {
                const StatusIcon = statusConfig[dispute.status].icon;
                const isOpen = expandedId === dispute.id;
                return (
                  <motion.tr
                    key={dispute.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <TableCell>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : dispute.id)}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      <Link
                        href={`/admin/membres?email=${encodeURIComponent(dispute.customerEmail)}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {dispute.customerEmail}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[180px]">{dispute.reason}</span>
                        {(!dispute.messages || dispute.messages.length <= 1) && dispute.status !== 'closed' && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                            En attente
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-xs font-bold ${statusConfig[dispute.status].color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[dispute.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm hidden lg:table-cell">{formatDate(dispute.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isOpen ? null : dispute.id)}
                          className="gap-1 text-xs font-bold text-gray-500 hover:text-gray-900"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {(dispute.messages?.length || 0) > 1 ? 'Répondre' : 'Traiter'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(dispute.id, dispute.status)}
                          className="gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {nextStatus[dispute.status] === 'in_progress' ? 'Prendre' :
                           nextStatus[dispute.status] === 'resolved' ? 'Résoudre' :
                           nextStatus[dispute.status] === 'closed' ? 'Fermer' : 'Rouvrir'}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <AnimatePresence>
          {expandedId && (
            <motion.div
              key={expandedId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              {(() => {
                const dispute = disputes.find(d => d.id === expandedId);
                if (!dispute) return null;
                const msgs = dispute.messages || [];
                return (
                  <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      Conversation — {dispute.customerEmail}
                    </h3>

                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {msgs.length === 0 && (
                        <p className="text-sm text-gray-400 italic">Aucun message</p>
                      )}
                      {msgs.map((msg, idx) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                {isAdmin ? <Shield className="h-3 w-3 opacity-70" /> : <User className="h-3 w-3 opacity-70" />}
                                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                                  {isAdmin ? 'Moi' : 'Client'}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              <p className={`text-[10px] mt-1.5 opacity-60 ${isAdmin ? 'text-right' : ''}`}>
                                {formatDate(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {dispute.status !== 'closed' && (
                      <div className="flex gap-3">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Écrire une réponse..."
                          rows={2}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                        />
                        <Button
                          onClick={() => handleReply(dispute.id)}
                          disabled={!replyText.trim() || sendingId === dispute.id}
                          className="self-end gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
                        >
                          {sendingId === dispute.id ? 'Envoi...' : 'Envoyer'}
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
