'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Search, Mail, Phone, Check, Trash2, Calendar, Clock, LifeBuoy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMembers, getResellerLeads, markResellerLeadNotified, deleteResellerLead, getDisputes, connectAsClient, type Member, type ResellerLead } from '../actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Dispute } from '@/lib/types';

type Tab = 'membres' | 'fournisseurs';

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MembresPage() {
  const [tab, setTab] = useState<Tab>('membres');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [leads, setLeads] = useState<ResellerLead[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('email') || '');

  const openDisputeEmails = new Set(
    disputes.filter(d => d.status === 'open' || d.status === 'in_progress').map(d => d.customerEmail)
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, l, d] = await Promise.all([getMembers(), getResellerLeads(), getDisputes()]);
      setMembers(m);
      setLeads(l);
      setDisputes(d);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkNotified = async (id: string) => {
    await markResellerLeadNotified(id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notified: true } : l));
    toast.success('Marqué comme notifié');
  };

  const handleDeleteLead = async (id: string) => {
    await deleteResellerLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead supprimé');
  };

  const filteredMembers = members.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLeads = leads.filter(l =>
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Espace membre</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            Actualiser
          </Button>
          <Link
            href="/admin/litiges"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Litiges
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex w-full max-w-md rounded-xl bg-slate-100/70 border border-slate-200 h-11 p-1">
        <button
          onClick={() => setTab('membres')}
          className={`relative w-full flex justify-center font-semibold px-4 py-2 text-[11px] uppercase tracking-widest items-center gap-2 z-20 transition-colors duration-200 ${
            tab === 'membres' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab === 'membres' && (
            <motion.span layoutId="pill" transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="absolute inset-0 z-10 bg-slate-900 rounded-lg shadow-sm" />
          )}
          <Users size={13} className="z-20" />
          <span className="z-20">Membres</span>
          <span className={`z-20 inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold leading-none ${
            tab === 'membres' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
          }`}>{members.length}</span>
        </button>
        <button
          onClick={() => setTab('fournisseurs')}
          className={`relative w-full flex justify-center font-semibold px-4 py-2 text-[11px] uppercase tracking-widest items-center gap-2 z-20 transition-colors duration-200 ${
            tab === 'fournisseurs' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab === 'fournisseurs' && (
            <motion.span layoutId="pill" transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="absolute inset-0 z-10 bg-slate-900 rounded-lg shadow-sm" />
          )}
          <Store size={13} className="z-20" />
          <span className="z-20">Fournisseurs</span>
          <span className={`z-20 inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold leading-none ${
            tab === 'fournisseurs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
          }`}>{leads.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={tab === 'membres' ? 'Rechercher un membre...' : 'Rechercher un email...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Membres tab */}
      {tab === 'membres' && (
        <Card className="rounded-xl border border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-500">Nom</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Téléphone</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Inscrit le</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Dernière connexion</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-slate-400">Chargement...</TableCell></TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-slate-400">Aucun membre trouvé</TableCell></TableRow>
                ) : filteredMembers.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {m.displayName || '-'}
                        {openDisputeEmails.has(m.email) && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shrink-0">
                            Litige
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail size={12} className="text-slate-400" /> {m.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone size={12} className="text-slate-400" /> {m.phone || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(m.createdAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(m.lastLoginAt)}</TableCell>
                    <TableCell className="text-right">
                      <form action={connectAsClient.bind(null, m.id!, m.email)}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Connexion
                        </button>
                      </form>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Fournisseurs tab */}
      {tab === 'fournisseurs' && (
        <Card className="rounded-xl border border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Date d'inscription</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Statut</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs text-slate-400">Chargement...</TableCell></TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs text-slate-400">Aucune inscription</TableCell></TableRow>
                ) : filteredLeads.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail size={12} className="text-slate-400" /> {l.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(l.createdAt)}</TableCell>
                    <TableCell>
                      {l.notified ? (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Notifié</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!l.notified && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkNotified(l.id)}
                            className="w-7 h-7 text-green-600 hover:text-green-700 hover:bg-green-50" title="Marquer comme notifié">
                            <Check size={13} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLead(l.id)}
                          className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50" title="Supprimer">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MembresPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Chargement...</div>}>
      <MembresPage />
    </Suspense>
  );
}
