
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import type { QuoteRequest, QuoteHistoryEntry, UserProfile, ActivityLogEntry } from '@/lib/types';
import { getQuoteRequests, updateQuoteStatus, getUsers, getActivityLogs } from '@/app/admin/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, Calendar as CalendarIcon, User, FileText, Settings, Shield, Key, PenLine, Hash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/Pagination';
import { format, formatDistanceToNow, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Combobox } from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

const categoryIcons: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  product: <Settings className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  auth: <Shield className="h-4 w-4" />,
  signature: <PenLine className="h-4 w-4" />,
  counter: <Hash className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  quote: 'bg-purple-100 text-purple-700',
  product: 'bg-amber-100 text-amber-700',
  settings: 'bg-gray-100 text-gray-700',
  auth: 'bg-red-100 text-red-700',
  signature: 'bg-green-100 text-green-700',
  counter: 'bg-orange-100 text-orange-700',
  other: 'bg-slate-100 text-slate-700',
};

type TabType = 'quotes' | 'admin';

export default function HistoryPage() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<TabType>('quotes');
    const [allQuotes, setAllQuotes] = useState<QuoteRequest[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, startClearing] = useTransition();

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getQuoteRequests({}),
            getUsers({ limit: 1000 }).catch(() => ({ users: [] })),
            getActivityLogs({ limit: 500 }).catch(() => []),
        ])
            .then(([{ requests }, { users }, logs]) => {
                setAllQuotes(requests);
                setAllUsers(users);
                setActivityLogs(logs);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load history data', err);
                toast({
                    variant: 'destructive',
                    title: t('history.error'),
                    description: t('history.unableToLoad'),
                });
                setIsLoading(false);
            });
    }, [toast]);

    const fullHistory = useMemo(() => {
        const history: (QuoteHistoryEntry & { quoteId: string; quoteName: string })[] = [];
        allQuotes.forEach(quote => {
            quote.history?.forEach(h => {
                history.push({
                    ...h,
                    quoteId: quote.id,
                    quoteName: `${t('history.for')} ${quote.client.companyName}`,
                });
            });
        });
        return history.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [allQuotes]);

    const filteredHistory = useMemo(() => {
        let history = fullHistory;
        const lowercasedQuery = searchQuery.toLowerCase();

        if (lowercasedQuery) {
            history = history.filter(entry =>
                entry.userName.toLowerCase().includes(lowercasedQuery) ||
                entry.action.toLowerCase().includes(lowercasedQuery) ||
                entry.details.toLowerCase().includes(lowercasedQuery) ||
                entry.quoteName.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (selectedUserId) {
            history = history.filter(entry => entry.userId === selectedUserId);
        }

        if (dateRange?.from) {
            const end = dateRange.to ?? dateRange.from;
            history = history.filter(entry =>
                isWithinInterval(new Date(entry.timestamp), {
                    start: startOfDay(dateRange.from!),
                    end: endOfDay(end),
                })
            );
        }

        return history;
    }, [fullHistory, searchQuery, selectedUserId, dateRange]);

    const filteredActivityLogs = useMemo(() => {
        let logs = activityLogs;
        const lowercasedQuery = searchQuery.toLowerCase();

        if (lowercasedQuery) {
            logs = logs.filter(entry =>
                entry.userName.toLowerCase().includes(lowercasedQuery) ||
                entry.action.toLowerCase().includes(lowercasedQuery) ||
                entry.details.toLowerCase().includes(lowercasedQuery) ||
                (entry.targetName || '').toLowerCase().includes(lowercasedQuery)
            );
        }

        if (selectedUserId) {
            logs = logs.filter(entry => entry.userId === selectedUserId);
        }

        if (selectedCategory) {
            logs = logs.filter(entry => entry.category === selectedCategory);
        }

        if (dateRange?.from) {
            const end = dateRange.to ?? dateRange.from;
            logs = logs.filter(entry =>
                isWithinInterval(new Date(entry.timestamp), {
                    start: startOfDay(dateRange.from!),
                    end: endOfDay(end),
                })
            );
        }

        return logs;
    }, [activityLogs, searchQuery, selectedUserId, selectedCategory, dateRange]);

    const paginatedData = useMemo(() => {
        const data = activeTab === 'quotes' ? filteredHistory : filteredActivityLogs;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(start, start + ITEMS_PER_PAGE);
    }, [activeTab, filteredHistory, filteredActivityLogs, currentPage]);

    const totalItems = activeTab === 'quotes' ? filteredHistory.length : filteredActivityLogs.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedUserId, dateRange, selectedCategory, activeTab]);

    const handleClearHistory = () => {
        startClearing(async () => {
            try {
                const quotesWithHistory = allQuotes.filter(q => q.history?.length);
                await Promise.all(
                    quotesWithHistory.map(q => updateQuoteStatus(q.id, { history: [] }))
                );
                const { requests } = await getQuoteRequests({});
                setAllQuotes(requests);
            } catch (e) {
                console.error(e);
            }
        });
    };

    const userOptions = useMemo(
        () => allUsers.map(u => ({ label: u.displayName, value: u.uid })),
        [allUsers]
    );

    const translateStatus = (status: string) => {
        const word = status.split(' ').pop() || '';
        switch (word) {
            case 'pending':
                return t('history.pending');
            case 'processed':
                return t('history.processed');
            case 'trashed':
                return t('history.trashed');
            default:
                return status;
        }
    };

    const categoryOptions = [
        { label: 'Utilisateurs', value: 'user' },
        { label: 'Devis', value: 'quote' },
        { label: 'Produits', value: 'product' },
        { label: 'Paramètres', value: 'settings' },
        { label: 'Authentification', value: 'auth' },
        { label: 'Signature', value: 'signature' },
        { label: 'Compteur', value: 'counter' },
        { label: 'Autre', value: 'other' },
    ];

    if (isLoading) {
        return (
            <Card className="bg-theme-card border-theme-card-border text-theme-card-text">
                <CardHeader>
                    <CardTitle>{t('history.title')}</CardTitle>
                    <CardDescription>{t('history.loading')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
     <Card className="bg-theme-card border-theme-card-border text-theme-card-text">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle>{t('history.title')}</CardTitle>
                <CardDescription>{t('history.description')}</CardDescription>
            </div>
            {activeTab === 'quotes' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive-ghost" disabled={isClearing || fullHistory.length === 0}>
                      {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      {t('history.clear')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('history.clearConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('history.clearConfirmDesc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory}>{t('history.confirmClear')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-2 bg-muted/50 rounded-lg p-1 w-fit">
            <button
                onClick={() => setActiveTab('quotes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'quotes'
                        ? 'bg-white dark:bg-gray-800 shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                <FileText className="h-4 w-4 inline mr-2" />
                Historique des devis
            </button>
            <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'admin'
                        ? 'bg-white dark:bg-gray-800 shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                <Shield className="h-4 w-4 inline mr-2" />
                Activité admin
            </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
            <Combobox
                items={userOptions}
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder={t('history.filterByUser')}
                searchPlaceholder={t('history.searchUser')}
            />
            {activeTab === 'admin' && (
                <Combobox
                    items={categoryOptions}
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    placeholder="Filtrer par catégorie"
                    searchPlaceholder="Rechercher une catégorie"
                />
            )}
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={"w-full sm:w-[300px] justify-start text-left font-normal"}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>{format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}</>
                            ) : (
                                format(dateRange.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>{t('history.filterByDate')}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        initialFocus
                        locale={fr}
                    />
                </PopoverContent>
            </Popover>
            {(selectedUserId || dateRange?.from || selectedCategory) && (
                <Button variant="ghost" onClick={() => { setSelectedUserId(''); setDateRange(undefined); setSelectedCategory(''); }}>
                    {t('history.resetFilters')}
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border border-theme-card-border rounded-2xl overflow-hidden shadow-inner bg-theme-app/50">
            <ScrollArea className="h-[60vh]">
                {paginatedData.length > 0 ? (
                    activeTab === 'quotes' ? (
                        (paginatedData as (QuoteHistoryEntry & { quoteId: string; quoteName: string })[]).map((entry, index) => (
                            <div key={index} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-5 border-b border-theme-card-border last:border-b-0 hover:bg-theme-hover transition-colors">
                                <Avatar className="h-10 w-10 border border-theme-card-border shadow-sm">
                                    <AvatarImage src={entry.userPhotoUrl} alt={entry.userName} />
                                    <AvatarFallback className="bg-theme-app text-theme-text">{entry.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm">
                                    <p className="text-theme-card-text">
                                        <span className="font-bold">{entry.userName}</span>
                                        <span className="opacity-60"> {t('history.changedStatus')} </span>
                                        <Link href={`/admin/quotes/${entry.quoteId}`} className="font-bold text-aura-accent hover:underline">
                                           {t('history.theEstimate')} {entry.quoteName}
                                        </Link>
                                        <span className="opacity-60"> {t('history.to')} </span>
                                        <span className="font-bold">{translateStatus(entry.details)}</span>.
                                    </p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-theme-card-text/40 mt-1 cursor-help">
                                                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: fr })}
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{new Date(entry.timestamp).toLocaleString('fr-FR')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                </div>
                                <div className="text-right text-[10px] font-bold uppercase tracking-tighter text-theme-card-text/50">
                                    <p>{format(new Date(entry.timestamp), 'dd/MM/yyyy')}</p>
                                    <p className="text-theme-card-text/80">{format(new Date(entry.timestamp), 'HH:mm')}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        (paginatedData as ActivityLogEntry[]).map((entry, index) => (
                            <div key={entry.id || index} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-5 border-b border-theme-card-border last:border-b-0 hover:bg-theme-hover transition-colors">
                                <Avatar className="h-10 w-10 border border-theme-card-border shadow-sm">
                                    <AvatarImage src={entry.userPhotoUrl} alt={entry.userName} />
                                    <AvatarFallback className="bg-theme-app text-theme-text">{entry.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-theme-card-text">{entry.userName}</span>
                                        <Badge className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${categoryColors[entry.category] || 'bg-slate-100 text-slate-700'}`}>
                                            <span className="inline-flex items-center gap-1">
                                                {categoryIcons[entry.category]}
                                                {entry.category === 'user' && 'Utilisateur'}
                                                {entry.category === 'quote' && 'Devis'}
                                                {entry.category === 'product' && 'Produit'}
                                                {entry.category === 'settings' && 'Paramètres'}
                                                {entry.category === 'auth' && 'Auth'}
                                                {entry.category === 'signature' && 'Signature'}
                                                {entry.category === 'counter' && 'Compteur'}
                                                {entry.category === 'other' && 'Autre'}
                                            </span>
                                        </Badge>
                                    </div>
                                    <p className="text-theme-card-text mt-0.5">
                                        <span className="font-medium">{entry.action}</span>
                                        {entry.targetName && (
                                            <span className="opacity-60"> — {entry.targetName}</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-theme-card-text/60 mt-0.5">{entry.details}</p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-theme-card-text/40 mt-1 cursor-help">
                                                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: fr })}
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{new Date(entry.timestamp).toLocaleString('fr-FR')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                </div>
                                <div className="text-right text-[10px] font-bold uppercase tracking-tighter text-theme-card-text/50 shrink-0">
                                    <p>{format(new Date(entry.timestamp), 'dd/MM/yyyy')}</p>
                                    <p className="text-theme-card-text/80">{format(new Date(entry.timestamp), 'HH:mm')}</p>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                        <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="font-semibold">{t('history.noActivity')}</p>
                        <p>{t('history.adjustFilters')}</p>
                    </div>
                )}
            </ScrollArea>
        </div>

        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </CardContent>
    </Card>
 );
}
