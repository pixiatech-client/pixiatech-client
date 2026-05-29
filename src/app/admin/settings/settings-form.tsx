'use client';

import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import type { Settings as AppSettings, TranslatedString, Theme } from '@/lib/types';
import { updateSettings } from '../actions';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Truck, Wrench, MailCheck, EyeOff, Sun, Moon, Bot, Zap, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { InputWithUpload } from './_components/input-with-upload';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const translatedStringSchema = z.object({
  fr: z.string().optional(),
  en: z.string().optional(),
});

const hintBubbleSchema = z.object({
  enabled: z.boolean(),
  text: z.string().optional(),
  desktopBottom: z.coerce.number().optional(),
  desktopRight: z.coerce.number().optional(),
  mobileBottom: z.coerce.number().optional(),
  mobileRight: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
});

const settingsSchema = z.object({
  defaultWidth: z.coerce.number().min(1, "La largeur doit être d'au moins 1"),
  defaultHeight: z.coerce.number().min(1, "La hauteur doit être d'au moins 1"),
  maxWidth: z.coerce.number().min(1, "La largeur max doit être d'au moins 1"),
  maxHeight: z.coerce.number().min(1, "La hauteur max doit être d'au moins 1"),
  maxRentalWidth: z.coerce.number().min(1).optional(),
  maxRentalHeight: z.coerce.number().min(1).optional(),
  maxProductsPerQuote: z.coerce.number().min(1, 'Doit être au moins 1').optional(),
  previewScreenImageUrl: z.string().optional(),
  previewScreenVideoUrl: z.string().optional(),
  previewHumanScaleImageUrl: z.string().optional(),
  technicianImageUrl: z.string().optional(),
  deliveryImageUrl: z.string().optional(),
  congratulationsImageUrl: z.string().optional(),
  paymentIconUrl: z.string().optional(),
  cardLogoUrl: z.string().optional(),
  emergencyStopEnabled: z.boolean().optional(),
  emergencyReturnUrl: z.string().optional(),
  emergencyStopMessage: z.string().optional(),
  congratulationsTitle: translatedStringSchema.optional(),
  congratulationsMessage: translatedStringSchema.optional(),
  deliveryTitle: translatedStringSchema.optional(),
  deliveryMessage: translatedStringSchema.optional(),
  installationTitle: translatedStringSchema.optional(),
  installationMessage: translatedStringSchema.optional(),
  disclaimerMessage: translatedStringSchema.optional(),
  quoteFormNotesPlaceholder: translatedStringSchema.optional(),
  isDeliveryStepEnabled: z.boolean().optional(),
  isInstallationStepEnabled: z.boolean().optional(),
  isEmailVerificationEnabled: z.boolean().optional(),
  isPriceHidden: z.boolean().optional(),
  isWizardBotEnabled: z.boolean().optional(),
  isGuidedConfigEnabled: z.boolean().optional(),
  isManualConfigEnabled: z.boolean().optional(),
  hintBubble: hintBubbleSchema.optional(),
  lightThemeId: z.string().optional(),
  darkThemeId: z.string().optional(),
  messaging: z.object({
    enabled: z.boolean(),
    allowCommercialMessaging: z.boolean(),
    allowSupplierMessaging: z.boolean(),
  }).optional(),
});


type SettingsSection = 'general' | 'emergency' | 'images' | 'content' | 'hint-bubble' | 'messaging';
type Language = 'fr' | 'en';
type FormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialSettings: AppSettings;
  section: SettingsSection;
}

export function SettingsForm({ initialSettings, section }: SettingsFormProps) {
  const { toast } = useToast();
  const [configMode, setConfigMode] = useState<'sale' | 'rental'>('sale');
  const [contentLang, setContentLang] = useState<Language>('fr');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { 
      ...initialSettings, 
      isEmailVerificationEnabled: initialSettings.isEmailVerificationEnabled ?? true, 
      isPriceHidden: initialSettings.isPriceHidden ?? false,
      isWizardBotEnabled: initialSettings.isWizardBotEnabled ?? true,
      isGuidedConfigEnabled: initialSettings.isGuidedConfigEnabled ?? true,
      isManualConfigEnabled: initialSettings.isManualConfigEnabled ?? true
    },
  });

  const handleTranslatedInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    field: keyof AppSettings, 
    lang: Language
  ) => {
    const { value } = e.target;
    form.setValue(field as keyof FormValues, {
        ...(form.getValues(field as keyof FormValues) as TranslatedString || { fr: '', en: '' }),
        [lang]: value,
    } as any);
  };

  const handleSave = async (sectionName: string) => {
    const result = await updateSettings(form.getValues());
    if (result.success) {
      toast({
        title: 'Paramètres sauvegardés',
        description: `La section "${sectionName}" a été mise à jour.`,
        variant: 'success',
      });
    } else {
       toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
      });
    }
  };
  
  const sectionLabels: Record<SettingsSection, string> = {
      general: 'Général',
      emergency: 'Urgence',
      images: 'Images',
      content: 'Contenu',
      'hint-bubble': 'Bulle d\'Aide',
      messaging: 'Messagerie',
  }

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="space-y-6 p-4 md:p-8">
        {section === 'general' && (
            <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Configuration de l'Estimation</h3>
                    <p className="text-sm font-medium text-slate-500">Définissez les limites et les valeurs par défaut du configurateur.</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setConfigMode('sale')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                            configMode === 'sale' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Vente
                    </button>
                    <button 
                        onClick={() => setConfigMode('rental')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                            configMode === 'rental' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Location
                    </button>
                </div>
            </div>

            {configMode === 'sale' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-6 p-4 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Valeurs par défaut</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="defaultWidth" className="text-xs font-bold text-slate-700">Largeur (m)</Label>
                                <Input 
                                    id="defaultWidth" 
                                    type="number" 
                                    className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                    {...form.register('defaultWidth')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="defaultHeight" className="text-xs font-bold text-slate-700">Hauteur (m)</Label>
                                <Input 
                                    id="defaultHeight" 
                                    type="number" 
                                    className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                    {...form.register('defaultHeight')}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6 p-4 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Limites maximales</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="maxWidth" className="text-xs font-bold text-slate-700">Largeur Max (m)</Label>
                                <Input 
                                    id="maxWidth" 
                                    type="number" 
                                    className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                    {...form.register('maxWidth')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxHeight" className="text-xs font-bold text-slate-700">Hauteur Max (m)</Label>
                                <Input 
                                    id="maxHeight" 
                                    type="number" 
                                    className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                    {...form.register('maxHeight')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="space-y-6 p-4 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Limites Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxRentalWidth" className="text-xs font-bold text-slate-700">Largeur Max (m)</Label>
                            <Input 
                                id="maxRentalWidth" 
                                type="number" 
                                className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                {...form.register('maxRentalWidth')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxRentalHeight" className="text-xs font-bold text-slate-700">Hauteur Max (m)</Label>
                            <Input 
                                id="maxRentalHeight" 
                                type="number" 
                                className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
                                {...form.register('maxRentalHeight')}
                            />
                        </div>
                    </div>
                 </div>
            )}

            <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="maxProductsPerQuote">Nombre maximum de produits par estimation</Label>
                <Input 
                    id="maxProductsPerQuote" 
                    type="number" 
                    min="1"
                    placeholder="5" 
                    {...form.register('maxProductsPerQuote')}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Processus d'estimation</h4>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <MailCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="isEmailVerificationEnabled" className="font-semibold">Activer la vérification par e-mail</Label>
                    <p className="text-sm text-muted-foreground">Si désactivé, les clients accèdent directement au PDF.</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isEmailVerificationEnabled"
                    render={({ field }) => (
                        <Switch
                            id="isEmailVerificationEnabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="isDeliveryStepEnabled" className="font-semibold">Étape de Livraison</Label>
                    <p className="text-sm text-muted-foreground">Afficher ou masquer l'étape de livraison.</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isDeliveryStepEnabled"
                    render={({ field }) => (
                        <Switch
                            id="isDeliveryStepEnabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <div>
                      <Label htmlFor="isInstallationStepEnabled" className="font-semibold">Étape d'Installation</Label>
                      <p className="text-sm text-muted-foreground">Afficher ou masquer l'étape d'installation.</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isInstallationStepEnabled"
                    render={({ field }) => (
                        <Switch
                            id="isInstallationStepEnabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                  <div>
                      <Label htmlFor="isPriceHidden" className="font-semibold">Masquer le prix et afficher une animation</Label>
                      <p className="text-sm text-muted-foreground">Remplace le prix par un texte animé "Estimation en cours...".</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isPriceHidden"
                    render={({ field }) => (
                        <Switch
                            id="isPriceHidden"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
              </div>
              {/* Card Groupée avec style orange pour les modes d'estimation */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-5 space-y-4 shadow-sm">
                <div>
                  <h5 className="font-semibold text-amber-900 text-base">Modes d'Accès au Configurateur</h5>
                  <p className="text-sm text-amber-700/80">
                    Déterminez les options d'accès disponibles pour vos clients. Au moins une option doit toujours rester activée.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {/* Option 1: Wizard Bot Flow */}
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100/50 rounded-lg">
                        <Bot className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <Label htmlFor="isWizardBotEnabled" className="font-semibold text-slate-800">Activer le Wizard Bot Flow</Label>
                        <p className="text-sm text-slate-500">Permet d'utiliser le chatbot conversationnel pour guider les clients.</p>
                      </div>
                    </div>
                    <Controller
                      control={form.control}
                      name="isWizardBotEnabled"
                      render={({ field }) => (
                        <Switch
                          id="isWizardBotEnabled"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              const guided = form.getValues('isGuidedConfigEnabled');
                              const manual = form.getValues('isManualConfigEnabled');
                              if (!guided && !manual) {
                                toast({
                                  title: "Action impossible",
                                  description: "Vous devez laisser au moins une option d'accès activée.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Option 2: Configuration Guidée */}
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100/50 rounded-lg">
                        <Zap className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <Label htmlFor="isGuidedConfigEnabled" className="font-semibold text-slate-800">Configuration Guidée</Label>
                        <p className="text-sm text-slate-500">Recommandé — Rapide, simple et sans prise de tête.</p>
                      </div>
                    </div>
                    <Controller
                      control={form.control}
                      name="isGuidedConfigEnabled"
                      render={({ field }) => (
                        <Switch
                          id="isGuidedConfigEnabled"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              const bot = form.getValues('isWizardBotEnabled');
                              const manual = form.getValues('isManualConfigEnabled');
                              if (!bot && !manual) {
                                toast({
                                  title: "Action impossible",
                                  description: "Vous devez laisser au moins une option d'accès activée.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Option 3: Configuration Manuelle */}
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100/50 rounded-lg">
                        <SlidersHorizontal className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <Label htmlFor="isManualConfigEnabled" className="font-semibold text-slate-800">Configuration Manuelle</Label>
                        <p className="text-sm text-slate-500">Avancé — Pour ceux qui savent déjà ce qu'ils veulent.</p>
                      </div>
                    </div>
                    <Controller
                      control={form.control}
                      name="isManualConfigEnabled"
                      render={({ field }) => (
                        <Switch
                          id="isManualConfigEnabled"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              const bot = form.getValues('isWizardBotEnabled');
                              const guided = form.getValues('isGuidedConfigEnabled');
                              if (!bot && !guided) {
                                toast({
                                  title: "Action impossible",
                                  description: "Vous devez laisser au moins une option d'accès activée.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            field.onChange(checked);
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
        )}

        {section === 'emergency' && (
            <div className="space-y-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <h3 className="font-medium text-destructive flex items-center gap-2"><AlertCircle size={20}/>Arrêt d'Urgence</h3>
            <p className="text-sm text-muted-foreground">
                Activez cette option pour désactiver immédiatement le formulaire d'estimation public et afficher un message de maintenance.
            </p>
            <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div>
                        <Label htmlFor="emergencyStopEnabled" className={cn("font-semibold", form.watch('emergencyStopEnabled') && "text-destructive")}>Désactiver le service d'estimation</Label>
                        <p className="text-sm text-muted-foreground">Le formulaire ne sera plus accessible au public.</p>
                    </div>
                    <Switch
                        id="emergencyStopEnabled"
                        checked={form.watch('emergencyStopEnabled')}
                        onCheckedChange={(checked) => form.setValue('emergencyStopEnabled', checked)}
                        className="data-[state=checked]:bg-destructive"
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="emergencyStopMessage">Message d'arrêt d'urgence</Label>
                <Textarea
                    id="emergencyStopMessage"
                    placeholder="Pour des raisons de maintenance..."
                    {...form.register('emergencyStopMessage')}
                    rows={4}
                />
                </div>
            <div className="space-y-2">
                <Label htmlFor="emergencyReturnUrl">URL de retour (page d'accueil)</Label>
                <Controller
                    control={form.control}
                    name="emergencyReturnUrl"
                    render={({ field }) => (
                        <InputWithUpload
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="https://votresite.com"
                        />
                    )}
                />
            </div>
            </div>
        )}
        
        {section === 'images' && (
            <div className="space-y-4">
            <h3 className="font-medium">Images de l'application</h3>
            <div className="space-y-2">
                <Label>Image de l'écran (URL)</Label>
                <Controller name="previewScreenImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>Dimensions de l'écran (Vidéo URL)</Label>
                <Controller name="previewScreenVideoUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>Image de l'échelle humaine (URL)</Label>
                <Controller name="previewHumanScaleImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>Image du technicien (URL)</Label>
                <Controller name="technicianImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>Image de livraison (URL)</Label>
                <Controller name="deliveryImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>Image de félicitations (URL)</Label>
                <Controller name="congratulationsImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2 pt-4 border-t">
                <Label>URL de l'icône de paiement</Label>
                <Controller name="paymentIconUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>URL du logo de la carte</Label>
                <Controller name="cardLogoUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            </div>
        )}

        {section === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Label htmlFor="lang-switch" className={contentLang === 'fr' ? 'font-bold' : ''}>Français</Label>
              <Switch
                  id="lang-switch"
                  checked={contentLang === 'en'}
                  onCheckedChange={(checked) => setContentLang(checked ? 'en' : 'fr')}
              />
              <Label htmlFor="lang-switch" className={contentLang === 'en' ? 'font-bold' : ''}>Anglais</Label>
            </div>
            <div>
              <h3 className="font-medium">Page de Félicitations</h3>
              <div className="space-y-2 mt-2">
                <Label htmlFor="congratulationsTitle">Titre</Label>
                <Input 
                  id="congratulationsTitle"
                  value={form.watch('congratulationsTitle')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'congratulationsTitle', contentLang)}
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="congratulationsMessage">Message</Label>
                <Textarea 
                  id="congratulationsMessage"
                  value={form.watch('congratulationsMessage')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'congratulationsMessage', contentLang)}
                  rows={3}
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Étape de Livraison</h3>
              <div className="space-y-2 mt-2">
                <Label htmlFor="deliveryTitle">Titre</Label>
                <Input 
                  id="deliveryTitle"
                  value={form.watch('deliveryTitle')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'deliveryTitle', contentLang)}
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="deliveryMessage">Message</Label>
                <Textarea 
                  id="deliveryMessage"
                  value={form.watch('deliveryMessage')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'deliveryMessage', contentLang)}
                  rows={3}
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">Étape d'Installation</h3>
              <div className="space-y-2 mt-2">
                <Label htmlFor="installationTitle">Titre</Label>
                <Input 
                  id="installationTitle"
                  value={form.watch('installationTitle')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'installationTitle', contentLang)}
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="installationMessage">Message</Label>
                <Textarea 
                  id="installationMessage"
                  value={form.watch('installationMessage')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'installationMessage', contentLang)}
                  rows={3}
                />
              </div>
            </div>
             <div>
              <h3 className="font-medium">Formulaire d'Estimation</h3>
              <div className="space-y-2 mt-2">
                <Label htmlFor="quoteFormNotesPlaceholder">Texte d'aide pour "Notes additionnelles"</Label>
                <Textarea 
                  id="quoteFormNotesPlaceholder"
                  value={form.watch('quoteFormNotesPlaceholder')?.[contentLang] || ''}
                  onChange={(e) => handleTranslatedInputChange(e, 'quoteFormNotesPlaceholder', contentLang)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {section === 'messaging' && (
            <div className="space-y-8">
                <div className="space-y-1 pb-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Configuration de la Messagerie</h3>
                    <p className="text-sm font-medium text-slate-500">Gérez l'accès à la messagerie interne pour les différents rôles.</p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <div className="space-y-1">
                            <Label htmlFor="messaging.enabled" className="text-sm font-black text-slate-900">Activer la messagerie globale</Label>
                            <p className="text-xs text-slate-500">Si désactivé, le chat ne sera plus visible ni accessible pour personne.</p>
                        </div>
                        <Controller
                            control={form.control}
                            name="messaging.enabled"
                            render={({ field }) => (
                                <Switch
                                    id="messaging.enabled"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300",
                        !form.watch('messaging.enabled') && "opacity-50 pointer-events-none grayscale"
                    )}>
                        <div className="space-y-4 p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label htmlFor="messaging.allowCommercialMessaging" className="text-sm font-bold text-slate-900">Commerciaux</Label>
                                    <p className="text-[11px] text-slate-500">Autoriser les commerciaux à utiliser le chat.</p>
                                </div>
                                <Controller
                                    control={form.control}
                                    name="messaging.allowCommercialMessaging"
                                    render={({ field }) => (
                                        <Switch
                                            id="messaging.allowCommercialMessaging"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label htmlFor="messaging.allowSupplierMessaging" className="text-sm font-bold text-slate-900">Fournisseurs</Label>
                                    <p className="text-[11px] text-slate-500">Autoriser les fournisseurs à utiliser le chat.</p>
                                </div>
                                <Controller
                                    control={form.control}
                                    name="messaging.allowSupplierMessaging"
                                    render={({ field }) => (
                                        <Switch
                                            id="messaging.allowSupplierMessaging"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Note sur les rôles personnalisés</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Les rôles créés par clonage hériteront automatiquement de ces paramètres en fonction de leur modèle (Template) d'origine.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="pt-8 border-t border-slate-100">
            <Button onClick={() => handleSave(sectionLabels[section])} className="w-full md:w-auto min-w-[200px] h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2">
                Enregistrer les paramètres
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
