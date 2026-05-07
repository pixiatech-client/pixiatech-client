

'use client';

import { ArrowLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { Settings } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type InstallationFormProps = {
    onBack: () => void;
    onNext: () => void;
    setIncludeInstallation: (include: boolean) => void;
    includeInstallation: boolean;
    installationCost: number;
    totalQuote: number;
    techniciansRequired: number;
    totalArea: number;
    settings: Settings;
    hideFooter?: boolean;
};

export function InstallationForm({ 
    onBack, 
    onNext, 
    setIncludeInstallation, 
    includeInstallation,
    installationCost,
    totalQuote,
    techniciansRequired,
    totalArea,
    settings,
    hideFooter
}: InstallationFormProps) {
    
    const { t, locale } = useI18n();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
    };

    const shouldAnimatePrice = settings.isPriceHidden && totalQuote > 0;

    return (
        <Card className="w-full max-w-lg shadow-lg flex flex-col h-full bg-card rounded-xl mb-32">
            <CardHeader>
                <div className="flex items-center gap-4">
                    {!hideFooter && (
                        <Button variant="ghost" onClick={onBack} size="icon" className="p-3 rounded-full aspect-square scale-100 hover:translate-y-0">
                            <ArrowLeft />
                        </Button>
                    )}
                    <div>
                        <CardTitle>{settings.installationTitle?.[locale] || t("installation.title")}</CardTitle>
                        <CardDescription>
                            {settings.installationMessage?.[locale] || t("installation.description")}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow flex flex-col">
                <RadioGroup 
                    defaultValue={includeInstallation ? 'yes' : 'no'}
                    onValueChange={(value) => setIncludeInstallation(value === 'yes')}
                    className="space-y-4"
                >
                    <Label
                      htmlFor="installation-yes"
                      className="flex flex-col rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <div className='flex items-center justify-between w-full'>
                            <div>
                                <p className="font-semibold">{t('installation.yesLabel')}</p>
                                <p className="text-sm text-muted-foreground">{t('installation.yesDescription')}</p>
                            </div>
                            <RadioGroupItem value="yes" id="installation-yes" />
                        </div>
                         {includeInstallation && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="text-sm"
                                >
                                    <Separator className="my-3" />
                                    <p>{t('installation.requiredTechnicians', { totalArea: totalArea.toFixed(2), techniciansRequired })}</p>
                                    <p className={cn("font-bold mt-1", settings.isPriceHidden && installationCost > 0 && "blur-sm")}>{t('installation.cost', { cost: formatCurrency(installationCost) })}</p>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </Label>
                    <Label
                      htmlFor="installation-no"
                      className="flex items-center justify-between rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <div>
                            <p className="font-semibold">{t('installation.noLabel')}</p>
                            <p className="text-sm text-muted-foreground">{t('installation.noDescription')}</p>
                        </div>
                        <RadioGroupItem value="no" id="installation-no" />
                    </Label>
                </RadioGroup>
                
                 <AnimatePresence>
                    {!includeInstallation && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('installation.warningTitle')}</AlertTitle>
                                <AlertDescription>
                                    {settings.disclaimerMessage?.[locale]}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                 </AnimatePresence>
                
                 <motion.div
                    layout
                    className="relative w-full rounded-xl p-5 shadow-xl overflow-hidden text-white font-semibold gradient-bg"
                >
                    <div className="gradients-container">
                        <div className="g1"></div>
                        <div className="g2"></div>
                        <div className="g3"></div>
                        <div className="g4"></div>
                        <div className="g5"></div>
                    </div>
                    <div className="relative z-10 grid grid-rows-[auto_1fr_auto] h-full min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <span className="uppercase tracking-widest text-sm font-medium">{t('configurator.totalEstimate')}</span>
                            {settings.paymentIconUrl && (
                                <img
                                    src={settings.paymentIconUrl}
                                    className="h-10 opacity-80"
                                    alt="payment icon"
                                />
                            )}
                        </div>
                         <div className="text-center self-center py-2">
                            {shouldAnimatePrice ? (
                                <p className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.indigo.400),theme(colors.indigo.100),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.indigo.100),theme(colors.indigo.400))] bg-[length:200%_auto] animate-gradient">{t('configurator.estimating')}</p>
                            ) : (
                                <>
                                    <p className="uppercase text-lg tracking-widest text-white/80">{t('configurator.priceExclTax')}</p>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                        key={totalQuote}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xl font-bold"
                                        >
                                            {formatCurrency(totalQuote)}
                                        </motion.p>
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                        <div className="self-end text-right">
                            {settings.cardLogoUrl && (
                                <img
                                    src={settings.cardLogoUrl}
                                    className="h-5 opacity-80 ml-auto"
                                    alt="Card Logo"
                                />
                            )}
                        </div>
                    </div>
                </motion.div>

            </CardContent>
            {!hideFooter && (
                <CardFooter className='mt-6'>
                    <Button onClick={onNext} variant="styled" className="w-full hover:bg-black hover:text-white" size="lg">
                        {t('installation.next')}
                        <ChevronRight className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
