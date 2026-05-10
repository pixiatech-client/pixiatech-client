
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DeliverySettings } from '@/lib/types';
import { updateDeliverySettings } from '@/app/admin/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const freeShippingSchema = z.object({
  isFreeDeliveryEnabled: z.boolean(),
  freeDeliveryThreshold: z.coerce.number().min(0, 'Doit être positif'),
  isTotalFreeDeliveryEnabled: z.boolean(),
  unconfiguredZoneMessage: z.string().optional(),
});

type FormValues = z.infer<typeof freeShippingSchema>;

export function FreeShippingForm({ initialSettings }: { initialSettings: DeliverySettings }) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(freeShippingSchema),
    defaultValues: {
      isFreeDeliveryEnabled: initialSettings.isFreeDeliveryEnabled,
      freeDeliveryThreshold: initialSettings.freeDeliveryThreshold,
      isTotalFreeDeliveryEnabled: initialSettings.isTotalFreeDeliveryEnabled,
      unconfiguredZoneMessage: initialSettings.unconfiguredZoneMessage,
    },
  });
  
  const isTotalFreeDeliveryEnabled = form.watch('isTotalFreeDeliveryEnabled');

  const onSubmit = async (data: FormValues) => {
    const formattedData = {
      ...initialSettings,
      ...data,
    };

    const result = await updateDeliverySettings(formattedData);
    if (result.success) {
      toast({ title: 'Succès', description: 'Paramètres de gratuité mis à jour.', variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
            <CardHeader className="px-0 md:px-6">
                <CardTitle>Livraison gratuite par seuil</CardTitle>
                <CardDescription>Offrir la livraison pour les commandes dépassant un certain montant.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
                <fieldset disabled={isTotalFreeDeliveryEnabled} className="space-y-6 group">
                    <div className="flex items-center justify-between rounded-none md:rounded-lg border-x-0 md:border-x border-y p-4 group-disabled:opacity-50 transition-opacity">
                        <div>
                            <Label htmlFor="isFreeDeliveryEnabled" className="font-semibold">Activer la livraison gratuite par seuil</Label>
                        </div>
                        <div className='flex items-center gap-4'>
                            <Input
                                id="freeDeliveryThreshold"
                                type="number"
                                className="w-32"
                                {...form.register('freeDeliveryThreshold')}
                                disabled={!form.watch('isFreeDeliveryEnabled')}
                            />
                            <Controller
                                control={form.control}
                                name="isFreeDeliveryEnabled"
                                render={({ field }) => (
                                <Switch
                                    id="isFreeDeliveryEnabled"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                )}
                            />
                        </div>
                    </div>
                </fieldset>
            </CardContent>
        </Card>

        <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
            <CardHeader className="px-0 md:px-6">
                <CardTitle>Livraison Gratuite Totale</CardTitle>
                <CardDescription>Rend la livraison gratuite pour toutes les commandes, ignorant les autres frais.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
                <div className="flex items-center justify-between rounded-none md:rounded-lg border-x-0 md:border-x border-y p-4">
                    <div>
                        <Label htmlFor="isTotalFreeDeliveryEnabled" className="font-semibold">Activer la livraison gratuite pour tous</Label>
                    </div>
                    <Controller
                        control={form.control}
                        name="isTotalFreeDeliveryEnabled"
                        render={({ field }) => (
                        <Switch
                            id="isTotalFreeDeliveryEnabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        )}
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
          <CardHeader className="px-0 md:px-6">
            <CardTitle>Message pour zone non configurée</CardTitle>
            <CardDescription>
              Ce message s'affichera si un client recherche une ville qui n'est pas encore dans votre base de données.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 md:px-6">
            <Controller
              control={form.control}
              name="unconfiguredZoneMessage"
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Cette zone n’est pas encore configurée..."
                />
              )}
            />
          </CardContent>
        </Card>

      <div className="flex justify-end pt-4">
        <Button variant="styled" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  );
}
