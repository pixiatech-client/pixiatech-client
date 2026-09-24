import { NextRequest, NextResponse } from 'next/server';
import { getSmtpConfig, getContactInfo } from '@/lib/site-web/firestore';
import { getTransporter } from '@/lib/site-web/transport';
import { requireAdmin } from '@/lib/site-web/auth';
import type { SmtpConfig } from '@/lib/site-web/types';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { testRecipient, customConfig } = await request.json();
    const current = await getSmtpConfig();
    const configToTest: SmtpConfig = customConfig ? { ...current, ...customConfig } : current;

    if (!configToTest.host || !configToTest.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration SMTP incomplète. Veuillez renseigner au minimum l'hôte (Host) et l'utilisateur (User).",
        },
        { status: 400 }
      );
    }

    const transporter = getTransporter(configToTest);
    if (!transporter) {
      return NextResponse.json({ success: false, message: "Impossible d'initialiser le transporteur SMTP." }, { status: 400 });
    }

    try {
      await transporter.verify();
      const contactInfo = await getContactInfo();
      const targetEmail = testRecipient || configToTest.recipientEmail || contactInfo.primaryEmail;
      const sendResult = await transporter.sendMail({
        from: configToTest.fromEmail || `PIXIATECH <${configToTest.user}>`,
        to: targetEmail,
        subject: 'PIXIATECH - Test de connexion SMTP réussi',
        text: `Bonjour,\n\nCeci est un email de test confirmant que la passerelle SMTP de PIXIATECH (${configToTest.host}:${configToTest.port}) est correctement configurée et fonctionnelle.\n\nDate: ${new Date().toLocaleString('fr-FR')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b0c10; color: #ffffff; border-radius: 8px; border: 1px solid #1f293d;">
            <div style="border-bottom: 1px solid #2d3748; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">PIXIATECH - Passerelle SMTP</h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Validation des paramètres d'envoi en direct</p>
            </div>
            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6;">
              La vérification de votre serveur de messagerie a réussi avec succès.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #cbd5e1;">
              <tr><td style="padding: 8px 0; color: #94a3b8;">Hôte SMTP :</td><td style="padding: 8px 0; font-family: monospace;">${configToTest.host}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">Port :</td><td style="padding: 8px 0; font-family: monospace;">${configToTest.port} (SSL/TLS: ${configToTest.secure ? 'Oui' : 'Non'})</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">Compte expéditeur :</td><td style="padding: 8px 0; font-family: monospace;">${configToTest.user}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">Date du test :</td><td style="padding: 8px 0;">${new Date().toLocaleString('fr-FR')}</td></tr>
            </table>
            <div style="background: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; padding: 12px; font-size: 13px; color: #7dd3fc;">
              Les formulaires soumis sur la page Contactez-nous seront désormais transmis instantanément vers cette boîte.
            </div>
          </div>
        `,
      });

      return NextResponse.json({
        success: true,
        message: `Connexion SMTP validée avec succès ! Email de test envoyé à ${targetEmail}.`,
        details: { messageId: sendResult.messageId, target: targetEmail },
      });
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Erreur de connexion SMTP inconnue.';
      return NextResponse.json({ success: false, message: `Échec du test SMTP : ${errorMsg}`, error: errorMsg }, { status: 500 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}