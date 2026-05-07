export const dynamic = 'force-dynamic';

import { DepartmentFeesForm } from '../_components/department-fees-form';
import type { DeliverySettings } from '@/lib/types';
import { getDeliverySettings } from '@/app/admin/actions';

export default async function TarifsPage() {
  const settings = await getDeliverySettings();

  return <DepartmentFeesForm initialSettings={settings} />;
}
