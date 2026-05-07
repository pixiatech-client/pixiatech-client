
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLaborSettings } from '@/app/admin/actions';
import { LaborForm } from './_components/labor-form';

export default async function LaborPage() {
  const settings = await getLaborSettings();
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Main d'œuvre & Installation</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          Configurez les coûts et le nombre de techniciens requis en fonction de la surface de l'écran.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <LaborForm initialSettings={settings} />
      </CardContent>
    </Card>
  );
}
