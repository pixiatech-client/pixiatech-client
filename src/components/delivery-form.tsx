

'use client';

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import type { DeliverySettings, City, Settings, Locations } from '@/lib/types';
import { Alert, AlertDescription } from './ui/alert';
import { Combobox } from './ui/combobox';
import { useI18n } from '@/lib/i18n';

interface DeliveryFormProps {
    onBack: () => void;
    onNext: () => void;
    deliverySettings: DeliverySettings;
    onLocationChange: (cost: number, cityId: string | null, isFinal: boolean, unconfiguredQuery?: string) => void;
    totalQuote: number;
    settings: Settings;
    locations: Locations;
    hideFooter?: boolean;
}

export function DeliveryForm({ onBack, onNext, deliverySettings, onLocationChange, totalQuote, settings, locations, hideFooter }: DeliveryFormProps) {
    const [selectedCityId, setSelectedCityId] = useState('');
    const [isUnconfigured, setIsUnconfigured] = useState(false);
    const [unconfiguredQuery, setUnconfiguredQuery] = useState('');
    const { t, locale } = useI18n();
    
    const { villes: cities } = locations;
    const isLoadingCities = !cities;


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
    };
    
    const calculateAndPropagateCost = (cityId: string, unconfigured: boolean, query: string) => {
        let cost = -1;
        let isFinal = false;

        if (unconfigured) {
            cost = 0; // Cost is not final, will be determined later
            isFinal = false;
        } else if (deliverySettings.isDefaultFeeEnabled) {
            cost = deliverySettings.defaultFee;
            isFinal = true;
        } else if (cityId) {
            const selectedCity = cities?.find(c => c.id === cityId);
            if (selectedCity) {
                const cityRule = deliverySettings.deliveryFeeRules?.find(r => r.cityId === selectedCity.id);
                if (cityRule) {
                    cost = cityRule.fee;
                    isFinal = true;
                } else if (selectedCity.zoneId) {
                    const zoneRule = deliverySettings.deliveryFeeRules?.find(r => r.zoneId === selectedCity.zoneId && !r.cityId);
                    if (zoneRule) {
                        cost = zoneRule.fee;
                        isFinal = true;
                    }
                }
            }
        }
        
        if (cost !== -1 && isFinal) { // Only apply free shipping if a final cost has been determined
            if (deliverySettings.isTotalFreeDeliveryEnabled) {
                cost = 0;
            } else if (deliverySettings.isFreeDeliveryEnabled && totalQuote >= deliverySettings.freeDeliveryThreshold) {
                cost = 0;
            }
        }
        
        onLocationChange(cost, cityId, isFinal, unconfigured ? query : undefined);
    };

    const cityOptions = useMemo(() => {
        return cities?.map(c => ({ value: c.id, label: `${c.name} (${c.postalCode})` })) || [];
    }, [cities]);
    
    const handleValueChange = (value: string) => {
        setIsUnconfigured(false);
        setUnconfiguredQuery('');
        setSelectedCityId(value);
        calculateAndPropagateCost(value, false, '');
    }
    
    const handleEmptyResultClick = (searchQuery: string) => {
        setIsUnconfigured(true);
        setUnconfiguredQuery(searchQuery);
        setSelectedCityId('unconfigured'); // Use a special value
        calculateAndPropagateCost('unconfigured', true, searchQuery);
    }

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
                        <CardTitle>{settings.deliveryTitle?.[locale] ?? t("delivery.title")}</CardTitle>
                        <CardDescription>
                            {settings.deliveryMessage?.[locale] ?? t("delivery.description")}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow flex flex-col">
                <div className="space-y-4">
                    <Label className="text-muted-foreground font-semibold block text-center uppercase tracking-wider text-sm">{t('delivery.inputLabel')}</Label>
                    <Combobox
                        items={cityOptions}
                        value={selectedCityId}
                        onValueChange={handleValueChange}
                        placeholder={isLoadingCities ? t('common.loading') : t('delivery.inputPlaceholder')}
                        searchPlaceholder={t('delivery.inputSearchPlaceholder')}
                        disabled={isLoadingCities}
                        onEmptyResultClick={handleEmptyResultClick}
                        emptyResultLabel={
                            <div className="text-center">
                                <p className="font-bold">{t('delivery.unconfiguredZone')}</p>
                                <p className="text-xs">{deliverySettings.unconfiguredZoneMessage ? t(deliverySettings.unconfiguredZoneMessage) : t('delivery.unconfiguredMessage')}</p>
                                <p className="text-xs mt-2 font-semibold">{t('delivery.continue')}</p>
                            </div>
                        }
                    />
                </div>
                
                 {isUnconfigured && (
                    <Alert variant="info">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                           {deliverySettings.unconfiguredZoneMessage ? t(deliverySettings.unconfiguredZoneMessage) : t('delivery.unconfiguredMessage')}
                        </AlertDescription>
                    </Alert>
                )}
                
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
                             {settings.isPriceHidden && totalQuote > 0 ? (
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
                    <Button onClick={onNext} variant="styled" className="w-full hover:bg-black hover:text-white" size="lg" disabled={!selectedCityId}>
                        {t('delivery.next')}
                        <ChevronRight className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
