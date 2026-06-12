
'use client';

import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LaborSettings } from '@/lib/types';
import { updateLaborSettings } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAdminT } from '@/hooks/useAdminT';

const laborRuleSchema = z.object({
  id: z.string(),
  minSqM: z.coerce.number().min(0, 'Must be positive'),
  technicians: z.coerce.number().min(1, 'At least 1 technician'),
  price: z.coerce.number().min(0, 'Must be positive'),
});

const laborSettingsSchema = z.object({
  rules: z.array(laborRuleSchema),
});

type FormValues = z.infer<typeof laborSettingsSchema>;

export function LaborForm({ initialSettings }: { initialSettings: LaborSettings }) {
  const { toast } = useToast();
  const { t } = useAdminT();

  const form = useForm<FormValues>({
    resolver: zodResolver(laborSettingsSchema),
    defaultValues: {
      rules: initialSettings.rules,
    },
  });

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'rules',
  });

  const onSubmit = async (data: FormValues) => {
    // Sort rules by minSqM to ensure correct evaluation later
    const sortedRules = [...data.rules].sort((a, b) => a.minSqM - b.minSqM);
    
    const result = await updateLaborSettings({ ...data, rules: sortedRules });
    if (result.success) {
      toast({ title: t('Success'), description: t('Labor rules updated.'), variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: t('Error'), description: t('An error occurred.') });
    }
  };

  const handleClone = (index: number) => {
    const ruleToClone = form.getValues('rules')[index];
    insert(index + 1, {
      ...ruleToClone,
      id: `rule_${Date.now()}`, // Ensure a new unique ID
    });
    toast({ title: t('Rule cloned'), description: t('The rule has been duplicated.'), variant: 'info' });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">{t('Labor scale')}</h3>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-4 px-3 py-2 font-medium text-muted-foreground">
                <Label>{t('From (m²)')}</Label>
                <Label>{t('No. Technicians')}</Label>
                <Label>{t('Rate (€)')}</Label>
                <span className="w-9"></span>
                <span className="w-9"></span>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-4 p-3 rounded-lg border bg-slate-50/80 dark:bg-slate-800/20">
                  <div className='sm:hidden'><Label>{t('From (m²)')}</Label></div>
                  <Controller
                    control={form.control}
                    name={`rules.${index}.minSqM`}
                    render={({ field: inputField }) => (
                      <Input type="number" placeholder="0" {...inputField} />
                    )}
                  />
                  <div className='sm:hidden'><Label>{t('No. Technicians')}</Label></div>
                  <Controller
                    control={form.control}
                    name={`rules.${index}.technicians`}
                    render={({ field: inputField }) => (
                      <Input type="number" placeholder="2" {...inputField} />
                    )}
                  />
                   <div className='sm:hidden'><Label>{t('Rate (€)')}</Label></div>
                  <Controller
                    control={form.control}
                    name={`rules.${index}.price`}
                    render={({ field: inputField }) => (
                      <Input type="number" placeholder="100" {...inputField} />
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleClone(index)}>
                    <Copy className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: `rule_${Date.now()}`, minSqM: 0, technicians: 2, price: 100 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('Add a rule')}
            </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="styled" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('Saving...') : t('Save rules')}
        </Button>
      </div>
    </form>
  );
}
