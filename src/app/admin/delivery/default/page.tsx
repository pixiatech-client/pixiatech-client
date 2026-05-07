
import { DefaultFeeForm } from '../_components/default-fee-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliverySettings } from '@/lib/types';
import { getDeliverySettings } from '@/app/admin/actions';

export default async function DefaultFeePage() {
  const settings = await getDeliverySettings();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frais par Défaut</CardTitle>
        <CardDescription>
          Activez un coût de livraison de base qui s'appliquera à toutes les commandes,
          sauf si un tarif de zone spécifique ou la gratuité est applicable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DefaultFeeForm initialSettings={settings} />
      </CardContent>
    </Card>
  );
}
