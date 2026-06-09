'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { testSmtpConnection } from '@/app/actions/quote-actions';
import { Server, Mail, Shield, Eye, EyeOff } from 'lucide-react';

export default function SoftwareSettingsPage() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleTestSmtp = async () => {
    if (!testEmail) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an email address for the test.',
      });
      return;
    }
    
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    
    try {
      const result = await testSmtpConnection(testEmail);
      setSmtpTestResult(result);
      
      if (result.success) {
        toast({
          title: 'SMTP test successful',
          description: result.message,
          variant: 'success',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'SMTP test failed',
          description: result.message,
        });
      }
    } catch (error) {
      setSmtpTestResult({ success: false, message: 'Unexpected error during SMTP test' });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-slate-100 bg-white">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Server className="w-6 h-6 text-slate-700" />
          Software Settings
        </CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500 mt-1">
          SMTP configuration and diagnostic tools for sending emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        
        {/* SMTP Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            SMTP Settings
          </h3>
          <p className="text-xs text-slate-500">
            These settings are configured via server environment variables.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMTP Host */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">SMTP Host</Label>
              <Input
                type="text"
                placeholder="smtp.example.com"
                value={process.env.SMTP_HOST || ''}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>

            {/* SMTP Port */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">SMTP Port</Label>
              <Input
                type="number"
                placeholder="587"
                value={process.env.SMTP_PORT || ''}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>

            {/* SMTP User */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">SMTP User</Label>
              <Input
                type="text"
                placeholder="user@example.com"
                value={process.env.SMTP_USER || ''}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">SMTP Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={process.env.SMTP_PASS ? '••••••••' : ''}
                  disabled
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">The password is never displayed in plain text for security reasons.</p>
            </div>

            {/* Sender email */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Sender email</Label>
              <Input
                type="email"
                placeholder={process.env.SMTP_USER || ''}
                value={process.env.SMTP_USER || ''}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>

            {/* Security */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </Label>
              <Input
                type="text"
                placeholder={process.env.SMTP_PORT === '465' ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}
                disabled
                className="h-11 rounded-xl bg-slate-50 border-slate-200 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SMTP Test Section */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <h3 className="text-lg font-black text-slate-900 mb-4">
            Test email sending
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email" className="text-xs font-bold text-slate-700">
                Test email address
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
              Send a test
            </Button>

            {smtpTestResult && (
              <div className={`p-4 rounded-xl border ${smtpTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-sm font-bold ${smtpTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {smtpTestResult.success ? '✅ Success' : '❌ Failure'}
                </div>
                <p className={`text-sm mt-1 ${smtpTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {smtpTestResult.message}
                </p>
                {smtpTestResult.details && (
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs font-bold text-slate-600 mb-2">Detailed diagnostic:</p>
                    <pre className="text-[10px] text-slate-500 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(smtpTestResult.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              💡 The test will send a confirmation email to the entered address. If the SMTP configuration is not set (environment variables), the test will fail with an explicit message.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}