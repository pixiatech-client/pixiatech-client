'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import type { Settings as AppSettings } from '@/lib/types';
import { updateSettings } from '@/app/admin/actions';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Monitor, Smartphone, Orbit, Layers } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';

const flowSchema = z.object({
  estimationFlow: z.object({
    enableRentalPeriod: z.boolean(),
    enableDigitalSignature: z.boolean(),
    enableContractEditing: z.boolean(),
    saleContractTemplate: z.string().optional(),
    rentalContractTemplate: z.string().optional(),
    taxEnabled: z.boolean(),
    taxRate: z.coerce.number().min(0).max(100),
    taxMode: z.enum(['ht', 'ttc']),
    sale: z.object({
      maxProductsPerQuote: z.coerce.number().min(1).default(3),
      flatScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
      curvedScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1), curveMin: z.coerce.number().max(0), curveMax: z.coerce.number().min(0) }),
      screen360: z.object({ maxDiameter: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
    }),
    rental: z.object({
      flatScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
      curvedScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1), curveMin: z.coerce.number().max(0), curveMax: z.coerce.number().min(0) }),
      screen360: z.object({ maxDiameter: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
    }),
  }),
});

type FormValues = z.infer<typeof flowSchema>;

interface FlowSettingsFormProps {
  initialSettings: AppSettings;
}

export function FlowSettingsForm({ initialSettings }: FlowSettingsFormProps) {
  const { toast } = useToast();
  const { t } = useAdminT();
  const [contractMode, setContractMode] = useState<'vente' | 'location'>('location');
  const [screenMode, setScreenMode] = useState<'vente' | 'location'>('vente');

  const defaultSaleContract = [
    'CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)',
    'PIXIATECH • France • Dernière mise à jour : 30/11/2025',
    '',
    'ARTICLE 1 – PRÉSENTATION ET CHAMP D\'APPLICATION',
    'Les présentes conditions générales régissent l\'ensemble des relations commerciales (vente, prestation de service, location) entre la société PIXIATECH (ci-après « PIXIATECH ») et ses clients (ci-après « le Client »), qu\'ils soient professionnels ou consommateurs.',
    '',
    '• Dénomination : PIXIATECH (SASU)',
    '• Siège social : 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE.',
    '• RCS : Bobigny 993 747 161',
    '• TVA Intracommunautaire : FR39993747161',
    '• Contact E-Mail : contact@pixiatech.com',
    '• Contact Téléphone : 07 56 81 66 26',
    '',
    'La validation de toute commande (en ligne ou sur estimation) implique l\'adhésion entière et sans réserve aux présentes conditions.',
    '',
    'ARTICLE 2 – VENTE : PRODUITS ET MODÈLE LOGISTIQUE',
    'Les caractéristiques des produits (écrans LED, éclairage, solutions numériques) sont indiquées sur le site ou l\'estimation.',
    'Expédition Directe (Modèle Logistique) : Afin de garantir la disponibilité des produits et des tarifs compétitifs, PIXIATECH fonctionne en flux tendu. Certains produits sont expédiés directement depuis les entrepôts de fabrication partenaires (UE ou hors UE). Le Client accepte que sa commande puisse être livrée en plusieurs colis selon la provenance logistique.',
    '',
    'ARTICLE 3 – PRIX',
    'Les prix sont indiqués en Euros.',
    '- Particuliers : prix TTC.',
    '- Professionnels : prix HT. PIXIATECH peut modifier les tarifs à tout moment. Le prix applicable est celui au moment de la commande.',
    '',
    'ARTICLE 4 – PAIEMENT (VENTE ET PRESTATION)',
    '4.1 Commandes en ligne : Paiement 100 % exigible au jour de la commande. Traitement après encaissement complet.',
    '4.2 Commandes sur estimation (B2B) : Acompte : 60 % à la signature. Solde : 40 % avant expédition. En cas de non-paiement du solde, PIXIATECH reste propriétaire du matériel.',
    '',
    'ARTICLE 5 – LIVRAISON ET DOUANES',
    '5.1 Délais : Les délais sont indicatifs. Un retard ne justifie pas une annulation (sauf dispositions légales B2C).',
    '5.2 Douanes : Particuliers : Mode DDP = aucun frais supplémentaire. Prix final. Professionnels : Droits de douane et TVA à l\'importation à la charge du client.',
    '',
    'ARTICLE 6 – DROIT DE RÉTRACTATION',
    '6.1 Particuliers : Délai : 14 jours. Frais de retour à la charge du client. Produit neuf, complet, emballage intact. Contact préalable obligatoire.',
    '6.2 Professionnels : Pas de rétractation en B2B. Commande ferme.',
    '',
    'ARTICLE 7 – PRESTATION D\'INSTALLATION',
    '7.1 Périmètre : Installation disponible dans un rayon de 150 km autour du siège. Au-delà : estimation.',
    '7.2 Réception : Un Bon de Réception marque la fin de l\'installation. Le client devient responsable.',
    '7.3 Installation par le Client : PIXIATECH décline toute responsabilité en cas de mauvaise installation par le client.',
    '',
    'ARTICLE 8 – LOCATION',
    '8.1 Retard : Pénalité : 200 % du tarif/jour.',
    '8.2 Caution : Caution encaissable en cas de dommages ou perte.',
    '8.3 Assurance : Le client est gardien juridique du matériel loué.',
    '8.4 Montage / Démontage : Accès garanti par le client. Responsabilité transférée après installation. PIXIATECH peut annuler en cas de risque sécurité.',
    '',
    'ARTICLE 9 – GARANTIES',
    '- Pour les Particuliers : 2 ans de garantie légale.',
    '- Pour les Professionnels : Garantie constructeur (pièces uniquement).',
    '',
    'ARTICLE 10 – LIMITATION DE RESPONSABILITÉ',
    'En B2B, responsabilité plafonnée au montant de la commande.',
    '',
    'ARTICLE 11 – DONNÉES PERSONNELLES',
    'Données utilisées pour traiter la commande. Conformité RGPD.',
    '',
    'ARTICLE 12 – DROIT APPLICABLE ET LITIGES',
    '- Pour les Particuliers : juridiction du défendeur ou médiation.',
    '- Pour les Professionnels : Tribunal de Commerce de Bobigny.',
    '',
    'Considéré comme accepté suite à la validation du consentement de traitement des données commerciales.',
  ].join('\n');

  const defaultRentalContract = [
    'CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)',
    'PIXIATECH • France • Dernière mise à jour : 30/11/2025',
    '',
    'ENTRE LES SOUSSIGNÉ(E)S :',
    'La société PIXIATECH, SASU, 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE, RCS Bobigny 993 747 161, TVA FR39993747161, contact@pixiatech.com / 07 56 81 66 26, ci-après « PIXIATECH » ou le « Bailleur ».',
    '',
    "D'UNE PART,",
    '',
    'Le client, ci-après « le Client » ou « le Preneur ».',
    '',
    "D'AUTRE PART,",
    '',
    'PIXIATECH et le Client sont collectivement dénommés les « Parties ».',
    '',
    'RÉCAPITULATIF DE LA LOCATION DE MATÉRIEL :',
    '- Matériel loué : {{pack.name}} • Surface : {{pack.surface}}',
    '- Période de location : {{rentalPeriod}}',
    '- Horaires : {{rentalHours}}',
    "- Coût de la période : {{pack.price}}€ TTC (Sans engagement de durée)",
    '- Dépôt de garantie requis (Caution) : {{pack.deposit}}€ TTC',
    '',
    'IL A ÉTÉ EXPOSÉ ET CONVENU CE QUI SUIT :',
    '',
    'ARTICLE 1 – PRÉSENTATION ET CHAMP D\'APPLICATION',
    'Les présentes conditions générales régissent l\'ensemble des relations commerciales (vente, prestation de service, location) entre la société PIXIATECH (ci-après « PIXIATECH ») et ses clients (ci-après « le Client »), qu\'ils soient professionnels ou consommateurs.',
    '',
    '• Dénomination : PIXIATECH (SASU)',
    '• Siège social : 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE.',
    '• RCS : Bobigny 993 747 161',
    '• TVA Intracommunautaire : FR39993747161',
    '• Contact E-Mail : contact@pixiatech.com',
    '• Contact Téléphone : 07 56 81 66 26',
    '',
    'La validation de toute commande implique l\'adhésion entière et sans réserve aux présentes conditions.',
    '',
    'ARTICLE 2 – VENTE : PRODUITS ET MODÈLE LOGISTIQUE',
    'Les caractéristiques des produits sont indiquées sur le site ou l\'estimation. PIXIATECH fonctionne en flux tendu. Certains produits sont expédiés directement depuis les entrepôts de fabrication partenaires.',
    '',
    'ARTICLE 3 – PRIX',
    'Les prix sont indiqués en Euros.',
    '- Particuliers : prix TTC.',
    '- Professionnels : prix HT.',
    '',
    'ARTICLE 4 – PAIEMENT (VENTE ET PRESTATION)',
    '4.1 Commandes en ligne : Paiement 100 % exigible au jour de la commande.',
    '4.2 Commandes sur estimation (B2B) : Acompte : 60 % à la signature. Solde : 40 % avant expédition.',
    '',
    'ARTICLE 5 – LIVRAISON ET DOUANES',
    '5.1 Délais : Les délais sont indicatifs.',
    '5.2 Douanes : Particuliers : Mode DDP = aucun frais supplémentaire. Professionnels : Droits de douane et TVA à l\'importation à la charge du client.',
    '',
    'ARTICLE 6 – DROIT DE RÉTRACTATION',
    '6.1 Particuliers : Délai : 14 jours.',
    '6.2 Professionnels : Pas de rétractation en B2B. Commande ferme.',
    '',
    'ARTICLE 7 – PRESTATION D\'INSTALLATION',
    '7.1 Périmètre : Installation disponible dans un rayon de 150 km.',
    '7.2 Réception : Un Bon de Réception marque la fin de l\'installation.',
    "7.3 Installation par le Client : PIXIATECH décline toute responsabilité.",
    '',
    'ARTICLE 8 – LOCATION',
    '8.1 Retard : Pénalité : 200 % du tarif/jour.',
    '8.2 Caution : Caution encaissable en cas de dommages ou perte.',
    '8.3 Assurance : Le client est gardien juridique du matériel loué.',
    '8.4 Montage / Démontage : Accès garanti par le client.',
    '',
    'ARTICLE 9 – GARANTIES',
    '- Particuliers : 2 ans de garantie légale.',
    '- Professionnels : Garantie constructeur (pièces uniquement).',
    '',
    'ARTICLE 10 – LIMITATION DE RESPONSABILITÉ',
    'En B2B, responsabilité plafonnée au montant de la commande.',
    '',
    'ARTICLE 11 – DONNÉES PERSONNELLES',
    'Données utilisées pour traiter la commande. Conformité RGPD.',
    '',
    'ARTICLE 12 – DROIT APPLICABLE ET LITIGES',
    '- Particuliers : juridiction du défendeur ou médiation.',
    '- Professionnels : Tribunal de Commerce de Bobigny.',
    '',
    'Fait à Saint-Ouen-sur-Seine, version électronique certifiée.',
    '',
    'Pour PIXIATECH (Bailleur)',
    'PIXIATECH (SASU)',
    '5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine',
    'RCS Bobigny 993 747 161',
    '',
    'Le Client (Preneur)',
    '[Signature du client]',
  ].join('\n');

  const flow = {
    enableRentalPeriod: initialSettings.estimationFlow?.enableRentalPeriod ?? true,
    enableDigitalSignature: initialSettings.estimationFlow?.enableDigitalSignature ?? true,
    enableContractEditing: initialSettings.estimationFlow?.enableContractEditing ?? false,
    taxEnabled: initialSettings.estimationFlow?.taxEnabled ?? false,
    taxRate: initialSettings.estimationFlow?.taxRate ?? 19,
    taxMode: (initialSettings.estimationFlow?.taxMode ?? 'ht') as 'ht' | 'ttc',
    sale: (initialSettings.estimationFlow as any)?.sale || {
      maxProductsPerQuote: 3,
      flatScreen: { maxWidth: 20, maxHeight: 10 },
      curvedScreen: { maxWidth: 20, maxHeight: 10, curveMin: -30, curveMax: 30 },
      screen360: { maxDiameter: 10, maxHeight: 8 },
    },
    rental: (initialSettings.estimationFlow as any)?.rental || {
      flatScreen: { maxWidth: 6, maxHeight: 5 },
      curvedScreen: { maxWidth: 6, maxHeight: 5, curveMin: -30, curveMax: 30 },
      screen360: { maxDiameter: 6, maxHeight: 5 },
    },
    saleContractTemplate: initialSettings.estimationFlow?.saleContractTemplate || defaultSaleContract,
    rentalContractTemplate: initialSettings.estimationFlow?.rentalContractTemplate || defaultRentalContract,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(flowSchema),
    defaultValues: { estimationFlow: flow },
  });

  const taxEnabled = form.watch('estimationFlow.taxEnabled');
  const canEditContract = form.watch('estimationFlow.enableContractEditing');
  const saleContract = form.watch('estimationFlow.saleContractTemplate');
  const rentalContract = form.watch('estimationFlow.rentalContractTemplate');

  const saveAll = async () => {
    const values = form.getValues();
    const payload = { ...initialSettings, ...values };
    const result = await updateSettings(payload);
    if (result.success) {
      toast({ title: t('Settings saved'), description: t('Tous les paramètres du parcours client ont été mis à jour.'), variant: 'success' });
    } else {
      toast({ variant: 'destructive', title: t('Error'), description: t('Une erreur est survenue lors de la sauvegarde.') });
    }
  };

  const contractValue = contractMode === 'vente'
    ? (saleContract || defaultSaleContract)
    : (rentalContract || defaultRentalContract);

  const setContractValue = (val: string) => {
    if (contractMode === 'vente') {
      form.setValue('estimationFlow.saleContractTemplate', val);
    } else {
      form.setValue('estimationFlow.rentalContractTemplate', val);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('Parcours client')}</h3>
          <p className="text-sm font-medium text-slate-500">{t("Contrôle des options du parcours d'estimation, signature, TVA et contrats.")}</p>
        </div>
        <Button onClick={saveAll} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer">
          {t('Save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* LEFT COLUMN: Options + Tax config */}
        <div className="lg:col-span-2 space-y-6">

          {/* Options parcours */}
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('Options parcours')}</h4>
                <p className="text-xs text-slate-500">{t('Activer ou désactiver les fonctionnalités du parcours client.')}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900">{t('Période de location')}</Label>
                  <p className="text-xs text-slate-500">{t('Afficher les dates et horaires de location')}</p>
                </div>
                <Switch
                  checked={form.watch('estimationFlow.enableRentalPeriod')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.enableRentalPeriod', v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900">{t('Signature numérique')}</Label>
                  <p className="text-xs text-slate-500">{t('Activer la signature électronique des contrats')}</p>
                </div>
                <Switch
                  checked={form.watch('estimationFlow.enableDigitalSignature')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.enableDigitalSignature', v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900">{t('Édition des contrats')}</Label>
                  <p className="text-xs text-slate-500">{t('Permettre la modification des templates de contrats')}</p>
                </div>
                <Switch
                  checked={form.watch('estimationFlow.enableContractEditing')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.enableContractEditing', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuration TVA */}
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('Configuration TVA')}</h4>
                <p className="text-xs text-slate-500">{t('Paramètres communs pour la vente et location')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">{t("Mode d'affichage")}</Label>
                <Select
                  value={form.watch('estimationFlow.taxMode')}
                  onValueChange={(v) => form.setValue('estimationFlow.taxMode', v as 'ht' | 'ttc')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ht">{t('HT (hors taxe)')}</SelectItem>
                    <SelectItem value="ttc">{t('TTC (toutes taxes comprises)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900">{t('Activer TVA')}</Label>
                  <p className="text-xs text-slate-500">{t('Appliquer un taux de TVA sur les montants')}</p>
                </div>
                <Switch
                  checked={form.watch('estimationFlow.taxEnabled')}
                  onCheckedChange={(v) => form.setValue('estimationFlow.taxEnabled', v)}
                />
              </div>

              {taxEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">{t('Taux TVA (%)')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.watch('estimationFlow.taxRate')}
                    onChange={(e) => form.setValue('estimationFlow.taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              )}

              {!taxEnabled && (
                <p className="text-xs text-slate-400 italic">{t('100% HT — Aucune TVA appliquée')}</p>
              )}
            </CardContent>
          </Card>

          {/* Configuration écrans */}
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('Configuration écrans')}</h4>
                <p className="text-xs text-slate-500">{t("Dimensions et limites par type d'écran")}</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 w-fit">
                <button type="button" onClick={() => setScreenMode('vente')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    screenMode === 'vente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >{t('Sale')}</button>
                <button type="button" onClick={() => setScreenMode('location')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    screenMode === 'location' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >{t('Rental')}</button>
              </div>

              <div className="space-y-3">
                {/* Écran Plat */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">{t('Flat Screen')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max width (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.flatScreen.maxWidth' : 'estimationFlow.rental.flatScreen.maxWidth')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.flatScreen.maxWidth' : 'estimationFlow.rental.flatScreen.maxWidth', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max height (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.flatScreen.maxHeight' : 'estimationFlow.rental.flatScreen.maxHeight')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.flatScreen.maxHeight' : 'estimationFlow.rental.flatScreen.maxHeight', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Écran Incurvé */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">{t('Curved Screen')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max width (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.maxWidth' : 'estimationFlow.rental.curvedScreen.maxWidth')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.maxWidth' : 'estimationFlow.rental.curvedScreen.maxWidth', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max height (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.maxHeight' : 'estimationFlow.rental.curvedScreen.maxHeight')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.maxHeight' : 'estimationFlow.rental.curvedScreen.maxHeight', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Min curve')}</Label>
                      <Input type="number" step="1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.curveMin' : 'estimationFlow.rental.curvedScreen.curveMin')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.curveMin' : 'estimationFlow.rental.curvedScreen.curveMin', isNaN(val) ? 0 : -Math.abs(val));
                        }}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max curve')}</Label>
                      <Input type="number" step="1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.curveMax' : 'estimationFlow.rental.curvedScreen.curveMax')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.curvedScreen.curveMax' : 'estimationFlow.rental.curvedScreen.curveMax', parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Écran 360° */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Orbit className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">{t('360° Screen')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max diameter (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.screen360.maxDiameter' : 'estimationFlow.rental.screen360.maxDiameter')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.screen360.maxDiameter' : 'estimationFlow.rental.screen360.maxDiameter', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Max height (m)')}</Label>
                      <Input type="number" min="1" step="0.1"
                        value={form.watch(screenMode === 'vente' ? 'estimationFlow.sale.screen360.maxHeight' : 'estimationFlow.rental.screen360.maxHeight')}
                        onChange={(e) => form.setValue(screenMode === 'vente' ? 'estimationFlow.sale.screen360.maxHeight' : 'estimationFlow.rental.screen360.maxHeight', parseFloat(e.target.value) || 1)}
                        className="h-9 rounded-xl bg-white border-slate-200" />
                    </div>
                  </div>
                </div>

                {/* Multisélection - Vente uniquement */}
                {screenMode === 'vente' && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-bold text-slate-900">{t('Multi-selection')}</span>
                    </div>
                    <p className="text-xs text-slate-500">{t("Nombre maximum de produits qu'un client peut sélectionner")}</p>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">{t('Maximum products per estimate')}</Label>
                      <Input type="number" min="1" step="1"
                        value={form.watch('estimationFlow.sale.maxProductsPerQuote')}
                        onChange={(e) => form.setValue('estimationFlow.sale.maxProductsPerQuote', parseInt(e.target.value) || 3)}
                        className="h-9 rounded-xl bg-white border-slate-200 w-32" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Contract template (preview + editor merged) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('Template de contrat')}</h4>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setContractMode('vente')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  contractMode === 'vente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('Sale')}
              </button>
              <button
                type="button"
                onClick={() => setContractMode('location')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  contractMode === 'location' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('Rental')}
              </button>
            </div>
          </div>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
                {t('Contrat')} {contractMode === 'vente' ? t('Sale') : t('Rental')}
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                <div className="bg-white border border-zinc-200/80 p-5 rounded-lg shadow-sm text-xs text-zinc-700 leading-relaxed font-sans">
                  <div className="text-center mb-4 border-b border-zinc-100 pb-3">
                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
                      CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)
                    </h4>
                  </div>

                  {canEditContract ? (
                    <textarea
                      className="w-full h-[500px] rounded-lg border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:border-blue-500 resize-y bg-white"
                      value={contractValue}
                      onChange={(e) => setContractValue(e.target.value)}
                      placeholder={t('Laissez vide pour utiliser le contrat par défaut')}
                    />
                  ) : (
                    <div className="text-[11px] text-zinc-600 space-y-3">
                      {contractValue ? (
                        <div className="whitespace-pre-wrap font-mono text-[10px] text-zinc-500 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                          {contractValue}
                        </div>
                      ) : (
                        <>
                          {contractMode === 'vente' ? (
                            <>
                              <p className="font-semibold text-zinc-800">1. OBJET</p>
                              <p>Les présentes conditions générales de vente (CGV) régissent la vente de produits et services d&apos;affichage LED par PIXIATECH.</p>
                              <p className="font-semibold text-zinc-800 mt-3">2. PRIX ET PAIEMENT</p>
                              <p>Les prix sont indiqués en euros. Le paiement est dû selon les modalités prévues à l'estimation acceptée.</p>
                              <p className="font-semibold text-zinc-800 mt-3">3. LIVRAISON</p>
                              <p>La livraison est effectuée à l&apos;adresse indiquée par le client, selon les délais convenus.</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-zinc-800">1. OBJET</p>
                              <p>Les présentes conditions générales de location (CGL) régissent la location de matériel d&apos;affichage LED par PIXIATECH.</p>
                              <p className="font-semibold text-zinc-800 mt-3">2. DURÉE ET PÉRIODE</p>
                              <p>La location est consentie pour la période indiquée dans le contrat, avec possibilité de prolongation.</p>
                              <p className="font-semibold text-zinc-800 mt-3">3. CAUTION</p>
                              <p>Un dépôt de garantie est requis pour couvrir d&apos;éventuels dommages au matériel loué.</p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
