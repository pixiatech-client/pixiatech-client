
import { DefaultFeeForm } from '../_components/default-fee-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliverySettings } from '@/lib/types';
import { getDeliverySettings } from '@/app/admin/actions';

export default async function DefaultFeePage() {
  const settings = await getDeliverySettings();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Fees</CardTitle>
        <CardDescription>
          Enable a base shipping cost that will apply to all orders,
          unless a specific zone rate or free shipping applies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DefaultFeeForm initialSettings={settings} />
      </CardContent>
    </Card>
  );
}
