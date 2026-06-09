
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const defaultFeeSchema = z.object({
  isDefaultFeeEnabled: z.boolean(),
  defaultFee: z.coerce.number().min(0, 'Must be positive'),
});

type FormValues = z.infer<typeof defaultFeeSchema>;

export function DefaultFeeForm({ initialSettings }: { initialSettings: DeliverySettings }) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(defaultFeeSchema),
    defaultValues: {
      isDefaultFeeEnabled: initialSettings.isDefaultFeeEnabled,
      defaultFee: initialSettings.defaultFee,
    },
  });
  
  const isDefaultFeeEnabled = form.watch('isDefaultFeeEnabled');
  const isOverridden = initialSettings.isTotalFreeDeliveryEnabled;

  const onSubmit = async (data: FormValues) => {
    const formattedData = {
      ...initialSettings,
      ...data,
    };

    const result = await updateDeliverySettings(formattedData);
    if (result.success) {
      toast({ title: 'Success', description: 'Default fees updated.', variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred.' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
       <fieldset className="space-y-4" disabled={isOverridden}>
          {isOverridden && (
              <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                       Total free shipping is enabled. Default fees are ignored and cannot be modified.
                  </AlertDescription>
              </Alert>
          )}
          <div className="rounded-none md:rounded-lg border-x-0 md:border-x border-y p-4 transition-opacity group-disabled:opacity-50">
            <div className="flex items-center justify-between">
              <div>
                  <Label htmlFor="isDefaultFeeEnabled" className="font-semibold">Default shipping fees</Label>
                  <p className="text-sm text-muted-foreground">Apply a base rate for all deliveries.</p>
              </div>
              <div className='flex items-center gap-4'>
                  <Input
                      id="defaultFee"
                      type="number"
                      className="w-32"
                      {...form.register('defaultFee')}
                      disabled={!form.watch('isDefaultFeeEnabled')}
                  />
                    <Controller
                      control={form.control}
                      name="isDefaultFeeEnabled"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isOverridden}
                        />
                      )}
                    />
              </div>
            </div>
          </div>
          {isDefaultFeeEnabled && !isOverridden && (
            <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertDescription>
                Enabling this option will disable zone rates and apply these general fees instead.
                </AlertDescription>
            </Alert>
          )}
       </fieldset>
      <div className="flex justify-end pt-4">
        <Button variant="styled" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
