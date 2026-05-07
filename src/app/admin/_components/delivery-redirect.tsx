
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
        <Card className="rounded-[2.5rem] border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
            <CardHeader className="pb-8 pt-10 px-10 border-b border-gray-50 bg-white">
                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Logistique & Livraison</CardTitle>
                <CardDescription className="text-base font-medium text-slate-500 mt-2">
                    Gérez vos zones de livraison, tarifs et seuils de gratuité en un seul endroit.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-10 bg-gray-50/30">
                <Accordion type="multiple" defaultValue={["zones"]} className="w-full space-y-6">
                    
                    {/* Zones Section */}
                    <AccordionItem value="zones" className="border-0 rounded-[2rem] bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                                    <Map className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold text-slate-900">Zones de Livraison</div>
                                    <div className="text-sm text-slate-500 font-medium">Définissez vos secteurs géographiques</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8 pt-2 border-t border-gray-50">
                            <ZoneManager />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Tarifs Section */}
                    <AccordionItem value="tarifs" className="border-0 rounded-[2rem] bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm">
                                    <Truck className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold text-slate-900">Tarifs par Zone</div>
                                    <div className="text-sm text-slate-500 font-medium">Configurez les prix de transport spécifiques</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8 pt-2 border-t border-gray-50">
                            <DepartmentFeesForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Frais par Défaut Section */}
                    <AccordionItem value="default" className="border-0 rounded-[2rem] bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm">
                                    <Settings className="w-6 h-6 text-slate-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold text-slate-900">Frais par Défaut</div>
                                    <div className="text-sm text-slate-500 font-medium">Prix fixe pour les zones non configurées</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8 pt-2 border-t border-gray-50">
                            <DefaultFeeForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Livraison Gratuite Section */}
                    <AccordionItem value="gratuite" className="border-0 rounded-[2rem] bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                        <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shadow-sm">
                                    <Percent className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold text-slate-900">Livraison Gratuite</div>
                                    <div className="text-sm text-slate-500 font-medium">Gérez les seuils et conditions de gratuité</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8 pt-2 border-t border-gray-50">
                            <FreeShippingForm initialSettings={settings} />
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </CardContent>
        </Card>
    );
}