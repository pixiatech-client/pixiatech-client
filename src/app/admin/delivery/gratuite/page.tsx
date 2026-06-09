
import { getDeliverySettings } from '@/app/admin/actions';
import { FreeShippingForm } from '../_components/free-shipping-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function FreeShippingPage() {
  const settings = await getDeliverySettings();
  return (
    <Card>
        <CardHeader>
            <CardTitle>Free Shipping</CardTitle>
            <CardDescription>
                Configure conditions to offer free shipping to your customers,
                either from a certain amount or for all orders.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <FreeShippingForm initialSettings={settings} />
        </CardContent>
    </Card>
  );
}
