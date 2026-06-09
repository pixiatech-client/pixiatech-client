
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLaborSettings } from '@/app/admin/actions';
import { LaborForm } from './_components/labor-form';

export default async function LaborPage() {
  const settings = await getLaborSettings();
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Labor & Installation</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          Configure costs and the number of technicians required based on screen area.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <LaborForm initialSettings={settings} />
      </CardContent>
    </Card>
  );
}
