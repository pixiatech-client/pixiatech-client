'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getPayPalSettings, updatePayPalSettings } from '@/app/admin/actions';
import { useAdminT } from '@/hooks/useAdminT';
import {
  CreditCard,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  Pencil,
  Wallet,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import LiquidLoader from '@/components/LiquidLoader';

// ── Types ─────────────────────────────────────────────────────────────────────

type PayPalSection = {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  enabled: boolean;
  secretSaved: boolean;
  showSecret: boolean;
};

type TestState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  accountEmail?: string;
};

// ── Sub-component: Section de credentials ─────────────────────────────────────

function CredentialSection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  mode,
  section,
  onChange,
  onSave,
  isSaving,
  testState,
  onTest,
  enabledLabel,
  enabledDesc,
  hint,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  mode: 'paypal' | 'card';
  section: PayPalSection;
  onChange: (patch: Partial<PayPalSection>) => void;
  onSave: () => void;
  isSaving: boolean;
  testState: TestState;
  onTest: () => void;
  enabledLabel: string;
  enabledDesc: string;
  hint?: string;
}) {
  return (
    <Card className="rounded-2xl border border-theme-card-border shadow-sm bg-theme-card overflow-hidden">
      <CardHeader className="pb-5 border-b border-theme-card-border bg-theme-card">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-theme-text tracking-tight flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <Pencil className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Modifiable</span>
          </div>
        </div>
        <CardDescription className="text-sm font-medium text-theme-text-secondary mt-2">
          {subtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-5">

        {/* Activer / Désactiver */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-theme-card-border bg-theme-card">
          <div className="min-w-0">
            <p className="text-sm font-bold text-theme-text">{enabledLabel}</p>
            <p className="text-xs text-theme-text-secondary mt-0.5">{enabledDesc}</p>
          </div>
          <Switch
            id={`${mode}-enabled`}
            checked={section.enabled}
            onCheckedChange={(val) => onChange({ enabled: val })}
            className="shrink-0"
          />
        </div>

        {/* Environnement */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-theme-text flex items-center gap-2">
            <Globe className="w-4 h-4 text-theme-text-secondary" />
            Environnement
          </h4>
          <RadioGroup
            value={section.environment}
            onValueChange={(val) => onChange({ environment: val as 'sandbox' | 'live' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sandbox" id={`${mode}-sandbox`} />
              <Label htmlFor={`${mode}-sandbox`} className="font-medium text-theme-text cursor-pointer flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">TEST</Badge>
                Sandbox
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="live" id={`${mode}-live`} />
              <Label htmlFor={`${mode}-live`} className="font-medium text-theme-text cursor-pointer flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">LIVE</Badge>
                Production
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          {/* Client ID */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-theme-text">
              {mode === 'card' ? 'Client ID PayPal (Carte)' : 'Client ID PayPal'}
            </Label>
            <Input
              type="text"
              placeholder="Axxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={section.clientId}
              onChange={(e) => onChange({ clientId: e.target.value })}
              className="h-11 rounded-xl bg-theme-card border-theme-card-border focus:ring-theme-sidebar-active-bg font-mono text-sm text-theme-text"
            />
            <p className="text-[10px] text-theme-text-secondary">
              {mode === 'card'
                ? 'Peut être identique au Client ID du compte PayPal si vous utilisez le même compte.'
                : 'Trouvé dans le tableau de bord PayPal Developer, section "API Credentials".'}
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-theme-text">
              {mode === 'card' ? 'Secret PayPal (Carte)' : 'Secret PayPal'}
            </Label>
            <div className="relative">
              <Input
                type={section.showSecret ? 'text' : 'password'}
                placeholder={section.secretSaved ? '••••••••••••••' : 'Entrez votre secret'}
                value={section.clientSecret}
                onChange={(e) => {
                  onChange({ clientSecret: e.target.value });
                  if (e.target.value) onChange({ secretSaved: false });
                }}
                className="h-11 rounded-xl bg-theme-card border-theme-card-border focus:ring-theme-sidebar-active-bg font-mono text-sm text-theme-text pr-12"
              />
              <button
                type="button"
                onClick={() => onChange({ showSecret: !section.showSecret })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-theme-text-secondary hover:text-theme-text transition-colors"
                aria-label={section.showSecret ? 'Masquer le secret' : 'Afficher le secret'}
              >
                {section.showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-theme-text-secondary">
              {section.secretSaved
                ? 'Un secret est déjà enregistré. Laissez le champ vide pour le conserver.'
                : 'Le secret ne sera jamais affiché après enregistrement.'}
            </p>
          </div>
        </div>

        {hint && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{hint}</p>
          </div>
        )}

        {/* Résultat du test */}
        {testState.status !== 'idle' && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
            testState.status === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
              : testState.status === 'error'
              ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
              : 'bg-theme-card border-theme-card-border'
          }`}>
            {testState.status === 'loading' && <Loader2 className="w-5 h-5 text-theme-text-secondary animate-spin flex-shrink-0 mt-0.5" />}
            {testState.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
            {testState.status === 'error' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`text-sm font-bold ${
                testState.status === 'success' ? 'text-emerald-800 dark:text-emerald-300'
                : testState.status === 'error' ? 'text-red-800 dark:text-red-300'
                : 'text-theme-text'
              }`}>
                {testState.status === 'loading' ? 'Test en cours…'
                  : testState.status === 'success' ? 'Connexion réussie !'
                  : 'Connexion échouée'}
              </p>
              {testState.message && (
                <p className={`text-xs mt-0.5 ${
                  testState.status === 'success' ? 'text-emerald-700 dark:text-emerald-400'
                  : testState.status === 'error' ? 'text-red-700 dark:text-red-400'
                  : 'text-theme-text-secondary'
                }`}>
                  {testState.message}
                  {testState.accountEmail && (
                    <span className="font-bold"> — {testState.accountEmail}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-theme-card-border">
          {/* Tester la connexion */}
          <Button
            variant="outline"
            onClick={onTest}
            disabled={testState.status === 'loading' || isSaving}
            className="h-11 rounded-xl font-bold flex items-center gap-2 border-theme-card-border"
          >
            {testState.status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Tester la connexion
          </Button>

          {/* Enregistrer */}
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="h-11 rounded-xl font-black bg-theme-btn-primary-bg text-theme-btn-primary-text hover:bg-theme-btn-primary-hover shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <LiquidLoader size={16} /> : <Save className="w-4 h-4" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function PayPalSettingsPage() {
  const { toast } = useToast();
  const { t } = useAdminT();

  // Mode "Compte PayPal"
  const [paypalSection, setPaypalSection] = useState<PayPalSection>({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    enabled: true,
    secretSaved: false,
    showSecret: false,
  });

  // Mode "Carte bancaire via PayPal"
  const [cardSection, setCardSection] = useState<PayPalSection>({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    enabled: true,
    secretSaved: false,
    showSecret: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPaypal, setIsSavingPaypal] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  const [testPaypal, setTestPaypal] = useState<TestState>({ status: 'idle', message: '' });
  const [testCard, setTestCard] = useState<TestState>({ status: 'idle', message: '' });

  // ── Chargement initial ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const data = await getPayPalSettings();
        setPaypalSection({
          clientId: data.clientId || '',
          clientSecret: '',
          environment: data.environment || 'sandbox',
          enabled: data.enablePaypal !== false,
          secretSaved: Boolean(data.hasClientSecret),
          showSecret: false,
        });
        setCardSection({
          clientId: data.card?.clientId || '',
          clientSecret: '',
          environment: data.card?.environment || 'sandbox',
          enabled: data.enableCardPayments !== false,
          secretSaved: Boolean(data.card?.hasClientSecret),
          showSecret: false,
        });
      } catch (error) {
        console.error('Failed to load PayPal settings:', error);
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: 'Impossible de charger les paramètres PayPal.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [toast, t]);

  // ── Sauvegarde PayPal ───────────────────────────────────────────────────────

  const handleSavePaypal = async () => {
    setIsSavingPaypal(true);
    try {
      const result = await updatePayPalSettings({
        clientId: paypalSection.clientId,
        clientSecret: paypalSection.clientSecret || undefined,
        environment: paypalSection.environment,
        enablePaypal: paypalSection.enabled,
      });
      if (result.success) {
        const hasSecret = (result as any).hasClientSecret === true || Boolean(paypalSection.clientSecret) || paypalSection.secretSaved;
        setPaypalSection((s) => ({ ...s, clientSecret: '', secretSaved: hasSecret }));
        setTestPaypal({ status: 'idle', message: '' });
        toast({ title: 'Enregistré', description: 'Configuration PayPal mise à jour.', variant: 'success' });
      } else {
        toast({ variant: 'destructive', title: t('Error'), description: (result as any).error || 'Erreur lors de l\'enregistrement.' });
      }
    } catch {
      toast({ variant: 'destructive', title: t('Error'), description: 'Erreur inattendue.' });
    } finally {
      setIsSavingPaypal(false);
    }
  };

  // ── Sauvegarde Carte ────────────────────────────────────────────────────────

  const handleSaveCard = async () => {
    setIsSavingCard(true);
    try {
      const result = await updatePayPalSettings({
        enableCardPayments: cardSection.enabled,
        card: {
          clientId: cardSection.clientId,
          clientSecret: cardSection.clientSecret || undefined,
          environment: cardSection.environment,
        },
      });
      if (result.success) {
        const hasSecret = (result as any).hasCardSecret === true || Boolean(cardSection.clientSecret) || cardSection.secretSaved;
        setCardSection((s) => ({ ...s, clientSecret: '', secretSaved: hasSecret }));
        setTestCard({ status: 'idle', message: '' });
        toast({ title: 'Enregistré', description: 'Configuration carte mise à jour.', variant: 'success' });
      } else {
        toast({ variant: 'destructive', title: t('Error'), description: (result as any).error || 'Erreur lors de l\'enregistrement.' });
      }
    } catch {
      toast({ variant: 'destructive', title: t('Error'), description: 'Erreur inattendue.' });
    } finally {
      setIsSavingCard(false);
    }
  };

  // ── Test de connexion ───────────────────────────────────────────────────────

  const handleTest = async (mode: 'paypal' | 'card') => {
    const setState = mode === 'paypal' ? setTestPaypal : setTestCard;
    setState({ status: 'loading', message: '' });
    try {
      const res = await fetch('/api/paypal/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        const envLabel = data.environment === 'live' ? 'Production' : 'Sandbox';
        setState({
          status: 'success',
          message: `Connexion ${envLabel} vérifiée.`,
          accountEmail: data.accountEmail || undefined,
        });
      } else {
        setState({ status: 'error', message: data.error || 'Connexion échouée.' });
      }
    } catch {
      setState({ status: 'error', message: 'Erreur réseau lors du test.' });
    }
  };

  // ── Rendu ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LiquidLoader size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ─── Avertissement double désactivation ─────────────────────────────── */}
      {!paypalSection.enabled && !cardSection.enabled && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">Aucun moyen de paiement actif</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              Les deux modes PayPal sont désactivés. Aucune option de paiement ne sera proposée aux clients.
            </p>
          </div>
        </div>
      )}

      {/* ─── Section 1 : Compte PayPal ──────────────────────────────────────── */}
      <CredentialSection
        title="Compte PayPal"
        subtitle="Permet aux clients de payer avec leur compte PayPal (bouton jaune PayPal)."
        icon={Wallet}
        iconColor="text-[#003087]"
        iconBg="bg-[#003087]/10"
        mode="paypal"
        section={paypalSection}
        onChange={(patch) => setPaypalSection((s) => ({ ...s, ...patch }))}
        onSave={handleSavePaypal}
        isSaving={isSavingPaypal}
        testState={testPaypal}
        onTest={() => handleTest('paypal')}
        enabledLabel="Activer le paiement avec compte PayPal"
        enabledDesc={
          paypalSection.enabled
            ? 'Le bouton "Payer avec PayPal" est visible sur le checkout.'
            : 'Le bouton PayPal est masqué sur le checkout.'
        }
      />

      {/* ─── Section 2 : Carte bancaire via PayPal ──────────────────────────── */}
      <CredentialSection
        title="Carte bancaire via PayPal"
        subtitle="Permet aux clients de payer par carte (Visa, Mastercard…) sans compte PayPal, via l'infrastructure PayPal."
        icon={CreditCard}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-100/70"
        mode="card"
        section={cardSection}
        onChange={(patch) => setCardSection((s) => ({ ...s, ...patch }))}
        onSave={handleSaveCard}
        isSaving={isSavingCard}
        testState={testCard}
        onTest={() => handleTest('card')}
        enabledLabel="Activer le paiement par carte bancaire"
        enabledDesc={
          cardSection.enabled
            ? 'Le bouton "Payer par carte" est visible sur le checkout.'
            : 'Le bouton carte est masqué sur le checkout.'
        }
        hint="Le paiement par carte utilise l'infrastructure PayPal (FUNDING.CARD). Les identifiants peuvent être identiques à ceux du compte PayPal ou provenir d'un compte PayPal distinct."
      />

      {/* ─── Sécurité ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Avis de sécurité</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Ces identifiants sont stockés de manière sécurisée dans Firestore et ne sont jamais exposés dans le code côté client. Seuls les administrateurs autorisés peuvent accéder à cette page.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20">
          <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300">Protection des clés de paiement</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Les clés secrètes PayPal (Client Secret) sont des données sensibles. Elles ne sont <strong>jamais</strong> transmises au navigateur, jamais loguées dans la console, et jamais incluses dans les réponses API publiques. Seul le serveur y a accès pour authentifier les appels PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
