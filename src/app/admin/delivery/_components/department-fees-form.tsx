
'use client';

import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DeliverySettings, City, Zone } from '@/lib/types';
import { updateDeliverySettings } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle, Info, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const deliveryFeeRuleSchema = z.object({
  id: z.string(),
  zoneId: z.string().min(1, 'Zone requise'),
  cityId: z.string().optional(),
  fee: z.coerce.number().min(0, 'Doit être positif'),
});

const departmentFeesSchema = z.object({
  deliveryFeeRules: z.array(deliveryFeeRuleSchema),
});

type FormValues = z.infer<typeof departmentFeesSchema>;

interface DepartmentFeesFormProps {
    initialSettings: DeliverySettings;
}

export function DepartmentFeesForm({ initialSettings }: DepartmentFeesFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const zonesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'zones'), orderBy('name')) : null, [firestore]);
  const { data: zones, isLoading: isLoadingZones } = useCollection<Zone>(zonesQuery, { suppressPermissionError: true });

  const citiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'cities'), orderBy('name')) : null, [firestore]);
  const { data: cities, isLoading: isLoadingCities } = useCollection<City>(citiesQuery, { suppressPermissionError: true });
  
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [dialogAction, setDialogAction] = useState<{ type: 'delete', ids: string[] } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(departmentFeesSchema),
    defaultValues: {
      deliveryFeeRules: initialSettings.deliveryFeeRules?.map(rule => ({...rule})) || [],
    },
  });

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'deliveryFeeRules',
  });
  
  const watchedRules = form.watch('deliveryFeeRules');

  const onSubmit = async (data: FormValues) => {
    const formattedData = {
      ...initialSettings,
      deliveryFeeRules: data.deliveryFeeRules,
    };

    const result = await updateDeliverySettings(formattedData);
    if (result.success) {
      toast({ title: 'Succès', description: 'Tarifs par zone mis à jour.', variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
    }
  };
  
  const isOverridden = initialSettings.isDefaultFeeEnabled || initialSettings.isTotalFreeDeliveryEnabled;

  const handleClone = (index: number) => {
    const ruleToClone = form.getValues('deliveryFeeRules')[index];
    insert(index + 1, { ...ruleToClone, id: `rule_${Date.now()}` });
    toast({ title: 'Règle clonée', description: 'La règle a été dupliquée.', variant: 'info'});
  };
  
  const handleDeleteConfirm = () => {
    if (!dialogAction) return;
    
    const indicesToRemove = fields
        .map((field, index) => (dialogAction.ids.includes(field.id) ? index : -1))
        .filter(index => index !== -1)
        .reverse();

    indicesToRemove.forEach(index => remove(index));
    
    setSelectedRules([]);
    setDialogAction(null);
    toast({ title: `${indicesToRemove.length} règle(s) supprimée(s)`, variant: 'info'});
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRules(checked ? fields.map(f => f.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedRules(prev => checked ? [...prev, id] : prev.filter(ruleId => ruleId !== id));
  };
  
  const isAllSelected = selectedRules.length > 0 && selectedRules.length === fields.length;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {isOverridden && (
              <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                      {initialSettings.isTotalFreeDeliveryEnabled 
                          ? "La livraison gratuite totale est activée. Les tarifs par zone sont ignorés."
                          : "Les frais par défaut sont activés. Les tarifs par zone sont ignorés."
                      }
                  </AlertDescription>
              </Alert>
          )}

        <fieldset className="space-y-6 group" disabled={isOverridden}>
          <Card className='group-disabled:opacity-50 border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white'>
              <CardHeader className="flex-row items-center justify-between px-0 md:px-6">
                  <div>
                    <CardTitle>Tarifs par Zone</CardTitle>
                    <CardDescription>Définissez des coûts de livraison spécifiques pour chaque zone ou ville.</CardDescription>
                  </div>
                  {selectedRules.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setDialogAction({ type: 'delete', ids: selectedRules })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer la sélection ({selectedRules.length})
                    </Button>
                  )}
              </CardHeader>
              <CardContent className="space-y-4 px-0 md:px-6">
                  {isLoadingCities || isLoadingZones ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="animate-spin mr-2"/> Chargement...
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] items-center gap-4 px-3 py-2 font-medium text-muted-foreground text-sm">
                        <Checkbox checked={!!isAllSelected} onCheckedChange={handleSelectAll} />
                        <Label>Zone</Label>
                        <Label>Ville (Optionnel)</Label>
                        <Label>Tarif (€)</Label>
                    </div>
                    <div className="space-y-3">
                    {fields.map((field, index) => {
                        const selectedZoneId = watchedRules[index]?.zoneId;
                        const citiesInZone = cities?.filter(c => c.zoneId === selectedZoneId) || [];
                        const zone = zones?.find(z => z.id === selectedZoneId);

                        return (
                        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto_auto] items-center gap-2 p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/20">
                            <Checkbox
                            checked={selectedRules.includes(field.id)}
                            onCheckedChange={(checked) => handleSelectOne(field.id, !!checked)}
                            />
                            <div className='flex items-center gap-2'>
                                {zone && <div className='w-3 h-3 rounded-full' style={{backgroundColor: zone.color}}/>}
                                <Controller
                                    control={form.control}
                                    name={`deliveryFeeRules.${index}.zoneId`}
                                    render={({ field }) => (
                                        <Combobox
                                        items={zones?.map(z => ({ value: z.id, label: z.name })) || []}
                                        value={field.value}
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue(`deliveryFeeRules.${index}.cityId`, ''); // Reset city on zone change
                                        }}
                                        placeholder="Zone"
                                        searchPlaceholder="Rechercher une zone..."
                                        />
                                    )}
                                />
                            </div>
                            <Controller
                            control={form.control}
                            name={`deliveryFeeRules.${index}.cityId`}
                            render={({ field }) => (
                                <Combobox
                                items={citiesInZone.map(c => ({ value: c.id, label: `${c.name} (${c.postalCode})` }))}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Toute la zone"
                                searchPlaceholder="Rechercher une ville..."
                                disabled={!selectedZoneId || citiesInZone.length === 0}
                                />
                            )}
                            />
                            <Controller
                            control={form.control}
                            name={`deliveryFeeRules.${index}.fee`}
                            render={({ field: inputField }) => (
                                <Input type="number" placeholder="Tarif €" className="w-full sm:w-28" {...inputField} value={inputField.value ?? ''} />
                            )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleClone(index)}>
                            <Copy className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setDialogAction({ type: 'delete', ids: [field.id] })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                        )
                    })}
                    </div>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id: `rule_${Date.now()}`, zoneId: '', cityId: '', fee: 0 })}
                    disabled={isLoadingCities || isLoadingZones}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une règle de tarif
                  </Button>
              </CardContent>
          </Card>
        </fieldset>

        <div className="flex justify-end pt-4">
          <Button variant="styled" type="submit" disabled={form.formState.isSubmitting || isOverridden}>
            {form.formState.isSubmitting ? 'Sauvegarde...' : 'Sauvegarder les tarifs'}
          </Button>
        </div>
      </form>
      
       <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer {dialogAction?.ids.length} règle(s) de tarification. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
