
import { getQuoteCounts, getCurrentAdminUser } from '@/app/admin/actions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export default async function TestDBPage() {
  let results = {
    env: {
      PROJECT_ID: process.env.ADMIN_PROJECT_ID,
      CLIENT_EMAIL: !!process.env.ADMIN_CLIENT_EMAIL,
      PRIVATE_KEY: !!process.env.ADMIN_PRIVATE_KEY,
    },
    admin: null as any,
    counts: null as any,
    user: null as any,
    error: null as any
  };

  try {
    const admin = getFirebaseAdmin();
    results.admin = "Initialized";
    
    // This will likely fail because we have no session cookie in this direct request
    // but we can see what it returns.
    const user = await getCurrentAdminUser();
    results.user = user;
    
    const counts = await getQuoteCounts();
    results.counts = counts;
  } catch (err: any) {
    results.error = err.message || err;
  }

  return (
    <div className="p-8 font-mono">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <pre className="bg-zinc-100 p-4 rounded border border-zinc-300 overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}
