'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Search, Mail, Phone, Check, Trash2, LifeBuoy, MoreHorizontal, Ban, PauseCircle, RotateCcw, CheckSquare, Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { cn, normalizeSearchText } from '@/lib/utils';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';
import {
  getMembersFirstPage,
  getMembersNextPage,
  searchMembers,
  getResellerLeads,
  markResellerLeadNotified,
  deleteResellerLead,
  connectAsClient,
  updateCustomerStatus,
  deleteCustomer,
  bulkUpdateCustomerStatus,
  bulkDeleteCustomers,
  getOpenDisputeEmails,
  type Member,
  type MembersCursor,
  type ResellerLead,
  type CustomerStatus,
} from '../actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Tab = 'membres' | 'fournisseurs';

function formatDate(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MemberStatusBadge({ status, reason }: { status?: string; reason?: string }) {
  const isActive = !status || status === 'active';
  const config = isActive
    ? { label: 'Actif', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' }
    : status === 'blocked'
      ? { label: 'Bloqué', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
      : { label: 'Désactivé', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.cls}`}
      title={reason ? `Motif : ${reason}` : undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const MENU_ITEM_CLS = {
  base: 'text-xs font-semibold cursor-pointer py-2 gap-2',
  amber: 'text-amber-600 focus:bg-amber-50 focus:text-amber-700',
  red: 'text-red-600 focus:bg-red-50 focus:text-red-700',
  green: 'text-green-600 focus:bg-green-50 focus:text-green-700',
};

function MemberActions({ member, busy, onAction }: {
  member: Member;
  busy: boolean;
  onAction: (key: 'disable' | 'block' | 'reactivate' | 'delete') => void;
}) {
  const isActive = !member.status || member.status === 'active';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={busy}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          title="Gérer le membre"
        >
          {busy
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            : <MoreHorizontal size={14} />}
        </button>
      </DropdownMenuTrigger>
      {/*
        Menu rendu dans un <Portal> (Radix) : il monte en dehors de l'arbre DOM de la page,
        donc ni le `overflow-auto` du wrapper Table ni un éventuel stacking context parent
        ne peuvent le rogner. Radix repositionne automatiquement (flip haut / alignement)
        quand il n'y a pas assez de place sous le bouton.
      */}
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          className="w-60 z-[100] bg-white rounded-xl border border-slate-200 p-1.5 shadow-xl text-left"
        >
          {isActive ? (
            <>
              <DropdownMenuItem className={cn(MENU_ITEM_CLS.base, MENU_ITEM_CLS.amber)} onSelect={() => onAction('disable')}>
                <PauseCircle size={14} /> Désactiver temporairement
              </DropdownMenuItem>
              <DropdownMenuItem className={cn(MENU_ITEM_CLS.base, MENU_ITEM_CLS.red)} onSelect={() => onAction('block')}>
                <Ban size={14} /> Bloquer le compte
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem className={cn(MENU_ITEM_CLS.base, MENU_ITEM_CLS.green)} onSelect={() => onAction('reactivate')}>
              <RotateCcw size={14} /> Réactiver le compte
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem className={cn(MENU_ITEM_CLS.base, MENU_ITEM_CLS.red)} onSelect={() => onAction('delete')}>
            <Trash2 size={14} /> Supprimer définitivement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

function MembresPage() {
  const [tab, setTab] = useState<Tab>('membres');
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [searchInput, setSearchInput] = useState(initialEmail);
  const [debouncedSearch, setDebouncedSearch] = useState(initialEmail);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const SEARCH_SERVER_THRESHOLD = 10;
  const SEARCH_LIMIT = 50;

  // Liste accumulée : on charge PAGE_SIZE membres, puis davantage au scroll via
  // un curseur (startAfter). Pas d'offset et surtout pas de fetch intégral de la
  // collection customers.
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [membersDone, setMembersDone] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersLoadingMore, setMembersLoadingMore] = useState(false);
  const cursorRef = useRef<MembersCursor | null>(null);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Recherche : mode séparé — d'abord la liste déjà chargée, sinon requête
  // Firestore ciblée (searchMembers), résultats fusionnés et dé-dupliqués.
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLocalOnly, setSearchLocalOnly] = useState(false);

  const [disputeEmails, setDisputeEmails] = useState<string[]>([]);
  const [leads, setLeads] = useState<ResellerLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyRow, setBusyRow] = useState<{ id: string; key: string } | null>(null);
  const [bulkBusy, setBulkBusy] = useState<'delete' | CustomerStatus | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const isSearching = debouncedSearch.trim().length > 0;
  const visibleMembers = isSearching ? searchResults : members;
  const visibleIds = visibleMembers.map(m => m.id);
  const anySelected = selectedIds.size > 0;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  // Dé-bounce de la saisie : une seule requête (locale ou serveur) après pause.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // 1re page des membres + emails en litige : requêtes ciblées.
  useEffect(() => {
    if (tab !== 'membres') return;
    let cancelled = false;
    setMembersLoading(true);
    Promise.all([getMembersFirstPage({ pageSize: PAGE_SIZE }), getOpenDisputeEmails()])
      .then(([slice, disputes]) => {
        if (cancelled) return;
        setMembers(slice.items);
        setTotalMembers(slice.total ?? slice.items.length);
        cursorRef.current = slice.cursor;
        setMembersDone(slice.done);
        setDisputeEmails(disputes);
      })
      .catch(err => console.error(err))
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, [tab, refreshKey]);

  // Pages suivantes : auto-load au scroll (sentinelle observée) — vérifie aussi
  // les refs (curseur courant + requête en vol) plutôt que le state pour éviter
  // les fermetures obsolètes.
  const loadMore = useCallback(async () => {
    const cursor = cursorRef.current;
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setMembersLoadingMore(true);
    try {
      const slice = await getMembersNextPage({ pageSize: PAGE_SIZE, cursor });
      cursorRef.current = slice.cursor;
      setMembersDone(slice.done);
      setMembers(prev => {
        const seen = new Set(prev.map(m => m.id));
        return [...prev, ...slice.items.filter(m => !seen.has(m.id))];
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur');
    } finally {
      loadingMoreRef.current = false;
      setMembersLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || tab !== 'membres' || isSearching) return;
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tab, isSearching, loadMore]);

  // Recherche intelligente : filtre d'abord les membres déjà chargés ; s'ils ne
  // suffisent pas (≤ seuil), requête Firestore ciblée, puis fusion dé-dupliquée.
  useEffect(() => {
    if (!isSearching) {
      setSearchMode(false);
      setSearchResults([]);
      setSearchTotal(0);
      setSearchLocalOnly(false);
      return;
    }
    setSearchMode(true);
    const q = normalizeSearchText(debouncedSearch);
    const local = members.filter(m => normalizeSearchText(`${m.email} ${m.displayName}`).includes(q));

    if (local.length >= SEARCH_SERVER_THRESHOLD) {
      setSearchLocalOnly(true);
      setSearchResults(local);
      setSearchTotal(local.length);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLocalOnly(false);
    setSearchLoading(true);
    searchMembers({ query: debouncedSearch, limit: SEARCH_LIMIT })
      .then(res => {
        if (cancelled) return;
        const seen = new Set(local.map(m => m.id));
        const merged = [...local];
        for (const m of res.items) if (!seen.has(m.id)) merged.push(m);
        merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSearchResults(merged);
        setSearchTotal(merged.length);
      })
      .catch(err => console.error(err))
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [isSearching, debouncedSearch, members]);

  useEffect(() => { setPage(1); }, [tab]);

  // Fournisseurs : chargement paresseux au premier affichage de l'onglet.
  useEffect(() => {
    if (tab !== 'fournisseurs' || leadsLoaded) return;
    let cancelled = false;
    setLeadsLoading(true);
    getResellerLeads()
      .then(l => { if (!cancelled) { setLeads(l); setLeadsLoaded(true); } })
      .catch(err => console.error(err))
      .finally(() => { if (!cancelled) setLeadsLoading(false); });
    return () => { cancelled = true; };
  }, [tab, leadsLoaded]);

  const refresh = useCallback(() => {
    if (tab === 'membres') {
      setRefreshKey(k => k + 1);
    } else {
      setLeadsLoading(true);
      getResellerLeads()
        .then(l => setLeads(l))
        .catch(err => console.error(err))
        .finally(() => setLeadsLoading(false));
    }
  }, [tab]);

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

  // Les mutations (statut / suppression) répercutent le changement sur la liste
  // accumulée ET sur les résultats de recherche courants, sans recharger.
  const applyToAll = useCallback((fn: (prev: Member[]) => Member[]) => {
    setMembers(prev => fn(prev));
    setSearchResults(prev => fn(prev));
  }, []);

  const runMemberAction = useCallback(async (m: Member, key: 'disable' | 'block' | 'reactivate' | 'delete') => {
    if (key === 'delete' && !window.confirm(
      `Supprimer définitivement ${m.email} ?\n\nCommandes, factures et litiges liés seront également supprimés.\nCette action est irréversible.`,
    )) return;

    setBusyRow({ id: m.id, key });
    try {
      if (key === 'delete') {
        const res = await deleteCustomer(m.id);
        if (!res.success) { toast.error(res.error || 'Erreur'); return; }
        applyToAll(prev => prev.filter(x => x.id !== m.id));
        setTotalMembers(t => Math.max(0, t - 1));
        if (isSearching) setSearchTotal(t => Math.max(0, t - 1));
        setSelectedIds(prev => {
          if (!prev.has(m.id)) return prev;
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
        toast.success('Membre supprimé définitivement');
      } else {
        const status: CustomerStatus = key === 'disable' ? 'disabled' : key === 'block' ? 'blocked' : 'active';
        const res = await updateCustomerStatus(m.id, status);
        if (!res.success) { toast.error(res.error || 'Erreur'); return; }
        applyToAll(prev => prev.map(x => x.id === m.id
          ? { ...x, status, statusReason: status === 'active' ? '' : x.statusReason }
          : x));
        toast.success(key === 'disable' ? 'Compte désactivé temporairement' : key === 'block' ? 'Compte bloqué' : 'Compte réactivé');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusyRow(null);
    }
  }, [applyToAll, isSearching]);

  const runBulk = useCallback(async (status: CustomerStatus | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(status);
    try {
      if (status === 'delete') {
        const res = await bulkDeleteCustomers(ids);
        if (!res.success) { toast.error(res.error || 'Erreur'); return; }
        const removed = new Set(ids);
        applyToAll(prev => prev.filter(x => !removed.has(x.id)));
        setTotalMembers(t => Math.max(0, t - res.deleted));
        if (isSearching) setSearchTotal(t => Math.max(0, t - res.deleted));
        toast.success(`${res.deleted} membre(s) supprimé(s)`);
      } else {
        const res = await bulkUpdateCustomerStatus(ids, status);
        if (!res.success) { toast.error(res.error || 'Erreur'); return; }
        const affected = new Set(ids);
        applyToAll(prev => prev.map(x => affected.has(x.id)
          ? { ...x, status, statusReason: status === 'active' ? '' : x.statusReason }
          : x));
        toast.success(status === 'disabled' ? 'Comptes désactivés temporairement' : status === 'blocked' ? 'Comptes bloqués' : 'Comptes réactivés');
      }
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBulkBusy(null);
    }
  }, [selectedIds, applyToAll, isSearching]);

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const q = normalizeSearchText(searchInput);
  const filteredLeads = leads.filter(l => normalizeSearchText(l.email).includes(q));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Espace membre</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="text-xs">
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
          }`}>{totalMembers}</span>
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
          placeholder={tab === 'membres' ? 'Rechercher un membre (email ou nom)...' : 'Rechercher un email...'}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {tab === 'membres' && isSearching && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {searchLoading ? (
            <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Recherche en cours...</span>
          ) : (
            <span>
              {searchTotal} résultat{searchTotal > 1 ? 's' : ''} ·{' '}
              <button className="underline text-blue-600 hover:text-blue-800" onClick={() => setSearchInput('')}>
                réinitialiser la recherche
              </button>
            </span>
          )}
          {searchLocalOnly && (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
              Recherche limitée aux membres déjà chargés — affinez ou chargez davantage de membres pour chercher partout.
            </span>
          )}
        </div>
      )}

      {/* Barre d'actions groupées */}
      {anySelected && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/80 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
            <CheckSquare size={15} />
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" disabled={bulkBusy !== null} onClick={() => runBulk('disabled')}
              className="gap-2 text-[11px] text-amber-600 border-amber-200 bg-white hover:bg-amber-50 hover:text-amber-700">
              <PauseCircle size={13} /> Désactiver
            </Button>
            <Button variant="outline" size="sm" disabled={bulkBusy !== null} onClick={() => runBulk('blocked')}
              className="gap-2 text-[11px] text-red-600 border-red-200 bg-white hover:bg-red-50 hover:text-red-700">
              <Ban size={13} /> Bloquer
            </Button>
            <Button variant="outline" size="sm" disabled={bulkBusy !== null} onClick={() => runBulk('active')}
              className="gap-2 text-[11px] text-green-600 border-green-200 bg-white hover:bg-green-50 hover:text-green-700">
              <RotateCcw size={13} /> Réactiver
            </Button>
            <Button size="sm" disabled={bulkBusy !== null} onClick={() => setConfirmDeleteOpen(true)}
              className="gap-2 text-[11px] bg-red-600 hover:bg-red-700 text-white">
              <Trash2 size={13} /> Supprimer
            </Button>
            <Button variant="ghost" size="sm" disabled={bulkBusy !== null} onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-slate-500">
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Membres tab */}
      {tab === 'membres' && (
        <Card className="rounded-xl border border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tout sélectionner"
                      className="rounded-none"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Nom</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Téléphone</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Inscrit le</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Dernière connexion</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Statut</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement des membres...</span>
                  </TableCell></TableRow>
                ) : visibleMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-xs text-slate-400">
                    {isSearching ? 'Aucun résultat pour cette recherche' : 'Aucun membre trouvé'}
                  </TableCell></TableRow>
                ) : visibleMembers.map((m, i) => {
                  const isSelected = selectedIds.has(m.id);
                  const isBusy = busyRow?.id === m.id;
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn('border-b border-slate-100 transition-colors', isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50')}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                              return next;
                            });
                          }}
                          aria-label={`Sélectionner ${m.email}`}
                          className="rounded-none"
                        />
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {m.displayName || '-'}
                          {disputeEmails.includes(m.email) && (
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
                      <TableCell><MemberStatusBadge status={m.status} reason={m.statusReason} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <form action={connectAsClient.bind(null, m.id, m.email)}>
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
                          <MemberActions member={m} busy={isBusy} onAction={key => runMemberAction(m, key)} />
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* Pied de liste : auto-load au scroll (sentinelle) + bouton de secours */}
      {tab === 'membres' && (
        <div ref={sentinelRef} className="flex flex-wrap items-center justify-center gap-2 pb-1 text-xs text-slate-400">
          {isSearching ? (
            <span>{visibleMembers.length} résultat{visibleMembers.length > 1 ? 's' : ''}{searchLocalOnly ? ' — recherche limitée aux membres déjà chargés' : ''}</span>
          ) : membersLoadingMore ? (
            <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Chargement des membres...</span>
          ) : !membersDone ? (
            <Button variant="outline" size="sm" onClick={loadMore} className="gap-2 text-[11px] text-slate-500">
              <ChevronDown size={13} /> Charger plus
            </Button>
          ) : members.length > 0 ? (
            <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-green-500" />
              {members.length} membre{members.length > 1 ? 's' : ''} chargé{members.length > 1 ? 's' : ''} — liste complète
            </span>
          ) : null}
        </div>
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
                {leadsLoading ? (
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
      {tab === 'fournisseurs' && <Pagination current={page} total={filteredLeads.length} pageSize={PAGE_SIZE} onChange={setPage} />}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Supprimer les membres sélectionnés ?"
        subtitle={`${selectedIds.size} membre${selectedIds.size > 1 ? 's' : ''} concerné${selectedIds.size > 1 ? 's' : ''}`}
        description={`Cette action supprimera définitivement ${selectedIds.size} compte${selectedIds.size > 1 ? 's' : ''} client ainsi que leurs commandes, factures et litiges liés.`}
        warning="Cette action est irréversible. Les données supprimées ne pourront pas être récupérées."
        confirmText="Supprimer définitivement"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        headerColor="bg-red-500"
        icon={<Trash2 className="w-6 h-6 text-white" />}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          runBulk('delete');
        }}
      />
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
