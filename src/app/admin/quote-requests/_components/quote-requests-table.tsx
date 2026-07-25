'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Undo2, Phone, CheckCircle, Clock, Loader2, ChevronLeft, ChevronRight, MailWarning, Trash, Ban, MailCheck, Search, Truck, FilePen, FileText, Users, SendHorizontal, Zap, Settings, Bot } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { QuoteRequest } from '@/lib/types';
import { cn, normalizeSearchText } from '@/lib/utils';
import { getQuoteRequests, updateQuoteStatus, moveQuotesToTrash, restoreQuotes, permanentDeleteQuotes, permanentDeleteAllTrashedQuotes } from '@/app/admin/actions';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { TransmitToSupplierDialog } from './transmit-to-supplier-dialog';
import { EditTrackingNumberDialog } from './edit-tracking-number-dialog';
import { SupplierQuoteDialog } from './supplier-quote-dialog';
import { useAdminT } from '@/hooks/useAdminT';


const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200", iconColor: "text-yellow-500", selectedIconColor: "text-white" },
    processed: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200", iconColor: "text-green-600", selectedIconColor: "text-white" },
    trashed: { label: "Trash", color: "bg-red-100 text-red-800 border-red-300", iconColor: "text-red-600", selectedIconColor: "text-white" },
    in_progress: { label: "Sent to supplier", color: "bg-cyan-100 text-cyan-800 border-cyan-300", iconColor: "text-cyan-600", selectedIconColor: "text-white" },
    sent: { label: "Sent", color: "bg-blue-100 text-blue-800 border-blue-300", iconColor: "text-blue-600", selectedIconColor: "text-white" },
    returned: { label: "Returned", color: "bg-rose-100 text-rose-800 border-rose-300", iconColor: "text-rose-600", selectedIconColor: "text-white" },
    archived: { label: "Archived", color: "bg-gray-100 text-gray-800 border-gray-300", iconColor: "text-gray-600", selectedIconColor: "text-white" },
};

type Status = 'pending' | 'processed' | 'trashed' | 'in_progress' | 'sent' | 'archived' | 'returned';

const ITEMS_PER_PAGE = 6;

export function QuoteRequestsTable() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useAdminT();
  const [allRequests, setAllRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [dialogAction, setDialogAction] = useState<{ type: 'trash' | 'delete' | 'restore' | 'deleteAll' | 'refuse', ids?: string[] } | null>(null);
  
  const [activeTab, setActiveTab] = useState<Status | 'delivery'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Stack is stored in a ref so fetchRequests can read it without being in its dep array
  const lastIdStackRef = useRef<(string | null)[]>([null]);
  const [lastIdStack, setLastIdStack] = useState<(string | null)[]>([null]);

  // Sync ref whenever state changes
  useEffect(() => {
    lastIdStackRef.current = lastIdStack;
  }, [lastIdStack]);

  const { userProfile } = useUser();
  const isAdmin = userProfile?.role === 'admin';
  const isSupplier = userProfile?.role === 'fournisseur';
  const [refusalMessage, setRefusalMessage] = useState('Group refusal by supplier');
  
  // ✅ ZERO dependencies — fetchRequests is stable and never recreated
  const fetchRequests = useCallback(async (
    page: number,
    currentActiveTab: Status | 'delivery',
    stack?: (string | null)[]  // optional override (used when resetting tab)
  ) => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const currentStack = stack ?? lastIdStackRef.current;
      const statusFilter = currentActiveTab === 'delivery' ? ['in_progress', 'sent'] : [currentActiveTab as string];
      const startAfterId = currentStack[page - 1] || null;

      // ✅ Single network call — products/specs loaded lazily in SupplierQuoteDialog
      const quotesResult = await getQuoteRequests({ 
        status: statusFilter, 
        limit: ITEMS_PER_PAGE, 
        startAfterId, 
        isLightweight: true 
      });

      console.log(`⏱️ getQuoteRequests [${currentActiveTab}]: ${Math.round(performance.now() - start)}ms for ${quotesResult.requests.length} docs`);

      setAllRequests(quotesResult.requests);
      setTotalCount(quotesResult.totalCount);

      // ✅ Update stack via functional update — no stale closure
      if (quotesResult.lastId) {
        setLastIdStack(prev => {
          if (prev.length <= page) {
            return [...prev, quotesResult.lastId!];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      setAllRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ stable forever

  // ✅ Only re-runs when page or tab actually changes — NOT when fetchRequests changes
  useEffect(() => {
    fetchRequests(currentPage, activeTab);
  }, [currentPage, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefreshData = () => {
    setSelectedRequests([]);
    fetchRequests(currentPage, activeTab);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const formatDate = (date: Date | string) => {
      if (!date) return t('N/A');
      return new Date(date as any).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (date: Date | string) => {
      if (!date) return t('N/A');
      return new Date(date as any).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };


  const filteredRequests = useMemo(() => {
    // Search is now the only client-side filter for the current page
    if (!searchQuery) return allRequests;

    const lowercasedQuery = normalizeSearchText(searchQuery);

    return allRequests.filter(req => {
      const clientName = normalizeSearchText(req.client.companyName || '');
      const phone = normalizeSearchText(req.client.phone || '');
      const date = normalizeSearchText(formatDate(req.createdAt));
      const time = normalizeSearchText(formatTime(req.createdAt));
      const tracking = normalizeSearchText(req.trackingNumber || '');
      
      const totalString = (req.totalQuote || 0).toString();
      const formattedTotal = normalizeSearchText(formatCurrency(req.totalQuote || 0));

      return (
        clientName.includes(lowercasedQuery) ||
        phone.includes(lowercasedQuery) ||
        date.includes(lowercasedQuery) ||
        time.includes(lowercasedQuery) ||
        tracking.includes(lowercasedQuery) ||
        totalString.includes(lowercasedQuery) ||
        formattedTotal.includes(lowercasedQuery)
      );
    });
    
  }, [allRequests, searchQuery]);
  
  const mainListTotal = useMemo(() => {
      const requestsToSum = selectedRequests.length > 0
          ? allRequests.filter(req => selectedRequests.includes(req.id))
          : filteredRequests;
      
      return requestsToSum.reduce((total, req) => total + (req.totalQuote || 0), 0);
  }, [selectedRequests, filteredRequests, allRequests]);


  const paginatedRequests = filteredRequests;
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  const handleStatusToggle = async (req: QuoteRequest) => {
      const newStatus = req.status === 'processed' ? 'pending' : 'processed';
      await updateQuoteStatus(req.id, { status: newStatus, isRead: true });
      fetchRequests(currentPage, activeTab);
  }
  
  const handleTabChange = (newTab: string) => {
    const tab = newTab as Status | 'delivery';
    const freshStack: (string | null)[] = [null];
    setActiveTab(tab);
    setCurrentPage(1);
    setLastIdStack(freshStack);
    setSelectedRequests([]);
    // ✅ Call directly with fresh stack — don't wait for useEffect with stale state
    fetchRequests(1, tab, freshStack);
  }

  const handleDialogConfirm = async () => {
    if (!dialogAction) return;
    
    if (dialogAction.type === 'trash' && dialogAction.ids) {
        await moveQuotesToTrash(dialogAction.ids);
    } else if (dialogAction.type === 'delete' && dialogAction.ids) {
        if (isAdmin) {
          await permanentDeleteQuotes(dialogAction.ids);
        }
    } else if (dialogAction.type === 'restore' && dialogAction.ids) {
        await restoreQuotes(dialogAction.ids);
    } else if (dialogAction.type === 'refuse' && dialogAction.ids) {
        await Promise.all(dialogAction.ids.map(id => 
            updateQuoteStatus(id, { 
                status: 'returned', 
                returnReason: refusalMessage 
            } as any)
        ));
        toast({ title: t('Success'), description: t(`${dialogAction.ids.length} estimation(s) refused.`) });
    } else if (dialogAction.type === 'deleteAll') {
        if (isAdmin) {
            await permanentDeleteAllTrashedQuotes();
        }
    }
    
    setDialogAction(null);
    setSelectedRequests([]);
    fetchRequests(currentPage, activeTab);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedRequests(checked ? paginatedRequests.map(req => req.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedRequests(prev => checked ? [...prev, id] : prev.filter(reqId => reqId !== id));
  };
  
  const isAllSelected = selectedRequests.length > 0 && selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0;
  
  const handleRevertToProcessed = async (quoteId: string) => {
    await updateQuoteStatus(quoteId, { status: 'processed', supplierId: undefined });
    toast({
        title: t('Estimation returned'),
        description: t("The estimation is back in the 'Approved' list."),
        variant: 'info',
    });
    fetchRequests(currentPage, activeTab);
  }
  
  const handleTrackingUpdate = (quoteId: string, updatedData: Partial<QuoteRequest>) => {
      setAllRequests(prev => prev.map(q => q.id === quoteId ? { ...q, ...updatedData } : q));
  }

  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{t("Estimation Tracking")}</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500 mt-1">{t("View and manage the lifecycle of estimations.")}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-grow lg:flex-none flex items-center gap-3">
                    {/* Mobile Select All */}
                    <div className="lg:hidden flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 h-11 rounded-xl shadow-sm">
                        <Checkbox 
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("All")}</span>
                    </div>
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder={t("Search...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full lg:w-72 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm focus:ring-slate-900"
                        />
                    </div>
                </div>
                 <div className="bg-slate-900 text-white py-2 px-5 rounded-xl flex flex-col items-end shadow-lg shadow-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">{t("Grouped Total")}</span>
                    <span className="text-xl font-black text-blue-400 leading-none">{formatCurrency(mainListTotal)}</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
         <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <TabsList className="bg-white border border-slate-200 h-11 p-1 rounded-xl shadow-sm">
                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        {t("Pending")}
                    </TabsTrigger>
                    <TabsTrigger value="processed" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        {t("Approved")}
                    </TabsTrigger>
                     <TabsTrigger value="returned" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <Undo2 className="mr-2 h-3.5 w-3.5" />
                        {t("Returned")}
                    </TabsTrigger>
                     <TabsTrigger value="delivery" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <Truck className="mr-2 h-3.5 w-3.5" />
                        {t("Delivery")}
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        {t("Archived")}
                    </TabsTrigger>
                    <TabsTrigger value="trashed" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-xs px-4">
                        <Trash className="mr-2 h-3.5 w-3.5" />
                         {t("Trash")}
                    </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                     {activeTab === 'processed' && selectedRequests.length > 0 && (
                        <TransmitToSupplierDialog quotes={allRequests.filter(r => selectedRequests.includes(r.id))} onSuccess={handleRefreshData}>
                            <Button variant="outline" size="sm" className="rounded-lg font-bold border-slate-200 shadow-sm hover:bg-slate-50">
                                <SendHorizontal className="mr-2 h-4 w-4" />
                                {t(`Transmit (${selectedRequests.length})`)}
                            </Button>
                        </TransmitToSupplierDialog>
                    )}
                    {activeTab !== 'trashed' && selectedRequests.length > 0 && (
                        <Button variant="destructive" size="sm" className="rounded-lg font-bold shadow-sm" onClick={() => setDialogAction({ type: 'trash', ids: selectedRequests })}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t(`Trash (${selectedRequests.length})`)}
                        </Button>
                    )}
                    {isSupplier && selectedRequests.length > 0 && activeTab !== 'trashed' && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="rounded-lg font-bold shadow-sm bg-orange-600 hover:bg-orange-700 border-0" 
                            onClick={() => setDialogAction({ type: 'refuse', ids: selectedRequests })}
                        >
                            <Ban className="mr-2 h-4 w-4" /> {t(`Refuse (${selectedRequests.length})`)}
                        </Button>
                    )}
                    {activeTab === 'trashed' && selectedRequests.length > 0 && (
                         <div className='flex gap-2'>
                            <Button variant="outline" size="sm" className="rounded-lg font-bold border-slate-200 shadow-sm" onClick={() => setDialogAction({ type: 'restore', ids: selectedRequests })}>
                                <Undo2 className="mr-2 h-4 w-4" /> {t(`Restore (${selectedRequests.length})`)}
                            </Button>
                            {isAdmin && (
                                <Button variant="destructive" size="sm" className="rounded-lg font-bold shadow-sm" onClick={() => setDialogAction({ type: 'delete', ids: selectedRequests })}>
                                    <Ban className="mr-2 h-4 w-4" /> {t("Delete")}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <div className="border-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="w-[60px] pl-6">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                                className="rounded-md border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                                aria-label={t("Select all rows on this page")}
                            />
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Ref.")}</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Client")}</TableHead>
                        {activeTab === 'delivery' ? (
                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Tracking")}</TableHead>
                        ) : (
                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Contact")}</TableHead>
                        )}
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Status")}</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Supplier")}</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t("Time / Date")}</TableHead>
                        <TableHead className="text-right text-[11px] font-black uppercase tracking-widest text-slate-400 pr-6">{t("Total (excl. tax)")}</TableHead>
                        <TableHead className="w-[100px] text-right pr-6"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                            <TableRow key={i} className="border-slate-100 animate-pulse">
                                <TableCell className="pl-6"><div className="w-5 h-5 bg-slate-100 rounded" /></TableCell>
                                <TableCell><div className="h-3 bg-slate-100 rounded w-16" /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100" />
                                        <div className="h-4 bg-slate-100 rounded w-32" />
                                    </div>
                                </TableCell>
                                <TableCell><div className="h-8 bg-slate-100 rounded w-24" /></TableCell>
                                <TableCell><div className="h-6 bg-slate-100 rounded-full w-20" /></TableCell>
                                <TableCell><div className="h-9 bg-slate-100 rounded-lg w-9" /></TableCell>
                                <TableCell><div className="h-8 bg-slate-100 rounded w-20" /></TableCell>
                                <TableCell className="text-right pr-6"><div className="h-6 bg-slate-100 rounded w-24 ml-auto" /></TableCell>
                                <TableCell className="text-right pr-6"><div className="h-9 bg-slate-100 rounded w-24 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : paginatedRequests.length > 0 ? paginatedRequests.map((req) => {
                        const status: Status = req.status as Status || 'pending';
                        
                        return (
                        <TableRow 
                            key={req.id}
                            data-state={selectedRequests.includes(req.id) ? "selected" : ""}
                            onClick={() => router.push(`/admin/quotes/${req.id}`)}
                            className="group cursor-pointer border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                        <TableCell className="pl-6" onClick={(e) => {e.stopPropagation(); handleSelectOne(req.id, !selectedRequests.includes(req.id))}}>
                            <Checkbox 
                                checked={selectedRequests.includes(req.id)}
                                className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                                aria-label={`Select quote from ${req.client.companyName}`}
                            />
                        </TableCell>
                         <TableCell className="font-mono text-[10px] font-bold text-slate-400">
                           <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                             {req.configuratorType === 'guided' && (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <div className="w-5 h-5 rounded bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm cursor-help">
                                       <Zap className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                                     </div>
                                   </TooltipTrigger>
                                   <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                       <p className="font-medium text-xs">{t("Generated via guided configurator (Wizard)")}</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                             {req.configuratorType === 'manual' && (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm cursor-help">
                                       <Settings className="h-3 w-3 text-slate-500" />
                                     </div>
                                   </TooltipTrigger>
                                   <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                       <p className="font-medium text-xs">{t("Generated via manual configuration")}</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                             {req.configuratorType === 'lumi' && (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm cursor-help">
                                       <Bot className="h-3 w-3 text-blue-500" />
                                     </div>
                                   </TooltipTrigger>
                                   <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                       <p className="font-medium text-xs">{t("Generated by Lumi AI")}</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                             <span>EST-{req.id.substring(0, 6).toUpperCase()}</span>
                           </div>
                         </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="shrink-0">
                                            {req.emailVerified ? (
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-50">
                                                    <MailCheck className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-50">
                                                    <MailWarning className="h-4 w-4 text-amber-500" />
                                                </div>
                                            )}
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                            <p className="font-medium text-xs">{req.emailVerified ? t("Verified email") : t("Unverified email")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className={cn(
                                    "font-bold text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap", 
                                    !req.isRead && status === 'pending' && "text-blue-600"
                                )}>
                                    {req.client.companyName}
                                </span>
                            </div>
                        </TableCell>
                        {activeTab === 'delivery' ? (
                            <TableCell>
                                <div 
                                    className="flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{req.trackingNumber || t("N/A")}</span>
                                    <EditTrackingNumberDialog quote={req} onUpdate={(updated) => handleTrackingUpdate(req.id, updated)} />
                                </div>
                            </TableCell>
                        ) : (
                            <TableCell>
                                <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent rounded-lg px-2" onClick={(e) => e.stopPropagation()}>
                                    <a href={`tel:${req.client.phone}`}><Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />{req.client.phone}</a>
                                </Button>
                            </TableCell>
                        )}
                        <TableCell>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all whitespace-nowrap",
                                        status === 'pending' ? 'bg-amber-400 border-amber-300 text-white hover:bg-amber-500' : 
                                        status === 'processed' ? 'bg-emerald-400 border-emerald-300 text-white hover:bg-emerald-500' :
                                        status === 'in_progress' ? 'bg-cyan-400 border-cyan-300 text-white hover:bg-cyan-500' :
                                        status === 'sent' ? 'bg-blue-400 border-blue-300 text-white hover:bg-blue-500' :
                                        status === 'returned' ? 'bg-violet-500 border-violet-400 text-white hover:bg-violet-600' :
                                        'bg-rose-400 border-rose-300 text-white',
                                        !['trashed', 'sent'].includes(status) && 'cursor-pointer'
                                    )}
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (status === 'in_progress') handleRevertToProcessed(req.id);
                                        else if (!['trashed', 'sent'].includes(status)) handleStatusToggle(req); 
                                    }}
                                >
                                    {t(statusConfig[status as keyof typeof statusConfig]?.label || status)}
                                </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SupplierQuoteDialog quote={req}>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                                <Users className="h-4 w-4" />
                                            </Button>
                                        </SupplierQuoteDialog>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                        <p className="font-medium text-xs">{t("Supplier view")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">{formatTime(req.createdAt)}</span>
                                <span className="text-[10px] font-medium text-slate-400">{formatDate(req.createdAt)}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">{formatCurrency(req.totalQuote)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{t("Excl. tax")}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <div className='flex items-center justify-end gap-2' onClick={(e) => e.stopPropagation()}>
                               {activeTab === 'processed' ? (
                                    <TransmitToSupplierDialog quotes={[req]} onSuccess={handleRefreshData}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="sm" className='rounded-lg font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-9 px-3'>
                                                        <SendHorizontal className="h-4 w-4 mr-2 text-blue-500" />
                                                        {t("Send")}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-slate-900 text-white rounded-lg border-0 shadow-xl">
                                                    <p className="font-medium text-xs">{t("Send to supplier")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TransmitToSupplierDialog>
                               ) : activeTab === 'archived' ? (
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-lg font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-9 px-4"
                                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(req); }}
                                        >
                                            <Undo2 className="h-3.5 w-3.5 mr-2" /> {t("Restore")}
                                        </Button>
                                        <Button asChild variant="outline" size="sm" className="rounded-lg font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-9 px-4">
                                            <Link href={`/admin/quotes/${req.id}`}>{t("Details")}</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <Button asChild variant="outline" size="sm" className="rounded-lg font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-9 px-4">
                                        <Link href={`/admin/quotes/${req.id}`}>{t("Details")}</Link>
                                    </Button>
                                )}
                                {activeTab !== 'trashed' && (
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-lg border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); setDialogAction({ type: 'trash', ids: [req.id] })}}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                        </TableRow>
                    )}) : (
                        <TableRow>
                        <TableCell colSpan={10} className="text-center h-48 py-10 bg-slate-50/20">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-900">{searchQuery ? t("No results found.") : t("Empty list")}</p>
                                <p className="text-xs text-slate-400 mt-1">{searchQuery ? t("Try different search terms.") : t("No estimation requests in this category.")}</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
                

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredRequests.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    className="px-6"
                />
            </div>
        </Tabs>
      </CardContent>

       {/* Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction?.type === 'trash' && t("You are about to move {n} estimation(s) to the trash.").replace("{n}", (dialogAction.ids?.length ?? 0).toString())}
              {dialogAction?.type === 'delete' && t("This action is irreversible. The estimations will be permanently deleted.")}
              {dialogAction?.type === 'deleteAll' && t("This action is irreversible. ALL estimations in the trash will be permanently deleted.")}
              {dialogAction?.type === 'restore' && t("You are about to restore {n} estimation(s).").replace("{n}", (dialogAction.ids?.length ?? 0).toString())}
              {dialogAction?.type === 'refuse' && (
                <div className="space-y-3 mt-2">
                    <p>{t("You are about to refuse {n} estimation(s). Please state the reason:").replace("{n}", (dialogAction.ids?.length ?? 0).toString())}</p>
                    <Input 
                        value={refusalMessage}
                        onChange={(e) => setRefusalMessage(e.target.value)}
                        placeholder={t("Reason for refusal (e.g., Unavailable, technical error...)")}
                        className="mt-2 border-slate-200 focus:ring-orange-500"
                    />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                (dialogAction?.type === 'delete' || dialogAction?.type === 'deleteAll' || dialogAction?.type === 'trash') && "bg-destructive hover:bg-destructive/90",
                dialogAction?.type === 'refuse' && "bg-orange-600 hover:bg-orange-700"
              )}
              onClick={handleDialogConfirm}
            >
              {t("Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
