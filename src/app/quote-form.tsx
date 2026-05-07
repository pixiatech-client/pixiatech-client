
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { QuoteDetails, Settings, Product } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ChevronRight, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { createQuoteRequest } from '@/app/actions/quote-actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis'),
  address: z.string().min(1, "L'adresse est requise"),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions pour continuer.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface QuoteFormProps {
  quoteDetails: QuoteDetails;
  onBack: () => void;
  onSubmitted: (quoteId: string, email?: string) => void;
  settings: Settings;
  allProducts: Product[];
}


export function QuoteForm({ quoteDetails, onBack, onSubmitted, settings, allProducts }: QuoteFormProps) {
  console.log("DEBUG: QuoteForm Rendered");
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  // isSubmitting removed to prevent UI blockage
  const { t, locale } = useI18n();
  const dateLocale = locale === 'en' ? enUS : fr;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      termsAccepted: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("DEBUG: QuoteForm onSubmit triggered");
    // 1. PRIORITÉ ABSOLUE : Afficher l'UI de succès immédiatement
    onSubmitted('pending', data.email);
    
    // 2. BACKEND ASYNC : Exécution différée pour libérer le thread UI
    setTimeout(() => {
        void createQuoteRequest(user.uid, data, quoteDetails).then(result => {
            if (result.success && result.id) {
                onSubmitted(result.id, data.email);
            }
        }).catch(err => console.error("Background create failed:", err));
    }, 100);
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const productsSubtotal = quoteDetails.products.reduce((acc, p) => acc + p.lineTotal, 0);
  const installationCost = quoteDetails.installationCost;
  const deliveryCost = quoteDetails.deliveryCost ?? 0;
  const isDeliveryFinal = quoteDetails.isDeliveryCostFinal;
  const totalArea = quoteDetails.products
    .map(p => p.width * p.height * p.quantity)
    .reduce((acc, surface) => acc + surface, 0);

  const shouldAnimatePrice = settings.isPriceHidden && quoteDetails.totalQuote > 0;

  return (
    <Card className="w-full max-w-lg shadow-lg bg-card flex flex-col h-full rounded-xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} size="icon" className="p-3 rounded-full aspect-square scale-100 hover:translate-y-0">
                    <ArrowLeft />
                </Button>
                <div>
                    <CardTitle>{t('quoteForm.title')}</CardTitle>
                    <CardDescription>
                    {t('quoteForm.description')}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
                <div className="border rounded-lg p-4 bg-muted/20 dark:bg-slate-800/60 text-sm">
                    <h4 className="font-semibold mb-2">{t('quoteForm.summaryTitle')}</h4>
                    <div className="space-y-2">
                    {quoteDetails.products.map(p => {
                        const productInfo = allProducts.find(prod => prod.id === p.productId);
                        let durationText = '';
                        if (p.transactionType === 'rental') {
                        if (p.rentalUnit === 'day' && p.rentalPeriod?.from && p.rentalPeriod?.to) {
                            durationText = t('quoteForm.period', { from: format(new Date(p.rentalPeriod.from), 'dd/MM/yy', { locale: dateLocale }), to: format(new Date(p.rentalPeriod.to), 'dd/MM/yy', { locale: dateLocale }) });
                        } else if (p.rentalUnit === 'hour' && p.rentalDate) {
                            durationText = t('quoteForm.date', { date: format(new Date(p.rentalDate), 'dd/MM/yy', { locale: dateLocale }), start: p.rentalStartTime ?? '', end: p.rentalEndTime ?? '' });
                        }
                        }
                        return (
                        <div key={p.id} className="grid grid-cols-2 gap-x-4 gap-y-1 pb-2 border-b last:border-b-0">
                            <div className="col-span-2 font-medium flex items-center gap-2">
                            {t('quoteForm.productName', { productName: p.productName, quantity: p.quantity })}
                            <Badge variant={p.transactionType === 'sale' ? 'default' : 'secondary'} className={p.transactionType === 'sale' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                                {t(`configurator.${p.transactionType}`)}
                            </Badge>
                            </div>
                            {productInfo?.hasDimensions !== false && (
                            <>
                                <div className="text-sm">{t('quoteForm.dimensions')}</div><div className="font-medium text-right text-sm">{p.width}m x {p.height}m</div>
                            </>
                            )}
                            {durationText && <div className='text-xs col-span-2'>{durationText}</div>}
                            <div className="text-sm">{t('quoteForm.lineTotal')}</div><div className={cn("font-medium text-right text-sm", shouldAnimatePrice && "blur-sm")}>{formatCurrency(p.lineTotal)}</div>
                        </div>
                        )
                    })}
                    </div>
                    
                    <div className="mt-4 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>{t('quoteForm.subtotal')}</div>
                            <div className={cn("font-medium text-right", shouldAnimatePrice && "blur-sm")}>{formatCurrency(productsSubtotal)}</div>

                            {!settings.isDeliveryStepEnabled ? (
                                <>
                                    <div>{t('quoteForm.delivery')}</div>
                                    <div className="font-medium text-right text-blue-600 dark:text-blue-400">{t('quoteForm.tobeconfirmed')}</div>
                                </>
                            ) : quoteDetails.includeDelivery ? (
                                <>
                                    <div>{t('quoteForm.delivery')}</div>
                                    {isDeliveryFinal ? (
                                        <div className={cn("font-medium text-right", shouldAnimatePrice && "blur-sm")}>{deliveryCost > 0 ? formatCurrency(deliveryCost) : t('quoteForm.free')}</div>
                                    ) : (
                                        <div className="font-medium text-right text-blue-600 dark:text-blue-400">{t('quoteForm.tobeconfirmed')}</div>
                                    )}
                                </>
                            ) : null}
                            
                            {!settings.isInstallationStepEnabled ? (
                            <>
                                <div>{t('quoteForm.installation')}</div>
                                <div className="font-medium text-right text-blue-600 dark:text-blue-400">{t('quoteForm.tobeconfirmed')}</div>
                            </>
                            ) : quoteDetails.includeInstallation ? (
                            <>
                                <div>{t('quoteForm.installation')}</div>
                                <div className={cn("font-medium text-right", shouldAnimatePrice && "blur-sm")}>{installationCost > 0 ? formatCurrency(installationCost) : t('quoteForm.included')}</div>
                                <div className="text-xs text-muted-foreground col-span-2">{t('installation.requiredTechnicians', { totalArea: totalArea.toFixed(2), techniciansRequired: quoteDetails.techniciansRequired })}</div>
                            </>
                            ) : (
                                <>
                                    <div>{t('quoteForm.installation')}</div>
                                    <div className="font-medium text-right text-red-600">{t('quoteForm.userInstall')}</div>
                                </>
                            )}


                            <div className="col-span-2 my-2 border-t"></div>
                            <div className="text-base font-bold">{t('quoteForm.totalExclTax')}</div>
                            {shouldAnimatePrice ? (
                                <div className="text-base font-bold text-right bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.indigo.400),theme(colors.indigo.100),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.indigo.100),theme(colors.indigo.400))] bg-[length:200%_auto] animate-gradient">{t('configurator.estimating')}</div>
                            ) : (
                                <div className="text-base font-bold text-right">{formatCurrency(quoteDetails.totalQuote)}</div>
                            )}
                        </div>
                    </div>
                </div>

                <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('quoteForm.companyName')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('quoteForm.companyPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('quoteForm.email')}</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder={t('quoteForm.emailPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('quoteForm.phone')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('quoteForm.phonePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('quoteForm.address')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('quoteForm.addressPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('quoteForm.notes')}</FormLabel>
                    <FormControl>
                        <Textarea placeholder={settings.quoteFormNotesPlaceholder?.[locale] || t("quoteForm.notesPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex-grow"></div>
                <CardFooter className='p-0 mt-6 flex-col gap-4'>
                    <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm text-muted-foreground">
                                    J'accepte que ces données soient conservées et traitées dans le cadre de ma demande, et de la démarche commerciale qui en découle, conformément aux <Link href="https://pixiatech.com/mentions-legales/" target="_blank" className="underline hover:text-primary">mentions légales</Link>.
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Overlay removed to prioritize direct transition */}
                    
                    <Button type="submit" variant="styled" className="w-full hover:bg-black hover:text-white" size="lg" disabled={isUserLoading || !form.watch('termsAccepted')}>
                    {t('quoteForm.submit')}
                    <ChevronRight className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
