'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { testSmtpConnection } from '@/app/actions/quote-actions';
import { getSmtpSettings, updateSmtpSettings } from '@/app/admin/actions';
import { Server, Mail, Shield, Eye, EyeOff, Save, RefreshCw, Bug, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';

export default function SoftwareSettingsPage() {
  const { toast } = useToast();
  const { t } = useAdminT();
  
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: 'PixiaTech',
    isCustom: false,
  });
  
  const [envConfig, setEnvConfig] = useState({
    host: '',
    port: 587,
    user: '',
    hasPass: false,
    fromEmail: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<{ success: boolean; error?: string; logs?: string[]; messageId?: string; to?: string; host?: string; port?: number; duration?: number } | null>(null);
  const [diagEmail, setDiagEmail] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSmtpSettings();
        setSmtpSettings({
          host: data.host || '',
          port: data.port || 587,
          user: data.user || '',
          pass: data.pass || '',
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || 'PixiaTech',
          isCustom: data.isCustom || false,
        });
        if (data.envConfig) {
          setEnvConfig(data.envConfig);
        }
      } catch (error) {
        console.error('Failed to load SMTP settings:', error);
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: t('Unable to load SMTP settings.'),
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSmtpSettings(smtpSettings);
      if (result.success) {
        toast({
          title: t('Settings saved'),
          description: t('SMTP server configuration has been updated.'),
          variant: 'success',
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: result.error || t('An error occurred while saving.'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('An unexpected error occurred.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Please enter an email address for the test.'),
      });
      return;
    }
    
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    
    try {
      const result = await testSmtpConnection(testEmail, smtpSettings);
      setSmtpTestResult(result);
      
      if (result.success) {
        toast({
          title: t('SMTP test successful'),
          description: result.message,
          variant: 'success',
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('SMTP test failed'),
          description: result.message,
        });
      }
    } catch (error) {
      setSmtpTestResult({ success: false, message: t('Unexpected error during SMTP test') });
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('An unexpected error occurred.'),
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!diagEmail) {
      toast({ variant: 'destructive', title: t('Error'), description: t('Enter an email to receive the diagnostic test.') });
      return;
    }
    setIsRunningDiag(true);
    setDiagResult(null);
    try {
      const res = await fetch('/api/debug/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: diagEmail }),
      });
      const data = await res.json();
      setDiagResult(data);
    } catch (e: any) {
      setDiagResult({ success: false, error: e.message, logs: ['Fetch error: ' + e.message] });
    } finally {
      setIsRunningDiag(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const currentHost = smtpSettings.isCustom ? smtpSettings.host : envConfig.host;
  const currentPort = smtpSettings.isCustom ? smtpSettings.port : envConfig.port;
  const currentUser = smtpSettings.isCustom ? smtpSettings.user : envConfig.user;
  const currentFromEmail = smtpSettings.isCustom ? smtpSettings.fromEmail : envConfig.fromEmail;
  const currentFromName = smtpSettings.isCustom ? smtpSettings.fromName : 'PixiaTech';

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Server className="w-6 h-6 text-slate-700" />
          {t('Software Settings')}
        </CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          {t('SMTP configuration and diagnostic tools for sending emails.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        
        {/* Toggle Custom SMTP */}
        <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
          <div className="space-y-1">
            <Label className="text-sm font-black text-slate-900 cursor-pointer" onClick={() => setSmtpSettings(prev => ({ ...prev, isCustom: !prev.isCustom }))}>
              {t('Utiliser un serveur SMTP personnalisé')}
            </Label>
            <p className="text-xs text-slate-500">
              {t('Activez cette option pour surcharger la configuration système par défaut.')}
            </p>
          </div>
          <Switch
            checked={smtpSettings.isCustom}
            onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, isCustom: checked })}
          />
        </div>

        {/* SMTP Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            {t('SMTP Settings')}
          </h3>
          <p className="text-xs text-slate-500">
            {smtpSettings.isCustom
              ? t('Configurez vos propres paramètres de serveur SMTP ci-dessous.')
              : t('Ces paramètres sont configurés via les variables d\'environnement du serveur (mode lecture seule).')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMTP Host */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('SMTP Host')}</Label>
              <Input
                type="text"
                placeholder="smtp.example.com"
                value={currentHost}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                disabled={!smtpSettings.isCustom}
                className={`h-11 rounded-xl focus:ring-slate-900 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>

            {/* SMTP Port */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('SMTP Port')}</Label>
              <Input
                type="number"
                placeholder="587"
                value={currentPort}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value, 10) || 587 })}
                disabled={!smtpSettings.isCustom}
                className={`h-11 rounded-xl focus:ring-slate-900 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>

            {/* SMTP User */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('SMTP User')}</Label>
              <Input
                type="text"
                placeholder="user@example.com"
                value={currentUser}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                disabled={!smtpSettings.isCustom}
                className={`h-11 rounded-xl focus:ring-slate-900 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('SMTP Password')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={smtpSettings.isCustom ? "••••••••" : (envConfig.hasPass ? "••••••••" : "")}
                  value={smtpSettings.isCustom ? smtpSettings.pass : (envConfig.hasPass ? '••••••••' : '')}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                  disabled={!smtpSettings.isCustom}
                  className={`h-11 rounded-xl focus:ring-slate-900 pr-12 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">{t('The password is never displayed in plain text for security reasons.')}</p>
            </div>

            {/* Sender email */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('Sender email')}</Label>
              <Input
                type="email"
                placeholder="noreply@example.com"
                value={currentFromEmail}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                disabled={!smtpSettings.isCustom}
                className={`h-11 rounded-xl focus:ring-slate-900 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>

            {/* Sender name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('Sender name')}</Label>
              <Input
                type="text"
                placeholder="PixiaTech"
                value={currentFromName}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                disabled={!smtpSettings.isCustom}
                className={`h-11 rounded-xl focus:ring-slate-900 ${!smtpSettings.isCustom ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
              />
            </div>

            {/* Security */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('Security')}
              </Label>
              <Input
                type="text"
                value={currentPort === 465 ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save Custom Settings Button */}
        {smtpSettings.isCustom && (
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full md:w-auto min-w-[200px] h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t('Save settings')}
            </Button>
          </div>
        )}

        {/* SMTP Test Section */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <h3 className="text-lg font-black text-slate-900 mb-4">
            {t('Test email sending')}
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email" className="text-xs font-bold text-slate-700">
                {t('Test email address')}
              </Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
              />
            </div>

            <Button
              onClick={handleTestSmtp}
              disabled={isTestingSmtp}
              className="w-full md:w-auto min-w-[200px] h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTestingSmtp && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('Send a test')}
            </Button>

            {smtpTestResult && (
              <div className={`p-4 rounded-xl border ${smtpTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-sm font-bold ${smtpTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {smtpTestResult.success ? '✅ ' + t('Success') : '❌ ' + t('Failure')}
                </div>
                <p className={`text-sm mt-1 ${smtpTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {smtpTestResult.message}
                </p>
                {smtpTestResult.details && (
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs font-bold text-slate-600 mb-2">{t('Detailed diagnostic:')}</p>
                    <pre className="text-[10px] text-slate-500 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(smtpTestResult.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              💡 {t('The test will send a confirmation email with detailed diagnostic information.')}
            </p>
          </div>
        </div>

        {/* === FULL DIAGNOSTIC SECTION === */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-500" />
            {t('Complete SMTP Diagnostic')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {t('Runs a full diagnostic check of your SMTP server configuration. An email will be sent to the address below.')}
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{t('Test recipient email')}</Label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={diagEmail}
                onChange={(e) => setDiagEmail(e.target.value)}
                className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900"
              />
            </div>

            <Button
              onClick={handleRunDiagnostic}
              disabled={isRunningDiag}
              className="w-full md:w-auto min-w-[240px] h-12 rounded-xl font-black bg-orange-600 text-white hover:bg-orange-700 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRunningDiag ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> {t('Diagnostic in progress...')}</>
              ) : (
                <><Bug className="w-4 h-4" /> {t('Run full diagnostic')}</>
              )}
            </Button>

            {diagResult && (
              <div className={`rounded-xl border p-4 space-y-3 ${
                diagResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                {/* Header */}
                <div className="flex items-center gap-2">
                  {diagResult.success
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <XCircle className="w-5 h-5 text-red-600" />
                  }
                  <span className={`font-black text-sm ${diagResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {diagResult.success ? '✅ ' + t('Email sent successfully!') : '❌ ' + t('Diagnostic failed')}
                  </span>
                  {diagResult.duration && (
                    <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {diagResult.duration}ms
                    </span>
                  )}
                </div>

                {/* Details */}
                {diagResult.success && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/70 rounded-lg p-2">
                      <span className="font-bold text-slate-600">{t('Sent to')}</span>
                      <p className="text-slate-800">{diagResult.to}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                      <span className="font-bold text-slate-600">{t('Server used')}</span>
                      <p className="text-slate-800">{diagResult.host}:{diagResult.port}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2 col-span-2">
                      <span className="font-bold text-slate-600">MessageId</span>
                      <p className="text-slate-800 font-mono text-[10px] break-all">{diagResult.messageId}</p>
                    </div>
                  </div>
                )}

                {diagResult.error && (
                  <div className="bg-white/70 rounded-lg p-2">
                    <span className="font-bold text-red-600 text-xs">{t('Error:')}</span>
                    <p className="text-red-800 text-xs font-mono mt-1">{diagResult.error}</p>
                  </div>
                )}

                {/* Step-by-step logs */}
                {diagResult.logs && diagResult.logs.length > 0 && (
                  <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    <p className="text-xs font-bold text-slate-400 mb-2">📋 {t('Detailed logs:')}</p>
                    {diagResult.logs.map((log, i) => (
                      <div key={i} className={`text-[11px] font-mono py-0.5 ${
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.startsWith('[ENV]') ? 'text-blue-300' :
                        log.startsWith('[DB]') ? 'text-purple-300' :
                        log.startsWith('[RESOLVE]') ? 'text-yellow-300' :
                        log.startsWith('[SEND]') ? 'text-cyan-300' :
                        'text-slate-300'
                      }`}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}