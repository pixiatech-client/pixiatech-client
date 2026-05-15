
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import type { QuoteRequest, QuoteHistoryEntry, UserProfile } from '@/lib/types';
import { getQuoteRequests, updateQuoteStatus, getUsers } from '@/app/admin/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/Pagination';
import { format, formatDistanceToNow, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DateRange } from 'react-day-picker';

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
    const [allQuotes, setAllQuotes] = useState<QuoteRequest[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, startClearing] = useTransition();

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();

useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getQuoteRequests({}),
            getUsers({ limit: 1000 }).catch(() => ({ users: [] }))
        ])
            .then(([{ requests }, { users }]) => {
                setAllQuotes(requests);
                setAllUsers(users);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load history data', err);
                toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: 'Impossible de charger les données de l\'historique.',
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
                    quoteName: `pour ${quote.client.companyName}`,
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

    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedUserId, dateRange]);

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
                return 'en attente';
            case 'processed':
                return 'traité';
            case 'trashed':
                return 'mis à la corbeille';
            default:
                return status;
        }
    };

    if (isLoading) {
        return (
            <Card className="bg-theme-card border-theme-card-border text-theme-card-text">
                <CardHeader>
                    <CardTitle>Historique des activités</CardTitle>
                    <CardDescription>Chargement de l’historique…</CardDescription>
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
                <CardTitle>Historique des activités</CardTitle>
                <CardDescription>Consultez l'historique de toutes les modifications apportées aux estimations.</CardDescription>
            </div>
            <Button variant="destructive-ghost" onClick={handleClearHistory} disabled={isClearing || fullHistory.length === 0}>
                {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Vider l'historique
            </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
            <Combobox
                items={userOptions}
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Filtrer par utilisateur..."
                searchPlaceholder="Rechercher un utilisateur..."
            />
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
                            <span>Filtrer par date...</span>
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
            {(selectedUserId || dateRange?.from) && (
                <Button variant="ghost" onClick={() => { setSelectedUserId(''); setDateRange(undefined); }}>
                    Réinitialiser les filtres
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border border-theme-card-border rounded-2xl overflow-hidden shadow-inner bg-theme-app/50">
            <ScrollArea className="h-[60vh]">
                {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((entry, index) => (
                        <div key={index} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-5 border-b border-theme-card-border last:border-b-0 hover:bg-theme-hover transition-colors">
                            <Avatar className="h-10 w-10 border border-theme-card-border shadow-sm">
                                <AvatarImage src={entry.userPhotoUrl} />
                                <AvatarFallback className="bg-theme-app text-theme-text">{entry.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                                <p className="text-theme-card-text">
                                    <span className="font-bold">{entry.userName}</span>
                                    <span className="opacity-60"> a modifié le statut de </span>
                                    <Link href={`/admin/quotes/${entry.quoteId}`} className="font-bold text-aura-accent hover:underline">
                                       l'estimation {entry.quoteName}
                                    </Link>
                                    <span className="opacity-60"> vers </span>
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
                    <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                        <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="font-semibold">Aucune activité à afficher.</p>
                        <p>Essayez d'ajuster vos filtres ou effectuez une recherche.</p>
                    </div>
                )}
            </ScrollArea>
        </div>

        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredHistory.length}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </CardContent>
    </Card>
 );
}
