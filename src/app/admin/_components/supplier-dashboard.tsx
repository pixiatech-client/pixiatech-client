'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { getQuoteRequests, updateQuoteStatus, getProducts, getProductSpecs } from '../actions';
import type { QuoteRequest, Product, ProductSpec } from '@/lib/types';
import { Loader2, Package, Search, FilePen, RotateCcw, Truck, ClipboardList, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";
import { SupplierQuoteDialog } from './supplier-quote-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Nombre d'éléments par page
const ITEMS_PER_PAGE = 5;

const statusMap = {
  'in_progress': { text: 'En préparation', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: ClipboardList },
  'sent': { text: 'Envoyé', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle }
};

interface QuoteTableProps {
    quotes: QuoteRequest[];
    isLoading: boolean;
    onMarkAsSent: (quoteId: string) => void;
    onRevertStatus: (quoteId: string, status: 'in_progress' | 'sent') => void;
    savingStatus: Record<string, boolean>;
    trackingNumbers: Record<string, string>;
    onTrackingChange: (quoteId: string, value: string) => void;
    onSaveTracking: (quoteId: string, fromBlur?: boolean) => void;
    allProducts: Product[];
    productSpecs: Record<string, ProductSpec[]>;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalPages: number;
}

/**
 * Composant de tableau pour afficher les estimations avec pagination intégrée.
 */
function QuoteTable({
    quotes, 
    isLoading, 
    onMarkAsSent, 
    onRevertStatus, 
    savingStatus, 
    trackingNumbers, 
    onTrackingChange, 
    onSaveTracking, 
    allProducts, 
    productSpecs,
    currentPage,
    setCurrentPage,
    totalPages,
}: QuoteTableProps) {
    
    // Calcul des estimations à afficher pour la page actuelle
    const paginatedQuotes = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return quotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [quotes, currentPage]);

    return (
        <>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">N° d'estimation</TableHead>
                            <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Client</TableHead>
                            <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Date d'assignation</TableHead>
                            <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Statut</TableHead>
                            <TableHead className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Numéro de suivi</TableHead>
                            <TableHead className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="animate-spin mr-2 inline" /> Chargement...
                                </TableCell>
                            </TableRow>
                        ) : paginatedQuotes.length > 0 ? (
                            paginatedQuotes.map((quote) => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-mono text-xs">EST-{quote.id.substring(0, 6).toUpperCase()}</TableCell>
                                    <TableCell>{quote.client.companyName}</TableCell>
                                    <TableCell>{quote.assignedAt ? format(new Date(quote.assignedAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(statusMap[quote.status as keyof typeof statusMap].color, "cursor-pointer")} onClick={() => onRevertStatus(quote.id, quote.status as 'in_progress' | 'sent')}>
                                            <RotateCcw className="h-3 w-3 mr-1.5" />
                                            {statusMap[quote.status as keyof typeof statusMap].text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Input placeholder="Entrer le numéro de suivi..." value={trackingNumbers[quote.id] || ''} onChange={(e) => onTrackingChange(quote.id, e.target.value)} onBlur={() => onSaveTracking(quote.id, true)} disabled={savingStatus[quote.id]} />
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-600" onClick={() => onSaveTracking(quote.id)} disabled={savingStatus[quote.id]}>
                                                {savingStatus[quote.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePen className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className='flex gap-2 justify-end'>
                                            <SupplierQuoteDialog quote={quote} allProducts={allProducts} productSpecs={productSpecs}>
                                                <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">Détails</Button>
                                            </SupplierQuoteDialog>
                                            {quote.status === 'in_progress' && (
                                                <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={!trackingNumbers[quote.id] || savingStatus[quote.id]} onClick={() => onMarkAsSent(quote.id)}>
                                                    <Package className='mr-2 h-4 w-4' /> Marquer comme envoyé
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucune estimation dans cette catégorie.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            

            {/* Contrôles de pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={quotes.length}
                itemsPerPage={ITEMS_PER_PAGE}
            />
        </>
    );
}

export function SupplierDashboard() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSpecs, setProductSpecs] = useState<Record<string, ProductSpec[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [revertAction, setRevertAction] = useState<{quoteId: string, status: 'in_progress' | 'sent'} | null>(null);
  const [activeTab, setActiveTab] = useState<'preparation' | 'livraison'>('preparation');
  
  // États de pagination pour chaque onglet
  const [preparationCurrentPage, setPreparationCurrentPage] = useState(1);
  const [livraisonCurrentPage, setLivraisonCurrentPage] = useState(1);
  
  const fetchAndSetQuotes = () => {
    if (userProfile?.uid) {
      setIsLoading(true);
      Promise.all([
        getQuoteRequests({}),
        getProducts({ limit: 1000 }),
        getProductSpecs()
      ]).then(([{ requests }, { products }, specs]) => {
          const assignedQuotes = requests.filter(q => q.supplierId === userProfile.uid && ['in_progress', 'sent'].includes(q.status));
          setQuotes(assignedQuotes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setAllProducts(products);
          setProductSpecs(specs);

          const initialTracking = assignedQuotes.reduce((acc, q) => {
            acc[q.id] = q.trackingNumber || '';
            return acc;
          }, {} as Record<string, string>);
          setTrackingNumbers(initialTracking);
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchAndSetQuotes();
  }, [userProfile?.uid]);
  
  // Réinitialiser la pagination lors d'une recherche
  useEffect(() => {
    setPreparationCurrentPage(1);
    setLivraisonCurrentPage(1);
  }, [searchQuery]);

  // Filtrage des estimations par onglet et recherche
  const { preparationQuotes, livraisonQuotes } = useMemo(() => {
    const baseFilter = (q: QuoteRequest) => !searchQuery || 
        q.client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        `est-${q.id.substring(0, 6)}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (q.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return {
        preparationQuotes: quotes.filter(q => q.status === 'in_progress' && baseFilter(q)),
        livraisonQuotes: quotes.filter(q => q.status === 'sent' && baseFilter(q))
    }
  }, [quotes, searchQuery]);
  
  // Calcul du nombre total de pages
  const preparationTotalPages = Math.ceil(preparationQuotes.length / ITEMS_PER_PAGE);
  const livraisonTotalPages = Math.ceil(livraisonQuotes.length / ITEMS_PER_PAGE);

  const handleSaveTrackingNumber = async (quoteId: string, fromBlur = false) => {
    const trackingNumber = trackingNumbers[quoteId];
    if (fromBlur && !trackingNumber) return;

    setSavingStatus(prev => ({ ...prev, [quoteId]: true }));
    try {
      await updateQuoteStatus(quoteId, { trackingNumber });
      toast({ title: 'Succès', description: 'Numéro de suivi sauvegardé.', variant: 'success' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le numéro de suivi.', variant: 'destructive' });
    } finally {
      setSavingStatus(prev => ({ ...prev, [quoteId]: false }));
    }
  };
  
  const handleMarkAsSent = async (quoteId: string) => {
    setSavingStatus(prev => ({ ...prev, [quoteId]: true }));
    try {
      await updateQuoteStatus(quoteId, { status: 'sent' });
      fetchAndSetQuotes();
      toast({ title: 'Succès', description: "L'estimation a été marquée comme envoyée.", variant: 'success' });
    } catch (error) {
       toast({ title: 'Erreur', description: "Impossible de mettre à jour le statut.", variant: 'destructive' });
    } finally {
       setSavingStatus(prev => ({ ...prev, [quoteId]: false }));
    }
  }

  const handleRevertStatus = async () => {
    if (!revertAction) return;
    const { quoteId, status } = revertAction;
    const targetStatus = status === 'sent' ? 'in_progress' : 'processed';
    
    setSavingStatus(prev => ({ ...prev, [quoteId]: true }));
    try {
      await updateQuoteStatus(quoteId, { status: targetStatus, supplierId: targetStatus === 'processed' ? undefined : userProfile?.uid });
      fetchAndSetQuotes();
      toast({ title: 'Statut modifié', description: `L'estimation est de retour au statut ${targetStatus === 'processed' ? 'Traité' : 'En préparation'}.`, variant: 'info' });
    } catch (error) {
       toast({ title: 'Erreur', description: "Impossible de modifier le statut.", variant: 'destructive' });
    } finally {
       setSavingStatus(prev => ({ ...prev, [quoteId]: false }));
       setRevertAction(null);
    }
  }

  return (
    <>
      <Card className="rounded-[2rem] border border-gray-200 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Estimations à traiter</CardTitle>
              <CardDescription className="text-sm font-medium text-gray-400">Voici la liste des estimations qui vous ont été assignées.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher une estimation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl border-gray-200 h-11" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preparation' | 'livraison')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
                  <TabsTrigger value="preparation" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <ClipboardList className="mr-2 h-4 w-4 text-cyan-500" />
                      Préparation ({preparationQuotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="livraison" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Truck className="mr-2 h-4 w-4 text-emerald-500" />
                      Livraison ({livraisonQuotes.length})
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="preparation" className="mt-6">
                  <QuoteTable
                      quotes={preparationQuotes}
                      isLoading={isLoading}
                      onMarkAsSent={handleMarkAsSent}
                      onRevertStatus={(quoteId, status) => setRevertAction({ quoteId, status })}
                      savingStatus={savingStatus}
                      trackingNumbers={trackingNumbers}
                      onTrackingChange={(id, val) => setTrackingNumbers(prev => ({ ...prev, [id]: val }))}
                      onSaveTracking={handleSaveTrackingNumber}
                      allProducts={allProducts}
                      productSpecs={productSpecs}
                      currentPage={preparationCurrentPage}
                      setCurrentPage={setPreparationCurrentPage}
                      totalPages={preparationTotalPages}
                  />
              </TabsContent>
              <TabsContent value="livraison" className="mt-6">
                  <QuoteTable
                      quotes={livraisonQuotes}
                      isLoading={isLoading}
                      onMarkAsSent={handleMarkAsSent}
                      onRevertStatus={(quoteId, status) => setRevertAction({ quoteId, status })}
                      savingStatus={savingStatus}
                      trackingNumbers={trackingNumbers}
                      onTrackingChange={(id, val) => setTrackingNumbers(prev => ({ ...prev, [id]: val }))}
                      onSaveTracking={handleSaveTrackingNumber}
                      allProducts={allProducts}
                      productSpecs={productSpecs}
                      currentPage={livraisonCurrentPage}
                      setCurrentPage={setLivraisonCurrentPage}
                      totalPages={livraisonTotalPages}
                  />
              </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    
      <AlertDialog open={!!revertAction} onOpenChange={(open) => !open && setRevertAction(null)}>
        <AlertDialogContent className="rounded-[2rem] border border-gray-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-400">
              {revertAction?.status === 'sent'
                ? "Voulez-vous vraiment annuler l'envoi de cette commande ? Le statut reviendra à 'En préparation'."
                : "Voulez-vous vraiment annuler la transmission de cette commande ? Elle retournera dans la liste des estimations 'Traités' de l'administrateur."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200">Non</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertStatus} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Oui, annuler</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
