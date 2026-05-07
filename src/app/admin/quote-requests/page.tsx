'use client';

import { EstimationDashboard } from './_components/estimation/pages/EstimationDashboard';
import { useUser } from '@/firebase';

export default function AdminQuoteRequestsPage() {
  const { userProfile } = useUser();
  const userRole = userProfile?.role || 'commercial';
  
  return <EstimationDashboard userRole={userRole} userId={userProfile?.uid} userName={userProfile?.displayName} />;
}
