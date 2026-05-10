
'use client';

import { useState, useEffect } from 'react';
import { getDeliverySettings } from '@/app/admin/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Loader2, Map, Truck, Settings, Percent } from 'lucide-react';
import { ZoneManager } from '../delivery/_components/zone-manager';
import { DepartmentFeesForm } from '../delivery/_components/department-fees-form';
import { DefaultFeeForm } from '../delivery/_components/default-fee-form';
import { FreeShippingForm } from '../delivery/_components/free-shipping-form';

export default function DeliveryContent() {
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getDeliverySettings().then(data => {
            setSettings(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    return (
        <Card className="rounded-none md:rounded-[2.5rem] border-0 shadow-none md:shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
            <CardHeader className="pb-6 pt-8 px-0 md:px-10 border-b border-gray-50 bg-white">
                <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight px-4 md:px-0">Logistique & Livraison</CardTitle>
                <CardDescription className="text-sm md:text-base font-medium text-slate-500 mt-2 px-4 md:px-0">
                    Gérez vos zones de livraison, tarifs et seuils de gratuité en un seul endroit.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-10 bg-gray-50/30">
                <Accordion type="multiple" defaultValue={["zones"]} className="w-full space-y-4 md:space-y-6">
                    
                    {/* Zones Section */}
                    <AccordionItem value="zones" className="border-0 rounded-none md:rounded-[2rem] bg-white overflow-hidden shadow-sm md:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-4 md:px-8 py-5 md:py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                                    <Map className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Zones de Livraison</div>
                                    <div className="text-[10px] md:text-sm text-slate-500 font-medium">Secteurs géographiques</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 md:px-8 pb-8 pt-2 border-t border-gray-50">
                            <ZoneManager />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Tarifs Section */}
                    <AccordionItem value="tarifs" className="border-0 rounded-none md:rounded-[2rem] bg-white overflow-hidden shadow-sm md:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-4 md:px-8 py-5 md:py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm">
                                    <Truck className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Tarifs par Zone</div>
                                    <div className="text-[10px] md:text-sm text-slate-500 font-medium">Prix de transport spécifiques</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 md:px-8 pb-8 pt-2 border-t border-gray-50">
                            <DepartmentFeesForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Frais par Défaut Section */}
                    <AccordionItem value="default" className="border-0 rounded-none md:rounded-[2rem] bg-white overflow-hidden shadow-sm md:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-4 md:px-8 py-5 md:py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm">
                                    <Settings className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Frais par Défaut</div>
                                    <div className="text-[10px] md:text-sm text-slate-500 font-medium">Zone non configurée</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 md:px-8 pb-8 pt-2 border-t border-gray-50">
                            <DefaultFeeForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Livraison Gratuite Section */}
                    <AccordionItem value="gratuite" className="border-0 rounded-none md:rounded-[2rem] bg-white overflow-hidden shadow-sm md:shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-4 md:px-8 py-5 md:py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-50 flex items-center justify-center shadow-sm">
                                    <Percent className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Livraison Gratuite</div>
                                    <div className="text-[10px] md:text-sm text-slate-500 font-medium">Seuils et conditions</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 md:px-8 pb-8 pt-2 border-t border-gray-50">
                            <FreeShippingForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </CardContent>
        </Card>
    );
}