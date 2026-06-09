
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
  freeDeliveryThreshold: z.coerce.number().min(0, 'Must be positive'),
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
      toast({ title: 'Success', description: 'Free shipping settings updated.', variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred.' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-0 md:border rounded-none md:rounded-xl shadow-none md:shadow-sm bg-transparent md:bg-white">
            <CardHeader className="px-0 md:px-6">
                <CardTitle>Free shipping by threshold</CardTitle>
                <CardDescription>Offer free shipping for orders exceeding a certain amount.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
                <fieldset disabled={isTotalFreeDeliveryEnabled} className="space-y-6 group">
                    <div className="flex items-center justify-between rounded-none md:rounded-lg border-x-0 md:border-x border-y p-4 group-disabled:opacity-50 transition-opacity">
                        <div>
                            <Label htmlFor="isFreeDeliveryEnabled" className="font-semibold">Enable free shipping by threshold</Label>
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
                <CardTitle>Total Free Shipping</CardTitle>
                <CardDescription>Makes shipping free for all orders, ignoring other fees.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
                <div className="flex items-center justify-between rounded-none md:rounded-lg border-x-0 md:border-x border-y p-4">
                    <div>
                        <Label htmlFor="isTotalFreeDeliveryEnabled" className="font-semibold">Enable free shipping for everyone</Label>
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
            <CardTitle>Message for unconfigured zone</CardTitle>
            <CardDescription>
              This message will appear if a customer searches for a city not yet in your database.
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
                  placeholder="This zone is not yet configured..."
                />
              )}
            />
          </CardContent>
        </Card>

      <div className="flex justify-end pt-4">
        <Button variant="styled" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
