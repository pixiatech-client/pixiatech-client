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
import { AlertCircle, MailCheck, EyeOff, Sun, Moon, Bot, Zap, Eye, Server, Play, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useAdminT } from '@/hooks/useAdminT';
import { InputWithUpload } from './_components/input-with-upload';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { testSmtpConnection } from '@/app/actions/quote-actions';


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
  defaultWidth: z.coerce.number().min(1, "Width must be at least 1"),
  defaultHeight: z.coerce.number().min(1, "Height must be at least 1"),
  maxWidth: z.coerce.number().min(1, "Max width must be at least 1"),
  maxHeight: z.coerce.number().min(1, "Max height must be at least 1"),
  maxRentalWidth: z.coerce.number().min(1).optional(),
  maxRentalHeight: z.coerce.number().min(1).optional(),
  maxProductsPerQuote: z.coerce.number().min(1, 'Must be at least 1').optional(),
  zoomMaxDistance: z.coerce.number().min(1, 'Must be at least 1').optional(),
  zoomMinDistance: z.coerce.number().min(0.1, 'Must be at least 0.1').optional(),
  previewScreenImageUrl: z.string().optional(),
  previewScreenVideoUrl: z.string().optional(),
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
  isSingleSessionEnabled: z.boolean().optional(),
  isWizardBotEnabled: z.boolean().optional(),
  isGuidedConfigEnabled: z.boolean().optional(),

  hintBubble: hintBubbleSchema.optional(),
  lightThemeId: z.string().optional(),
  darkThemeId: z.string().optional(),
  messaging: z.object({
    enabled: z.boolean(),
    allowCommercialMessaging: z.boolean(),
    allowSupplierMessaging: z.boolean(),
  }).optional(),
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
    }).optional(),
    rental: z.object({
      flatScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
      curvedScreen: z.object({ maxWidth: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1), curveMin: z.coerce.number().max(0), curveMax: z.coerce.number().min(0) }),
      screen360: z.object({ maxDiameter: z.coerce.number().min(1), maxHeight: z.coerce.number().min(1) }),
    }).optional(),
  }).optional(),
});


type SettingsSection = 'general' | 'emergency' | 'images' | 'content' | 'messaging' | 'software' | 'email-verification' | 'flow';
type Language = 'fr' | 'en';
type FormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialSettings: AppSettings;
  section: SettingsSection;
}

export function SettingsForm({ initialSettings, section }: SettingsFormProps) {
  const { toast } = useToast();
  const { t } = useAdminT();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { 
      ...initialSettings, 
      isEmailVerificationEnabled: initialSettings.isEmailVerificationEnabled ?? true, 
      isPriceHidden: initialSettings.isPriceHidden ?? false,
      isSingleSessionEnabled: initialSettings.isSingleSessionEnabled ?? false,
      isWizardBotEnabled: initialSettings.isWizardBotEnabled ?? true,
      isGuidedConfigEnabled: initialSettings.isGuidedConfigEnabled ?? true,

      estimationFlow: {
        ...initialSettings.estimationFlow,
        sale: initialSettings.estimationFlow?.sale || {
          maxProductsPerQuote: 3,
          flatScreen: { maxWidth: 20, maxHeight: 10 },
          curvedScreen: { maxWidth: 20, maxHeight: 10, curveMin: -30, curveMax: 30 },
          screen360: { maxDiameter: 10, maxHeight: 8 },
        },
        rental: {
          flatScreen: { maxWidth: 6, maxHeight: 5 },
          curvedScreen: { maxWidth: 6, maxHeight: 5, curveMin: -30, curveMax: 30 },
          screen360: { maxDiameter: 6, maxHeight: 5 },
        },
      },
    },
  });

  const handleSave = async (sectionName: string) => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: t('Validation error'),
        description: t('Please check the form for invalid values.'),
      });
      return;
    }
    const all = form.getValues();

    const sectionKey = (Object.entries(sectionLabels) as [string, string][]).find(([, label]) => label === sectionName)?.[0] || sectionName;

    const sectionFields: Record<string, string[]> = {
      general: ['defaultWidth', 'defaultHeight', 'maxWidth', 'maxHeight', 'maxRentalWidth', 'maxRentalHeight', 'maxProductsPerQuote', 'isEmailVerificationEnabled', 'isPriceHidden', 'isSingleSessionEnabled', 'isWizardBotEnabled', 'isGuidedConfigEnabled', 'estimationFlow'],
      emergency: ['emergencyStopEnabled', 'emergencyReturnUrl', 'emergencyStopMessage'],
      images: ['previewScreenImageUrl', 'previewScreenVideoUrl'],
      content: ['congratulationsTitle', 'congratulationsMessage', 'deliveryTitle', 'deliveryMessage', 'installationTitle', 'installationMessage', 'disclaimerMessage', 'quoteFormNotesPlaceholder', 'isDeliveryStepEnabled', 'isInstallationStepEnabled'],
      messaging: ['messaging'],
      software: ['hintBubble', 'lightThemeId', 'darkThemeId'],
      'email-verification': ['emailVerification'],
      flow: ['estimationFlow'],
    };

    const fields = sectionFields[sectionKey];
    if (!fields) {
      const result = await updateSettings(all);
      if (result.success) {
        toast({
          title: t('Settings saved'),
          description: t('Section "{sectionName}" has been updated.').replace('{sectionName}', sectionName),
          variant: 'success',
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: t('An error occurred while saving.'),
        });
      }
      return;
    }

    const picked: Record<string, unknown> = {};
    const requiredFields = ['defaultWidth', 'defaultHeight', 'maxWidth', 'maxHeight'];
    for (const key of fields) {
      if (key in all) picked[key] = all[key as keyof typeof all];
    }
    for (const key of requiredFields) {
      if (!(key in picked) && key in all) picked[key] = all[key as keyof typeof all];
    }

    const result = await updateSettings(picked);
    if (result.success) {
      toast({
        title: t('Settings saved'),
        description: t('Section "{sectionName}" has been updated.').replace('{sectionName}', sectionName),
        variant: 'success',
      });
    } else {
       toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('An error occurred while saving.'),
      });
    }
  };
  
  const autoSaveField = async (fieldName: string, value: unknown) => {
    const payload = { [fieldName]: value };
    const result = await updateSettings(payload);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('An error occurred while saving.'),
      });
    }
  };

  const sectionLabels: Record<SettingsSection, string> = {
      general: t('General'),
      emergency: t('Emergency'),
      images: t('Images'),
      content: t('Content'),
      messaging: t('Messaging'),
      software: t('Software'),
      'email-verification': t('Email Verification'),
      flow: t('Parcours client'),
  }

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="space-y-6 p-4 md:p-8">
        {section === 'general' && (
            <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="font-medium">{t('Estimation Process')}</h4>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <MailCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="isEmailVerificationEnabled" className="font-semibold">{t('Enable email verification')}</Label>
                    <p className="text-sm text-muted-foreground">{t('If disabled, customers go directly to the PDF.')}</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isEmailVerificationEnabled"
                    render={({ field }) => (
                        <Switch
                            id="isEmailVerificationEnabled"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                autoSaveField('isEmailVerificationEnabled', checked);
                            }}
                        />
                    )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className='flex items-center gap-2'>
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                  <div>
                      <Label htmlFor="isPriceHidden" className="font-semibold">{t('Hide price and show animation')}</Label>
                      <p className="text-sm text-muted-foreground">{t('Replaces the price with an animated "Estimating..." text.')}</p>
                  </div>
                </div>
                <Controller
                    control={form.control}
                    name="isPriceHidden"
                    render={({ field }) => (
                        <Switch
                            id="isPriceHidden"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                autoSaveField('isPriceHidden', checked);
                            }}
                        />
                    )}
                />
              </div>

              {/* Session unique */}
              <div className="rounded-lg border border-red-200 bg-red-50/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className='flex items-center gap-2'>
                    <ShieldCheck className="h-5 w-5 text-red-500" />
                    <div>
                      <Label htmlFor="isSingleSessionEnabled" className="font-semibold text-red-800">{t('Force unique session')}</Label>
                      <p className="text-sm text-red-600/80">{t('If a user logs in on a new device, the previous session is immediately disconnected.')}</p>
                    </div>
                  </div>
                  <Controller
                    control={form.control}
                    name="isSingleSessionEnabled"
                    render={({ field }) => (
                      <Switch
                        id="isSingleSessionEnabled"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            autoSaveField('isSingleSessionEnabled', checked);
                        }}
                        className="data-[state=checked]:bg-red-600"
                      />
                    )}
                  />
                </div>
                {/* State indicator */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  form.watch('isSingleSessionEnabled')
                    ? 'bg-red-100 text-red-700'
                    : 'bg-zinc-100 text-zinc-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    form.watch('isSingleSessionEnabled') ? 'bg-red-500' : 'bg-zinc-400'
                  }`} />
                  {form.watch('isSingleSessionEnabled')
                    ? t('Session unique activée — toute nouvelle connexion déconnecte immédiatement l\'ancienne session.')
                    : t('Session unique désactivée — plusieurs sessions simultanées autorisées.')}
                </div>
              </div>

              {/* Card with orange style for estimation modes */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-5 space-y-4 shadow-sm">
                <div>
                  <h5 className="font-semibold text-amber-900 text-base">{t('Configurator Access Modes')}</h5>
                  <p className="text-sm text-amber-700/80">
                    {t('Determine the access options available for your customers. At least one option must always remain enabled.')}
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
                        <Label htmlFor="isWizardBotEnabled" className="font-semibold text-slate-800">{t('Enable Wizard Bot Flow')}</Label>
                        <p className="text-sm text-slate-500">{t('Allows using the conversational chatbot to guide customers.')}</p>
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
                              if (!guided) {
                                toast({
                                  title: t("Action unavailable"),
                                  description: t("You must leave at least one access option enabled."),
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            field.onChange(checked);
                            autoSaveField('isWizardBotEnabled', checked);
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Option 2: Guided Configuration */}
                  <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100/50 rounded-lg">
                        <Zap className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <Label htmlFor="isGuidedConfigEnabled" className="font-semibold text-slate-800">{t('Guided Configuration')}</Label>
                        <p className="text-sm text-slate-500">{t('Recommended — Fast, simple, and hassle-free.')}</p>
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
                              if (!bot) {
                                toast({
                                  title: t("Action unavailable"),
                                  description: t("You must leave at least one access option enabled."),
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            field.onChange(checked);
                            autoSaveField('isGuidedConfigEnabled', checked);
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
            <h3 className="font-medium text-destructive flex items-center gap-2"><AlertCircle size={20}/>{t('Emergency Stop')}</h3>
            <p className="text-sm text-muted-foreground">
                {t('Enable this option to immediately disable the public estimation form and display a maintenance message.')}
            </p>
            <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div>
                        <Label htmlFor="emergencyStopEnabled" className={cn("font-semibold", form.watch('emergencyStopEnabled') && "text-destructive")}>{t('Disable the estimation service')}</Label>
                        <p className="text-sm text-muted-foreground">{t('The form will no longer be accessible to the public.')}</p>
                    </div>
                    <Switch
                        id="emergencyStopEnabled"
                        checked={form.watch('emergencyStopEnabled')}
                        onCheckedChange={(checked) => form.setValue('emergencyStopEnabled', checked)}
                        className="data-[state=checked]:bg-destructive"
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="emergencyStopMessage">{t('Emergency stop message')}</Label>
                <Textarea
                    id="emergencyStopMessage"
                    placeholder={t('For maintenance reasons...')}
                    {...form.register('emergencyStopMessage')}
                    rows={4}
                />
                </div>
            <div className="space-y-2">
                <Label htmlFor="emergencyReturnUrl">{t('Return URL (homepage)')}</Label>
                <Controller
                    control={form.control}
                    name="emergencyReturnUrl"
                    render={({ field }) => (
                        <InputWithUpload
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="https://yoursite.com"
                        />
                    )}
                />
            </div>
            </div>
        )}
        
        {section === 'images' && (
            <div className="space-y-4">
            <h3 className="font-medium">{t('Application Images')}</h3>
            <div className="space-y-2">
                <Label>{t('Screen Image (URL)')}</Label>
                <Controller name="previewScreenImageUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            <div className="space-y-2">
                <Label>{t('Screen Dimensions (Video URL)')}</Label>
                <Controller name="previewScreenVideoUrl" control={form.control} render={({ field }) => <InputWithUpload value={field.value} onChange={field.onChange} placeholder="https://..." />} />
            </div>
            </div>
        )}

        {section === 'messaging' && (
            <div className="space-y-8">
                <div className="space-y-1 pb-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('Messaging Configuration')}</h3>
                    <p className="text-sm font-medium text-slate-500">{t('Manage access to internal messaging for different roles.')}</p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                        <div className="space-y-1">
                            <Label htmlFor="messaging.enabled" className="text-sm font-black text-slate-900">{t('Enable global messaging')}</Label>
                            <p className="text-xs text-slate-500">{t('If disabled, the chat will no longer be visible or accessible to anyone.')}</p>
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
                                    <Label htmlFor="messaging.allowCommercialMessaging" className="text-sm font-bold text-slate-900">{t('Commercial')}</Label>
                                    <p className="text-[11px] text-slate-500">{t('Allow commercial users to use the chat.')}</p>
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
                                    <Label htmlFor="messaging.allowSupplierMessaging" className="text-sm font-bold text-slate-900">{t('Suppliers')}</Label>
                                    <p className="text-[11px] text-slate-500">{t('Allow suppliers to use the chat.')}</p>
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
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">{t('Note about custom roles')}</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                {t('Roles created by cloning will automatically inherit these settings based on their original template.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {section !== 'general' && (
        <div className="pt-8 border-t border-slate-100">
            <Button onClick={() => handleSave(sectionLabels[section])} className="w-full md:w-auto min-w-[200px] h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2">
                {t('Save settings')}
            </Button>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
