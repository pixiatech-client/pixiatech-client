'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import type { Settings as AppSettings } from '@/lib/types';
import { updateSettings } from '@/app/admin/actions';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

const flowSchema = z.object({
  estimationFlow: z.object({
    enableRentalPeriod: z.boolean(),
    enableDigitalSignature: z.boolean(),
    enableContractEditing: z.boolean(),
    saleContractTemplate: z.string().optional(),
    rentalContractTemplate: z.string().optional(),
    sale: z.object({
      taxMode: z.enum(['ht', 'ttc']),
      taxEnabled: z.boolean(),
      taxRate: z.coerce.number().min(0).max(100),
    }),
    rental: z.object({
      taxMode: z.enum(['ht', 'ttc']),
      taxEnabled: z.boolean(),
      taxRate: z.coerce.number().min(0).max(100),
    }),
  }),
});

type FormValues = z.infer<typeof flowSchema>;

interface FlowSettingsFormProps {
  initialSettings: AppSettings;
}

export function FlowSettingsForm({ initialSettings }: FlowSettingsFormProps) {
  const { toast } = useToast();
  const flow = initialSettings.estimationFlow || {
    enableRentalPeriod: true,
    enableDigitalSignature: true,
    enableContractEditing: false,
    sale: { taxMode: 'ht' as const, taxEnabled: false, taxRate: 0 },
    rental: { taxMode: 'ht' as const, taxEnabled: true, taxRate: 10 },
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(flowSchema),
    defaultValues: { estimationFlow: flow },
  });

  const saleTaxEnabled = form.watch('estimationFlow.sale.taxEnabled');
  const rentalTaxEnabled = form.watch('estimationFlow.rental.taxEnabled');

  const handleSave = async () => {
    const values = form.getValues();
    const result = await updateSettings(values);
    if (result.success) {
      toast({ title: 'Paramètres sauvegardés', description: 'Les options du parcours client ont été mises à jour.', variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue lors de la sauvegarde.' });
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parcours client</h2>
        <p className="text-sm text-slate-500 mt-1">Contrôle des options du parcours de devis, signature et validation.</p>
      </div>

      {/* Section 1: Options du parcours */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🎛️ Options du parcours</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Période de location</Label>
              <p className="text-xs text-slate-500">Afficher la carte des dates et horaires de location dans le résumé</p>
            </div>
            <Switch
              checked={form.watch('estimationFlow.enableRentalPeriod')}
              onCheckedChange={(v) => form.setValue('estimationFlow.enableRentalPeriod', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Signature numérique</Label>
              <p className="text-xs text-slate-500">Activer la signature électronique des contrats</p>
            </div>
            <Switch
              checked={form.watch('estimationFlow.enableDigitalSignature')}
              onCheckedChange={(v) => form.setValue('estimationFlow.enableDigitalSignature', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Édition des contrats</Label>
              <p className="text-xs text-slate-500">Permettre la modification du contenu des contrats vente et location</p>
            </div>
            <Switch
              checked={form.watch('estimationFlow.enableContractEditing')}
              onCheckedChange={(v) => form.setValue('estimationFlow.enableContractEditing', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Configuration TVA */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">💰 Configuration TVA</h3>

          {/* Sale tax config */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Vente</h4>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Activer TVA</Label>
                <Switch
                  checked={form.watch('estimationFlow.sale.taxEnabled')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.sale.taxEnabled', v)}
                />
              </div>
            </div>
            {saleTaxEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Affichage</Label>
                  <Select
                    value={form.watch('estimationFlow.sale.taxMode')}
                    onValueChange={(v) => form.setValue('estimationFlow.sale.taxMode', v as 'ht' | 'ttc')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ht">HT (hors taxe)</SelectItem>
                      <SelectItem value="ttc">TTC (toutes taxes comprises)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Taux TVA (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.watch('estimationFlow.sale.taxRate')}
                    onChange={(e) => form.setValue('estimationFlow.sale.taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            {!saleTaxEnabled && (
              <p className="text-xs text-slate-400 italic">100% HT — Aucune TVA appliquée</p>
            )}
          </div>

          {/* Rental tax config */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Location</h4>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Activer TVA</Label>
                <Switch
                  checked={form.watch('estimationFlow.rental.taxEnabled')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.rental.taxEnabled', v)}
                />
              </div>
            </div>
            {rentalTaxEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Affichage</Label>
                  <Select
                    value={form.watch('estimationFlow.rental.taxMode')}
                    onValueChange={(v) => form.setValue('estimationFlow.rental.taxMode', v as 'ht' | 'ttc')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ht">HT (hors taxe)</SelectItem>
                      <SelectItem value="ttc">TTC (toutes taxes comprises)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Taux TVA (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.watch('estimationFlow.rental.taxRate')}
                    onChange={(e) => form.setValue('estimationFlow.rental.taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            {!rentalTaxEnabled && (
              <p className="text-xs text-slate-400 italic">100% HT — Aucune TVA appliquée</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Templates de contrats */}
      {form.watch('estimationFlow.enableContractEditing') && (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">📄 Templates de contrats</h3>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Template contrat vente</Label>
              <textarea
                className="w-full h-32 rounded-xl border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
                value={form.watch('estimationFlow.saleContractTemplate') || ''}
                onChange={(e) => form.setValue('estimationFlow.saleContractTemplate', e.target.value)}
                placeholder="Laissez vide pour utiliser le contrat par défaut"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Template contrat location</Label>
              <textarea
                className="w-full h-32 rounded-xl border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
                value={form.watch('estimationFlow.rentalContractTemplate') || ''}
                onChange={(e) => form.setValue('estimationFlow.rentalContractTemplate', e.target.value)}
                placeholder="Laissez vide pour utiliser le contrat par défaut"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} className="w-full sm:w-auto">
        Enregistrer les paramètres
      </Button>
    </div>
  );
}
