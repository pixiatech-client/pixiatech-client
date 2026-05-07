

'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo, useTransition } from "react";
import type { QuoteRequest, City, Settings, Product, DeliverySettings, PdfSettings, ProductSpec, QuoteHistoryEntry, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, User, Package, Truck, Wrench, ArrowLeft, Eye, Users, FilePen, Loader2, History } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QuotePDF } from "@/app/admin/quote-pdf";
import { getProductSpecs, updateQuoteClientDetails, updateQuoteStatus, getSettings, getPdfSettings, getUsers, updateQuotePdfUrl } from "@/app/admin/actions";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { SupplierQuotePdf } from "./supplier-quote-pdf";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransmitToSupplierDialog } from "@/app/admin/quote-requests/_components/transmit-to-supplier-dialog";
import { EditTrackingNumberDialog } from "@/app/admin/quote-requests/_components/edit-tracking-number-dialog";


function EditClientDialog({ quote, onUpdate }: { quote: QuoteRequest; onUpdate: (updatedClient: QuoteRequest['client']) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [formData, setFormData] = useState(quote.client);

    useEffect(() => {
        setFormData(quote.client);
    }, [quote.client]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateQuoteClientDetails(quote.id, formData);
            if (result.success) {
                onUpdate(formData);
                setIsOpen(false);
                toast({ title: "Client mis à jour", description: "Les informations du client ont été sauvegardées.", variant: 'success' });
            } else {
                toast({ title: "Erreur", description: result.error, variant: 'destructive' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600">
                    <FilePen className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier les informations du client</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les détails du contact et de l'entreprise pour cette estimation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Entreprise</Label>
                        <Input id="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    {formData.sitePhoto && (
                        <div className="space-y-2">
                            <Label>Photo du site</Label>
                            <div className="relative aspect-video rounded-lg overflow-hidden border">
                                <img src={formData.sitePhoto} alt="Site" className="object-cover w-full h-full" />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function HistoryTimeline({ history }: { history: QuoteHistoryEntry[] }) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground py-4">
                Aucun historique pour cette estimation.
            </div>
        );
    }

    return (
        <ScrollArea className="h-72 w-full">
            <div className="space-y-6 p-1">
                {history.map((entry, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={entry.userPhotoUrl} />
                            <AvatarFallback>{entry.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <p className="text-sm font-medium">{entry.userName} <span className="text-muted-foreground font-normal">{entry.action}</span></p>
                             <p className="text-sm text-muted-foreground">{entry.details}</p>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <p className="text-xs text-muted-foreground mt-0.5 cursor-help">
                                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: fr })}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{new Date(entry.timestamp).toLocaleString('fr-FR')}</p>
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

export default function AdminQuoteDetails({ quote: initialQuote, allProducts, deliverySettings }: {
    quote: QuoteRequest;
    allProducts: Product[];
    deliverySettings: DeliverySettings;
}) {
  const [quote, setQuote] = useState<QuoteRequest | undefined>(initialQuote);
  
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  
  const [deliveryDiscount, setDeliveryDiscount] = useState(0);
  const [laborDiscount, setLaborDiscount] = useState(0);
  const [productDiscount, setProductDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings | undefined>(undefined);
  const [globalSettings, setGlobalSettings] = useState<Settings | undefined>(undefined);
  const [productSpecs, setProductSpecs] = useState<Record<string, ProductSpec[]>>({});
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const router = useRouter();

 useEffect(() => {
    async function fetchAllSettings() {
        const [pdfData, generalData, specsData] = await Promise.all([
            getPdfSettings(true),
            getSettings(),
            getProductSpecs(),
        ]);
        
        setPdfSettings(pdfData);
        setGlobalSettings(generalData as Settings);
        setProductSpecs(specsData);
    }
    
    fetchAllSettings();
  }, []);

  useEffect(() => {
    const currentQuote = quote;
    
    async function fetchCityDetails() {
      if (!currentQuote) return;
      if (!currentQuote.selectedCityId || currentQuote.selectedCityId === 'unconfigured') {
        setSelectedCity(null);
        return;
      }
      
      try {
        const cityDocRef = doc(firestore, 'cities', currentQuote.selectedCityId);
        const cityDocSnap = await getDoc(cityDocRef);
        
        if (cityDocSnap.exists()) {
          setSelectedCity({ id: cityDocSnap.id, ...cityDocSnap.data() } as City);
        } else {
          setSelectedCity(null);
        }
      } catch (error) {
        console.error("Error fetching city details:", error);
        setSelectedCity(null);
      }
    }

    fetchCityDetails();
  }, [quote]);
  
  useEffect(() => {
    if (initialQuote) {
        setQuote(initialQuote);
        setDeliveryCost(initialQuote.isDeliveryCostFinal ? (initialQuote.deliveryCost ?? 0) : 0);
        setLaborCost(initialQuote.installationCost || 0);
    }
  }, [initialQuote]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const calculateDiscount = (original: number, percent: number) => {
    return original - (original * (percent / 100));
  };
  
  const productsTotal = quote ? quote.products.reduce((sum, p) => sum + p.lineTotal, 0) : 0;

  const finalTotal = useMemo(() => {
    if (!quote) return 0;
    
    if (productDiscount === 0 && laborDiscount === 0 && deliveryDiscount === 0) {
      return quote.totalQuote;
    }
    
    const productsFinal = calculateDiscount(productsTotal, productDiscount);
    let laborFinal = 0;
    if (quote.includeInstallation) {
      laborFinal = calculateDiscount(laborCost, laborDiscount);
    }
    
    let deliveryFinal = 0;
    if (quote.includeDelivery) {
        deliveryFinal = calculateDiscount(deliveryCost, deliveryDiscount);
    }
    
    return productsFinal + laborFinal + deliveryFinal;

  }, [productsTotal, laborCost, deliveryCost, productDiscount, laborDiscount, deliveryDiscount, quote]);

  const quoteFileName = quote ? `${quote.id.substring(0, 6).toUpperCase()}-${quote.client.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : 'estimation.pdf';
  
  const discountedQuoteForPdf: QuoteRequest | null = useMemo(() => {
    if (!quote) return null;
    
    const serializableQuote: QuoteRequest = {
        ...quote,
        createdAt: quote.createdAt,
        totalQuote: finalTotal,
        deliveryCost: calculateDiscount(deliveryCost, deliveryDiscount),
        installationCost: calculateDiscount(laborCost, laborDiscount),
        products: quote.products.map(p => ({
            ...p,
            rentalPeriod: p.rentalPeriod ? {
                from: p.rentalPeriod.from,
                to: p.rentalPeriod.to,
            } : undefined,
            rentalDate: p.rentalDate ? p.rentalDate : undefined,
        })),
    };
    return serializableQuote;

  }, [quote, finalTotal, deliveryCost, laborCost, deliveryDiscount, laborDiscount]);
  
  const generatePdf = async (view: 'client' | 'supplier') => {
    const containerId = view === 'client' ? 'pdf-render-view-client' : 'pdf-render-view-supplier';
    const quoteContainer = document.getElementById(containerId);

    if (!quoteContainer || !pdfSettings) {
        console.error("PDF render container not found or settings not loaded");
        return null;
    }

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 800));

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    if (view === 'client' && quote) {
        const pages = quoteContainer.querySelectorAll('.page-break-after');
        const targetPages = pages.length > 0 ? pages : [quoteContainer];

        for (let i = 0; i < targetPages.length; i++) {
            const page = targetPages[i] as HTMLElement;
            const canvas = await html2canvas(page, {
                scale: 3,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }

        // Auto-persist client PDF if missing
        if (!quote.pdfUrl) {
            try {
                const pdfBlob = pdf.output('blob');
                const storageRef = ref(storage, `quotes/pdfs/${quote.id}.pdf`);
                await uploadBytes(storageRef, pdfBlob);
                const pdfUrl = await getDownloadURL(storageRef);
                await updateQuotePdfUrl(quote.id, pdfUrl);
                setQuote(prev => prev ? { ...prev, pdfUrl } : undefined);
                console.log("✅ Admin persisted client PDF to storage.");
            } catch (err) {
                console.error("Failed to persist client PDF from admin view:", err);
            }
        }
    } else {
        // Supplier view is usually single page
        const canvas = await html2canvas(quoteContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
    
    return pdf;
  }

  const handleDownloadPdf = async (view: 'client' | 'supplier') => {
    if (view === 'client' && quote?.pdfUrl) {
        window.open(quote.pdfUrl, '_blank');
        return;
    }
    const pdf = await generatePdf(view);
    if (pdf) {
        pdf.save(quoteFileName);
    }
  };

  const handleViewPdf = async (view: 'client' | 'supplier') => {
      if (view === 'client' && quote?.pdfUrl) {
          window.open(quote.pdfUrl, '_blank');
          return;
      }
      const pdf = await generatePdf(view);
      if (pdf) {
          window.open(pdf.output('bloburl'), '_blank');
      }
  };

  
  const totalArea = quote ? quote.products.reduce((sum, p) => sum + (p.width * p.height * p.quantity), 0) : 0;

  const handleUpdateRequest = (updatedData: Partial<QuoteRequest>, updatedSpecs?: Record<string, ProductSpec[]>) => {
    setQuote(prev => prev ? { ...prev, ...updatedData } : undefined);
    if(updatedSpecs) {
      setProductSpecs(updatedSpecs);
    }
  };

  if (!quote) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin mr-2"/> Chargement de l'estimation...
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" className="hidden sm:inline-flex" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              Détails de l'estimation <span className="font-mono text-base text-muted-foreground">EST-{quote.id.substring(0, 6).toUpperCase()}</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="sm:hidden" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
            <Button variant="outline" onClick={() => setIsClientModalOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Client
            </Button>
            <Button variant="outline" onClick={() => setIsSupplierModalOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Fournisseur
            </Button>
            <TransmitToSupplierDialog
                quotes={[quote]}
                onSuccess={() => {
                  router.refresh();
                  const newQuote = {...quote, status: 'in_progress' as const};
                  setQuote(newQuote);
                }}
            >
              <Button variant="outline" disabled={quote.status !== 'processed'}>
                <Truck className="mr-2 h-4 w-4" />
                Transmettre
              </Button>
            </TransmitToSupplierDialog>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><User size={20}/> Client</CardTitle>
                 <EditClientDialog quote={quote} onUpdate={(updatedClient) => setQuote({ ...quote, client: updatedClient })} />
            </CardHeader>
            <CardContent className="text-sm space-y-1">
                <p><strong>Entreprise:</strong> {quote.client.companyName}</p>
                <p><strong>Email:</strong> {quote.client.email}</p>
                <p><strong>Téléphone:</strong> {quote.client.phone}</p>
                <p><strong>Adresse:</strong> {quote.client.address}</p>
                {quote.client.notes && <p><strong>Notes:</strong> {quote.client.notes}</p>}
                {quote.client.sitePhoto && (
                    <div className="mt-4">
                        <p className="font-semibold mb-2">Photo du site:</p>
                        <div className="relative group cursor-pointer" onClick={() => window.open(quote.client.sitePhoto, '_blank')}>
                            <img 
                                src={quote.client.sitePhoto} 
                                alt="Site" 
                                className="rounded-lg border shadow-sm max-h-48 object-cover hover:opacity-90 transition-opacity" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                <Eye className="text-white h-8 w-8" />
                            </div>
                        </div>
                    </div>
                )}
                {quote.trackingNumber && (
                  <div className="flex items-center gap-2 pt-2">
                    <strong>N° de suivi:</strong> <span>{quote.trackingNumber}</span>
                    <EditTrackingNumberDialog quote={quote} onUpdate={(updatedData) => setQuote(prev => ({...prev!, ...updatedData}))} />
                  </div>
                )}
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><History size={20}/> Historique</CardTitle>
            </CardHeader>
            <CardContent>
                <HistoryTimeline history={quote.history || []} />
            </CardContent>
        </Card>
      </div>

      <Accordion type="multiple" defaultValue={['products', 'delivery', 'labor']} className="w-full space-y-4">
        {/* Products Accordion */}
        <AccordionItem value="products" className="border-b-0">
           <Card>
            <AccordionTrigger className="p-6">
                <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2"><Package size={20}/> Produits</CardTitle>
                    <CardDescription>Total initial: {formatCurrency(productsTotal)}</CardDescription>
                </CardHeader>
            </AccordionTrigger>
            <AccordionContent className="p-6 pt-0">
                    {quote.products.length > 0 ? (
                        quote.products.map((p) => {
                            let durationText = null;
                            const productInfo = allProducts.find(prod => prod.id === p.productId);

                            if (p.transactionType === 'rental') {
                                if (p.rentalUnit === 'day' && p.rentalPeriod?.from && p.rentalPeriod?.to) {
                                    const from = new Date(p.rentalPeriod.from);
                                    const to = new Date(p.rentalPeriod.to);
                                    durationText = `Période: du ${format(from, "dd/MM/yy", { locale: fr })} au ${format(to, "dd/MM/yy", { locale: fr })} (${p.rentalDuration} j)`;
                                } else if (p.rentalUnit === 'hour' && p.rentalDate) {
                                    durationText = `Le ${format(new Date(p.rentalDate), 'dd/MM/yy', { locale: fr })} de ${p.rentalStartTime} à ${p.rentalEndTime} (${p.rentalDuration}h)`;
                                }
                            }

                            return (
                                <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-4 text-sm border-b last:border-0 py-3">
                                    <div>
                                        <p className="font-semibold">{p.productName} × {p.quantity}</p>
                                        <div className="flex items-center gap-2">
                                            {productInfo?.hasDimensions !== false && p.width > 0 && p.height > 0 && (
                                                <p className="text-muted-foreground">Dimensions: {p.width}m x {p.height}m</p>
                                            )}
                                            <Badge variant={p.transactionType === 'sale' ? 'default' : 'secondary'} className={p.transactionType === 'sale' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                                                {p.transactionType === 'sale' ? 'Vente' : 'Location'}
                                            </Badge>
                                        </div>
                                        {durationText && <p className="text-muted-foreground text-xs">{durationText}</p>}
                                    </div>
                                    <p className="font-medium text-right">{formatCurrency(p.lineTotal)}</p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed">
                             Aucun produit configuré pour cette estimation.
                        </div>
                    )}
                <div className="border p-4 rounded-lg mt-4 bg-muted/20">
                    <Label htmlFor="productDiscount" className="font-medium">Remise Produits (%)</Label>
                    <Input id="productDiscount" type="number" value={productDiscount} onChange={e => setProductDiscount(Number(e.target.value))} className="mt-2" />
                    <p className="text-sm mt-2">Nouveau total: <strong className="text-base">{formatCurrency(calculateDiscount(productsTotal, productDiscount))}</strong></p>
                </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Delivery Accordion */}
        {globalSettings?.isDeliveryStepEnabled && (
            <AccordionItem value="delivery" className="border-b-0">
            <Card>
                <AccordionTrigger className="p-6">
                    <CardHeader className="p-0 text-left">
                        <CardTitle className="flex items-center gap-2"><Truck size={20}/> Livraison</CardTitle>
                        <CardDescription>
                            {!quote.isDeliveryCostFinal
                                ? <span className="font-semibold text-red-500">À confirmer</span>
                                : `Coût configuré: ${formatCurrency(quote.deliveryCost ?? 0)}`
                            }
                        </CardDescription>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                    {selectedCity ? (
                        <div className="mb-4 p-3 border border-green-200 bg-green-50 dark:bg-green-950 rounded-md text-sm">
                            <p className="font-semibold text-green-800 dark:text-green-300">Destination configurée :</p>
                            <p className="text-green-700 dark:text-green-400">
                                {selectedCity.name} ({selectedCity.postalCode})
                            </p>
                        </div>
                    ) : quote.unconfiguredCityQuery ? (
                        <div className="mb-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
                            <p className="font-semibold text-blue-800 dark:text-blue-300">Demande pour :</p>
                            <p className="text-blue-700 dark:text-blue-400">{quote.unconfiguredCityQuery}</p>
                        </div>
                    ) : null}
                    
                    <div className="space-y-2">
                        <Label htmlFor="deliveryCost">Coût de livraison (€)</Label>
                        <Input id="deliveryCost" type="number" value={deliveryCost} onChange={e => setDeliveryCost(Number(e.target.value))} />
                    </div>
                    <div className="border p-4 rounded-lg mt-4 bg-muted/20">
                        <Label htmlFor="deliveryDiscount">Remise Livraison (%)</Label>
                        <Input id="deliveryDiscount" type="number" value={deliveryDiscount} onChange={e => setDeliveryDiscount(Number(e.target.value))} className="mt-2"/>
                        <p className="text-sm mt-2">Nouveau total: <strong className="text-base">{formatCurrency(calculateDiscount(deliveryCost, deliveryDiscount))}</strong></p>
                    </div>
                </AccordionContent>
            </Card>
            </AccordionItem>
        )}
        
        {/* Labor Accordion */}
        {globalSettings?.isInstallationStepEnabled ? (
            <AccordionItem value="labor" className="border-b-0">
            <Card>
                <AccordionTrigger className="p-6">
                    <CardHeader className="p-0 text-left">
                        <CardTitle className="flex items-center gap-2"><Wrench size={20}/> Main d'œuvre</CardTitle>
                        <CardDescription>Coût configuré: {formatCurrency(quote.installationCost || 0)}</CardDescription>
                    </CardHeader>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 space-y-4">
                    <p className="text-sm text-muted-foreground p-3 border rounded-lg bg-slate-50">
                        Pour une surface totale de {totalArea.toFixed(2)} m², votre projet nécessite {quote.techniciansRequired} technicien(s).
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="laborCost">Coût de main d'œuvre (€)</Label>
                        <Input id="laborCost" type="number" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} />
                    </div>
                    <div className="border p-4 rounded-lg mt-4 bg-muted/20">
                        <Label htmlFor="laborDiscount">Remise Main d'œuvre (%)</Label>
                        <Input id="laborDiscount" type="number" value={laborDiscount} onChange={e => setLaborDiscount(Number(e.target.value))} className="mt-2"/>
                        <p className="text-sm mt-2">Nouveau total: <strong className="text-base">{formatCurrency(calculateDiscount(laborCost, laborDiscount))}</strong></p>
                    </div>
                </AccordionContent>
            </Card>
            </AccordionItem>
        ) : (
             <AccordionItem value="labor" className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0 text-left">
                            <CardTitle className="flex items-center gap-2"><Wrench size={20}/> Main d'œuvre</CardTitle>
                            <CardDescription>Étape désactivée lors de l'estimation.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                     <AccordionContent className="p-6 pt-0">
                        <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-slate-50">
                            L'option d'installation n'a pas été présentée au client car elle était désactivée dans les paramètres généraux au moment de la création de l'estimation. Le coût devra être négocié manuellement.
                        </div>
                     </AccordionContent>
                </Card>
            </AccordionItem>
        )}
      </Accordion>

      <motion.div
        layout
        className="relative w-full rounded-xl p-5 shadow-xl overflow-hidden text-gray-900 font-semibold bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 dark:from-pink-800 dark:via-purple-800 dark:to-blue-800"
        style={{ backgroundSize: "200% 200%" }}
    >
        <div className="absolute inset-0 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rotate-12 scale-150 pointer-events-none" />
        <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center text-right">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Total Initial (HT)</p>
                    <p className="text-lg font-bold dark:text-white">{formatCurrency(quote.totalQuote)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Total Final (HT)</p>
                    <p className="text-2xl font-bold dark:text-white">{formatCurrency(finalTotal)}</p>
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/20">
                <Label htmlFor="vatRate" className="text-sm text-gray-700 dark:text-gray-300">TVA (%):</Label>
                <Input 
                    id="vatRate" 
                    type="number" 
                    value={vatRate} 
                    onChange={e => setVatRate(Number(e.target.value))}
                    className="w-20 h-9 bg-white/20 dark:bg-black/20 border-white/30 dark:border-black/30 text-right"
                />
            </div>
             <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 text-right">Total Final (TTC)</p>
                <p className="text-xl font-bold dark:text-white text-right">{formatCurrency(finalTotal * (1 + vatRate / 100))}</p>
            </div>
        </div>
      </motion.div>


      {/* Hidden div for rendering PDFs */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        {pdfSettings && discountedQuoteForPdf && <QuotePDF id="pdf-render-view-client" request={discountedQuoteForPdf} settings={pdfSettings} selectedCity={selectedCity} globalSettings={globalSettings} allProducts={allProducts} specs={productSpecs} />}
        {pdfSettings && <SupplierQuotePdf id="pdf-render-view-supplier" request={quote} specs={productSpecs} selectedCity={selectedCity} allProducts={allProducts} onUpdateRequest={handleUpdateRequest} />}
      </div>

        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Options PDF Client</DialogTitle>
                    <DialogDescription>
                       Prévisualisez ou téléchargez l'estimation formatée pour le client.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start gap-2">
                    <Button variant="outline" onClick={() => handleViewPdf('client')}>
                        <Eye className="mr-2 h-4 w-4" />
                        Prévisualiser
                    </Button>
                    <Button onClick={() => handleDownloadPdf('client')}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Vue Fournisseur</DialogTitle>
                    <DialogDescription>
                       Prévisualisez et téléchargez la fiche technique simplifiée.
                    </DialogDescription>
                </DialogHeader>
                 <div className="flex-grow overflow-auto bg-gray-200 p-4 rounded-md">
                    <div className="w-fit mx-auto">
                        {quote && <SupplierQuotePdf request={quote} specs={productSpecs} selectedCity={selectedCity} allProducts={allProducts} onUpdateRequest={handleUpdateRequest} />}
                    </div>
                </div>
                <DialogFooter className="sm:justify-start gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleViewPdf('supplier')}>
                        <Eye className="mr-2 h-4 w-4" />
                        Prévisualiser
                    </Button>
                    <Button onClick={() => handleDownloadPdf('supplier')}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
