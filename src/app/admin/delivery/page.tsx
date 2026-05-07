
import React from 'react';
import { getDeliverySettings } from '@/app/admin/actions';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Map, Truck, Settings, Percent } from 'lucide-react';
import { ZoneManager } from './_components/zone-manager';
import { DepartmentFeesForm } from './_components/department-fees-form';
import { DefaultFeeForm } from './_components/default-fee-form';
import { FreeShippingForm } from './_components/free-shipping-form';

export default async function DeliveryPage() {
  const settings = await getDeliverySettings();

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["zones", "tarifs", "default", "gratuite"]} className="w-full space-y-4">
        
        {/* Zones Section */}
        <AccordionItem value="zones" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Map className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-slate-900">Zones de Livraison</div>
                <div className="text-xs text-slate-500 font-medium">Gérez les zones géographiques et les départements</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t border-slate-100">
            <ZoneManager />
          </AccordionContent>
        </AccordionItem>

        {/* Tarifs Section */}
        <AccordionItem value="tarifs" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-slate-900">Tarifs par Zone</div>
                <div className="text-xs text-slate-500 font-medium">Définissez les frais de transport par zone et mode</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t border-slate-100">
            <DepartmentFeesForm initialSettings={settings} />
          </AccordionContent>
        </AccordionItem>

        {/* Frais par Défaut Section */}
        <AccordionItem value="default" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-slate-900">Frais par Défaut</div>
                <div className="text-xs text-slate-500 font-medium">Configuration globale pour les zones non définies</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t border-slate-100">
            <DefaultFeeForm initialSettings={settings} />
          </AccordionContent>
        </AccordionItem>

        {/* Livraison Gratuite Section */}
        <AccordionItem value="gratuite" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-slate-900">Livraison Gratuite</div>
                <div className="text-xs text-slate-500 font-medium">Définissez les seuils de gratuité totale</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t border-slate-100">
            <FreeShippingForm initialSettings={settings} />
          </AccordionContent>

        </AccordionItem>

      </Accordion>
    </div>
  );
}
