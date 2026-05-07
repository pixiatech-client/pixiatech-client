

'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { Product, ConfiguredProduct, Settings } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Link as LinkIcon,
  Plus,
  Trash2,
  ShoppingCart,
  Building,
  Sun,
  Snowflake,
  Video,
  Image as ImageIcon,
  X,
  AlertCircle,
  Minus,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from './ui/tooltip';
import { Input } from './ui/input';
import Preview from './preview';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { useI18n } from '@/lib/i18n';
import type { DateRange } from 'react-day-picker';

type ConfiguratorProps = {
  allProducts: Product[];
  configuredProducts: ConfiguredProduct[];
  setConfiguredProducts: React.Dispatch<React.SetStateAction<ConfiguredProduct[]>>;
  activeConfigProductId: string | null;
  setActiveConfigProductId: (id: string | null) => void;
  quote: number;
  onNext: () => void;
  settings: Settings;
  onMediaToggle: (url: string, type: 'video' | 'image') => void;
  onInteraction: () => void;
};

type AddProductStep = 'idle' | 'picking_transaction' | 'picking_type';

type NewProductFilters = {
    transactionType: 'sale' | 'rental' | null;
    productType: ('indoor' | 'outdoor' | 'showcase') | null;
}

const hours = Array.from({ length: 24 }, (_, i) => {
  const hourString = i.toString().padStart(2, '0');
  return { value: `${hourString}:00`, label: `${hourString}h` };
});


export function Configurator({
  allProducts,
  configuredProducts,
  setConfiguredProducts,
  activeConfigProductId,
  setActiveConfigProductId,
  quote,
  onNext,
  settings,
  onMediaToggle,
  onInteraction,
}: ConfiguratorProps) {
  const hasProductsForSale = useMemo(() => allProducts.some(p => p.availableFor.includes('sale')), [allProducts]);
  const hasProductsForRental = useMemo(() => allProducts.some(p => p.availableFor.includes('rental')), [allProducts]);
  
  const [addProductStep, setAddProductStep] = useState<AddProductStep>('idle');
  const [newProductFilters, setNewProductFilters] = useState<NewProductFilters>({ transactionType: null, productType: null });
  const [openCalendars, setOpenCalendars] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);
  const [showCalcCard, setShowCalcCard] = useState(false);
  const { t, locale } = useI18n();

  const dateLocale = locale === 'en' ? enUS : fr;

  const activeConfig = useMemo(() => 
    configuredProducts.find(p => p.id === activeConfigProductId)
  , [configuredProducts, activeConfigProductId]);

  const selectedProductDetails = useMemo(() => 
    allProducts.find(p => p.id === activeConfig?.productId)
  , [allProducts, activeConfig]);
  
  // Derived calculations for the dynamic card
  const area = useMemo(() => (activeConfig?.width ?? 0) * (activeConfig?.height ?? 0), [activeConfig]);
  const tileArea = useMemo(() => {
      if (!selectedProductDetails || !selectedProductDetails.tileWidth || !selectedProductDetails.tileHeight) return 0;
      return (selectedProductDetails.tileWidth / 100) * (selectedProductDetails.tileHeight / 100);
  }, [selectedProductDetails]);
  const tilesNeeded = useMemo(() => {
      if (tileArea === 0) return 0;
      return Math.ceil(area / tileArea);
  }, [area, tileArea]);

  const maxRentalArea = selectedProductDetails?.maxRentalArea;
  
  const currentMaxWidth = useMemo(() => {
    if (activeConfig?.transactionType === 'rental') {
      return settings.maxRentalWidth ?? settings.maxWidth;
    }
    return settings.maxWidth;
  }, [activeConfig?.transactionType, settings.maxWidth, settings.maxRentalWidth]);

  const currentMaxHeight = useMemo(() => {
    if (activeConfig?.transactionType === 'rental') {
      return settings.maxRentalHeight ?? settings.maxHeight;
    }
    return settings.maxHeight;
  }, [activeConfig?.transactionType, settings.maxHeight, settings.maxRentalHeight]);

  const areAllProductsValid = useMemo(() => {
    if (configuredProducts.length === 0) return false;
    return configuredProducts.every(p => {
      const productDetails = allProducts.find(prod => prod.id === p.productId);
      if (!productDetails || (productDetails.minArea ?? 0) === 0) {
        return true; // No minimum area defined, so it's valid
      }
      const productArea = p.width * p.height;
      return productArea >= productDetails.minArea!;
    });
  }, [configuredProducts, allProducts]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getMediaType = (url: string | undefined): 'video' | 'image' | 'none' => {
    if (!url) return 'none';
    const cleanUrl = url.split('?')[0].toLowerCase();
    
    if (cleanUrl.includes('.mp4') || cleanUrl.includes('.webm') || cleanUrl.includes('.mov') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      return 'video';
    }
    if (cleanUrl.includes('.jpg') || cleanUrl.includes('.jpeg') || cleanUrl.includes('.png') || cleanUrl.includes('.gif') || cleanUrl.includes('.webp') || cleanUrl.includes('.svg')) {
      return 'image';
    }
    return 'none';
  };

  const toggleCalendar = (id: string) => {
    setOpenCalendars(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  
  const formatDimension = (value: number) => {
    if (Number.isInteger(value)) {
        return value;
    }
    const fixed = value.toFixed(2);
    // Remove trailing zeros after the decimal point
    return parseFloat(fixed).toString();
  };

  const handleUpdateProduct = useCallback((id: string, field: keyof ConfiguredProduct, value: any) => {
    setShowCalcCard(true); // Show calc card on any update
    onInteraction();
    setConfiguredProducts((currentProducts: ConfiguredProduct[]) => 
      currentProducts.map(p => {
        if (p.id === id) {
          const updatedProduct = { ...p, [field]: value };
          
          if (field === 'quantity') {
            const numValue = parseInt(value, 10);
            if (isNaN(numValue) || numValue < 1) {
              updatedProduct.quantity = 1;
            } else {
              updatedProduct.quantity = numValue;
            }
          }

          if (field === 'rentalPeriod' && value?.from && value?.to) {
            updatedProduct.rentalDuration = differenceInDays(value.to, value.from) + 1;
          }

          if ((field === 'rentalStartTime' || field === 'rentalEndTime') && updatedProduct.rentalStartTime && updatedProduct.rentalEndTime) {
            const [startHour, startMinute] = updatedProduct.rentalStartTime.split(':').map(Number);
            const [endHour, endMinute] = updatedProduct.rentalEndTime.split(':').map(Number);
            if (!isNaN(startHour) && !isNaN(endHour)) {
              const startDate = new Date(0, 0, 0, startHour, startMinute);
              const endDate = new Date(0, 0, 0, endHour, endMinute);
              let diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
              if (diffHours < 0) diffHours = 0;
              updatedProduct.rentalDuration = Math.ceil(diffHours);
            }
          }

          if (field === 'productId') {
              const newProductDetails = allProducts.find(prod => prod.id === value);
              if (newProductDetails?.tileWidth && newProductDetails.tileHeight) {
                  updatedProduct.width = newProductDetails.tileWidth / 100;
                  updatedProduct.height = newProductDetails.tileHeight / 100;
              }
          }
          
          return updatedProduct;
        }
        return p;
      })
    );
  }, [setConfiguredProducts, allProducts, onInteraction]);
  
  const handleQuantityBlur = (id: string) => {
    const updatedProducts = configuredProducts.map(p => {
        if (p.id === id) {
            const quantity = parseInt(p.quantity as any, 10);
            if (isNaN(quantity) || quantity < 1) {
                return { ...p, quantity: 1 };
            }
        }
        return p;
    });
    setConfiguredProducts(updatedProducts);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    handleUpdateProduct(id, 'quantity', newQuantity);
  };
  
  const startAddProduct = () => {
    onInteraction();
    setAddProductStep('picking_transaction');
  }

  const handleTransactionSelect = (type: 'sale' | 'rental') => {
    setNewProductFilters(prev => ({ ...prev, transactionType: type }));
    setAddProductStep('picking_type');
  }

  const handleProductTypeSelect = (type: 'indoor' | 'outdoor' | 'showcase') => {
    const filters = { ...newProductFilters, productType: type };
    
    const availableProducts = allProducts.filter(p => 
      p.availableFor.includes(filters.transactionType!) &&
      p.type.includes(filters.productType!)
    );

    if (availableProducts.length > 0) {
      const newProductId = `config_${Date.now()}`;
      const firstProduct = availableProducts[0];
      const isRental = filters.transactionType === 'rental';

      const initialWidth = (firstProduct.tileWidth ?? 0) > 0 ? firstProduct.tileWidth! / 100 : (isRental ? (settings.maxRentalWidth ?? settings.defaultWidth) : settings.defaultWidth);
      const initialHeight = (firstProduct.tileHeight ?? 0) > 0 ? firstProduct.tileHeight! / 100 : (isRental ? (settings.maxRentalHeight ?? settings.defaultHeight) : settings.defaultHeight);
      
      const newProduct: ConfiguredProduct = {
        id: newProductId,
        productId: firstProduct.id,
        productType: filters.productType!,
        width: initialWidth,
        height: initialHeight,
        quantity: 1,
        transactionType: filters.transactionType!,
        rentalDuration: 1,
        rentalUnit: 'day',
        rentalPeriod: filters.transactionType === 'rental' ? {
          from: new Date(),
          to: new Date(),
        } : undefined,
        rentalDate: isRental ? new Date() : undefined,
        rentalStartTime: isRental ? '09:00' : undefined,
        rentalEndTime: isRental ? '18:00' : undefined,
      };

      if (isRental) {
          if (newProduct.width > (settings.maxRentalWidth ?? settings.maxWidth)) {
              newProduct.width = settings.maxRentalWidth ?? settings.maxWidth;
          }
          if (newProduct.height > (settings.maxRentalHeight ?? settings.maxHeight)) {
              newProduct.height = settings.maxRentalHeight ?? settings.maxHeight;
          }
      }

      setConfiguredProducts([...configuredProducts, newProduct]);
      setActiveConfigProductId(newProductId);
    } else {
      console.warn("No products match the selected filters.");
    }

    setAddProductStep('idle');
    setNewProductFilters({ transactionType: null, productType: null });
  }

  const handleRemoveProduct = (idToRemove: string) => {
    const newProducts = configuredProducts.filter(p => p.id !== idToRemove);
    setConfiguredProducts(newProducts);
    if (newProducts.length === 0) {
        setShowCalcCard(false);
    }
    if (activeConfigProductId === idToRemove) {
      setActiveConfigProductId(newProducts.length > 0 ? newProducts[0].id : null);
    }
  }

  const getFilteredProductsForLine = useCallback((transactionType: 'sale' | 'rental', productType: ('indoor'|'outdoor'|'showcase')) => {
      return allProducts.filter(p => 
          p.availableFor.includes(transactionType) &&
          p.type.includes(productType)
      );
  }, [allProducts]);

  const canAddMoreProducts = configuredProducts.length < (settings.maxProductsPerQuote ?? 5);

  const areDimensionsDisabled = !activeConfig;
  const shouldHideDimensions = activeConfig && selectedProductDetails?.hasDimensions === false;


  const checkProductAvailability = (transaction: 'sale' | 'rental', type: 'indoor' | 'outdoor' | 'showcase') => {
    return allProducts.some(p => p.availableFor.includes(transaction) && p.type.includes(type));
  };


  if (!isClient) {
    return (
      <Card className="w-full max-w-lg shadow-lg flex flex-col h-full rounded-xl">
        <CardContent className="pt-6">
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-lg shadow-lg flex flex-col h-full rounded-xl">
      <CardContent className="space-y-3 pt-6 flex flex-col relative">
        <div className="space-y-2 px-2">
          <Label className="text-muted-foreground font-semibold block text-center uppercase tracking-wider text-sm">
            {t('configurator.chooseProduct')}
          </Label>
          <div className="space-y-3">
            <AnimatePresence>
              {configuredProducts.map((p) => {
                const selectedProductDetails = allProducts.find(prod => prod.id === p.productId);
                const mediaType = getMediaType(selectedProductDetails?.videoUrl);
                const currentArea = p.width * p.height;
                const minAreaRequired = selectedProductDetails?.minArea ?? 0;
                const isAreaSufficient = currentArea >= minAreaRequired;

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    onClick={() => {
                        setActiveConfigProductId(p.id);
                        setShowCalcCard(true);
                        onInteraction();
                    }}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-all space-y-3",
                      activeConfigProductId === p.id ? 'border-primary bg-primary/5 shadow-md' : 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={p.transactionType === 'sale' ? 'default' : 'secondary'} className={cn("pointer-events-none", p.transactionType === 'sale' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800')}>
                                {t(`configurator.${p.transactionType}`)}
                            </Badge>
                            <span className="text-muted-foreground">|</span>
                             <Badge variant="outline">{t(`configurator.${p.productType}`)}</Badge>
                        </div>
                      <Button variant="ghost" size="icon" className='w-7 h-7' onClick={() => handleRemoveProduct(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                       <Select value={p.productId} onValueChange={(val) => handleUpdateProduct(p.id, 'productId', val)} >
                          <SelectTrigger className="flex-1 min-w-[150px]">
                            <SelectValue placeholder={t('configurator.product')} />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredProductsForLine(p.transactionType, p.productType).map((fp) => (
                                <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center border rounded-md bg-background">
                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={(e) => {e.stopPropagation(); handleQuantityChange(p.id, p.quantity - 1)}}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={p.quantity}
                                  onChange={(e) => handleUpdateProduct(p.id, 'quantity', e.target.value)}
                                  onBlur={() => handleQuantityBlur(p.id)}
                                  className="h-10 w-12 text-center text-base border-x border-y-0 rounded-none focus-visible:ring-0"
                                />
                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={(e) => {e.stopPropagation(); handleQuantityChange(p.id, p.quantity + 1)}}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Nombre d'écrans identiques pour cette configuration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" disabled={!selectedProductDetails?.productUrl}>
                                <a href={selectedProductDetails?.productUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <LinkIcon className="h-4 w-4 text-slate-500" />
                                </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{t('configurator.datasheet')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                       <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon" disabled={mediaType === 'none'} onClick={(e) => { e.stopPropagation(); mediaType !== 'none' && onMediaToggle(selectedProductDetails!.videoUrl!, mediaType) }}>
                                <div>
                                    {mediaType === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                                    {mediaType === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                                    {mediaType === 'none' && <Video className="h-4 w-4 text-slate-300" />}
                                </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{t('configurator.viewMedia')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {p.transactionType === 'rental' && (
                        <div className="flex flex-col gap-3">
                             <div className="flex-1 flex rounded-md shadow-sm min-w-[140px]">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateProduct(p.id, 'rentalUnit', 'day')}
                                    className={cn(
                                        "w-full rounded-l-lg border px-3 py-1.5 text-sm focus:z-10 focus:ring-2 focus:ring-ring transition-colors",
                                        p.rentalUnit === 'day' ? 'bg-primary text-white' : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    {t('configurator.days')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdateProduct(p.id, 'rentalUnit', 'hour')}
                                    className={cn(
                                        "w-full rounded-r-lg border border-l-0 px-3 py-1.5 text-sm focus:z-10 focus:ring-2 focus:ring-ring transition-colors",
                                        p.rentalUnit === 'hour' ? 'bg-primary text-white' : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    {t('configurator.hours')}
                                </button>
                            </div>
                            
                            {p.rentalUnit === 'day' && (
                                 <Popover open={openCalendars[p.id]} onOpenChange={(isOpen) => setOpenCalendars(prev => ({ ...prev, [p.id]: isOpen }))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-9",
                                                !p.rentalPeriod && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {p.rentalPeriod?.from ? (
                                                p.rentalPeriod.to ? (
                                                <>
                                                    {format(p.rentalPeriod.from, "dd LLL y", { locale: dateLocale })} -{" "}
                                                    {format(p.rentalPeriod.to, "dd LLL y", { locale: dateLocale })}
                                                </>
                                                ) : (
                                                format(p.rentalPeriod.from, "dd LLL y", { locale: dateLocale })
                                                )
                                            ) : (
                                                <span>{t('configurator.pickDateRange')}</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="range"
                                          selected={p.rentalPeriod}
                                          onSelect={(range) => {
                                            handleUpdateProduct(p.id, 'rentalPeriod', range);
                                            // Close calendar if range is complete
                                            if(range?.from && range?.to) {
                                                toggleCalendar(p.id);
                                            }
                                          }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {p.rentalUnit === 'hour' && (
                                <div className='flex flex-wrap items-center gap-2'>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full sm:w-[180px] justify-start text-left font-normal h-9",
                                                    !p.rentalDate && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {p.rentalDate ? format(new Date(p.rentalDate), "dd LLL y", { locale: dateLocale }) : <span>{t('configurator.pickDate')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={p.rentalDate}
                                                onSelect={(date) => handleUpdateProduct(p.id, 'rentalDate', date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex items-center gap-1">
                                        <Select value={p.rentalStartTime} onValueChange={(value) => handleUpdateProduct(p.id, 'rentalStartTime', value)}>
                                            <SelectTrigger className="w-[100px] h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {hours.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <span>-</span>
                                        <Select value={p.rentalEndTime} onValueChange={(value) => handleUpdateProduct(p.id, 'rentalEndTime', value)}>
                                            <SelectTrigger className="w-[100px] h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {hours.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-sm font-medium p-2 bg-muted rounded-md">{p.rentalDuration} heure(s)</div>
                                </div>
                            )}
                        </div>
                    )}
                     {minAreaRequired > 0 && (
                        <motion.div
                          key={`${p.id}-${isAreaSufficient}`}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "text-center text-xs font-semibold p-2 rounded-md",
                            isAreaSufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                          )}
                        >
                          {isAreaSufficient 
                            ? "Surface minimum atteinte."
                            : `Surface minimum de ${minAreaRequired} m² requise.`
                          }
                        </motion.div>
                     )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {canAddMoreProducts && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={addProductStep}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full"
                    >
                        {addProductStep === 'idle' && (
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                     <button className="btn btn-green-icon w-full" onClick={startAddProduct} data-add-product>
                                        <Plus className="icon-plus mr-2 h-4 w-4" /> {t('configurator.addProduct')}
                                     </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>{t('configurator.addProductTooltip')}</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {addProductStep === 'picking_transaction' && (
                            <div className='flex flex-wrap items-center gap-2 bg-muted p-1 rounded-md'>
                                <Button onClick={() => handleTransactionSelect('sale')} variant="glow" className="flex-1" disabled={!hasProductsForSale}>
                                  <ShoppingCart className="mr-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-green-400 group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                  {t('configurator.sale')}
                                </Button>
                                <Button onClick={() => handleTransactionSelect('rental')} variant="glow" className="flex-1" disabled={!hasProductsForRental}>
                                  <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                                  {t('configurator.rental')}
                                </Button>
                            </div>
                        )}
                        {addProductStep === 'picking_type' && (
                            <div className='flex flex-wrap items-center gap-2 bg-muted p-1 rounded-md'>
                               <Button 
                                  onClick={() => handleProductTypeSelect('indoor')} 
                                  variant="glow" 
                                  className="flex-1"
                                  disabled={!checkProductAvailability(newProductFilters.transactionType!, 'indoor')}
                                >
                                  <Building className="mr-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                  {t('configurator.indoor')}
                                </Button>
                                <Button 
                                  onClick={() => handleProductTypeSelect('outdoor')} 
                                  variant="glow" 
                                  className="flex-1"
                                  disabled={!checkProductAvailability(newProductFilters.transactionType!, 'outdoor')}
                                >
                                  <Sun className="mr-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                  {t('configurator.outdoor')}
                                </Button>
                                <Button 
                                  onClick={() => handleProductTypeSelect('showcase')} 
                                  variant="glow" 
                                  className="flex-1"
                                  disabled={!checkProductAvailability(newProductFilters.transactionType!, 'showcase')}
                                >
                                  <Snowflake className="mr-2 h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                  {t('configurator.showcase')}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
          </div>
        </div>

        <div className="lg:hidden my-2">
            <Preview 
                width={activeConfig?.width ?? 4}
                height={activeConfig?.height ?? 3}
                screenImageUrl={settings.previewScreenImageUrl}
                humanScaleImageUrl={settings.previewHumanScaleImageUrl}
            />
        </div>
        
        <div
          className={cn(
            'space-y-2 px-2 transition-opacity',
            areDimensionsDisabled && 'opacity-50 pointer-events-none',
            shouldHideDimensions && 'hidden lg:block lg:opacity-50 lg:pointer-events-none'
          )}
        >
            <Label className="text-muted-foreground font-semibold block text-center uppercase tracking-wider text-sm">
            {t('configurator.defineDimensions')}
            </Label>
            <div className="space-y-4">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                <Label>{t('configurator.width')}</Label>
                <span className="font-bold">{formatDimension(activeConfig?.width ?? settings.defaultWidth)} m</span>
                </div>
                <Slider
                min={1}
                max={currentMaxWidth}
                step={0.5}
                value={[activeConfig?.width ?? settings.defaultWidth]}
                onValueChange={([v]) =>
                    activeConfig ? handleUpdateProduct(activeConfig.id, 'width', v) : null
                }
                disabled={!activeConfig}
                />
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                <Label>{t('configurator.height')}</Label>
                <span className="font-bold">{formatDimension(activeConfig?.height ?? settings.defaultHeight)} m</span>
                </div>
                <Slider
                min={1}
                max={currentMaxHeight}
                step={0.5}
                value={[activeConfig?.height ?? settings.defaultHeight]}
                onValueChange={([v]) =>
                    activeConfig ? handleUpdateProduct(activeConfig.id, 'height', v) : null
                }
                disabled={!activeConfig}
                />
            </div>
            </div>
        </div>

        <AnimatePresence>
            {showCalcCard && selectedProductDetails?.hasDimensions && (
                <motion.div
                    layoutId='calc-card'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative px-2"
                >
                    <div className="bg-black text-white rounded-lg p-3 text-xs font-semibold relative">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 w-6 h-6 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setShowCalcCard(false)}>
                            <X className="w-4 h-4"/>
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="uppercase text-white/50">{t('configurator.totalArea')}</div>
                                <div className="text-lg font-bold text-blue-400">{area.toFixed(2)} m²</div>
                            </div>
                            <div className="text-right">
                                <div className="uppercase text-white/50">{t('configurator.tile')}</div>
                                <div className="text-lg font-bold text-blue-400">{selectedProductDetails?.tileWidth ?? 0}cm x {selectedProductDetails?.tileHeight ?? 0}cm</div>
                            </div>
                             <div>
                                <div className="uppercase text-white/50">{t('configurator.tiles')}</div>
                                <div className="text-lg font-bold text-blue-400">{tilesNeeded}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative mt-auto px-2 pb-1 space-y-4">
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
                        {settings.isPriceHidden && quote > 0 ? (
                             <p className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.indigo.400),theme(colors.indigo.100),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.indigo.100),theme(colors.indigo.400))] bg-[length:200%_auto] animate-gradient">{t('configurator.estimating')}</p>
                        ) : (
                            <>
                                <p className="uppercase text-lg tracking-widest text-white/80">{t('configurator.priceExclTax')}</p>
                                <AnimatePresence mode="wait">
                                    <motion.p
                                    key={quote}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-2xl font-bold"
                                    >
                                        {formatCurrency(quote)}
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
        </div>

      </CardContent>
      <CardFooter className='mt-6'>
        <Button onClick={onNext} variant="styled" className="w-full" size="lg" disabled={!areAllProductsValid}>
          {t('configurator.next')}
          <ChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
