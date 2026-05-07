
import { getDeliverySettings } from '@/app/admin/actions';
import { FreeShippingForm } from '../_components/free-shipping-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function FreeShippingPage() {
  const settings = await getDeliverySettings();
  return (
    <Card>
        <CardHeader>
            <CardTitle>Livraison Gratuite</CardTitle>
            <CardDescription>
                Configurez les conditions pour offrir la livraison à vos clients,
                soit à partir d'un certain montant, soit pour toutes les commandes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <FreeShippingForm initialSettings={settings} />
        </CardContent>
    </Card>
  );
}
