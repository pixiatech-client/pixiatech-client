import { NextRequest, NextResponse } from 'next/server';
import { getMessage, getSmtpConfig, addMessageReply } from '@/lib/site-web/firestore';
import { getTransporter } from '@/lib/site-web/transport';
import { requireAdmin } from '@/lib/site-web/auth';
import type { ContactMessageReply } from '@/lib/site-web/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Adresse email du destinataire invalide.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { success: false, message: 'L’objet du message ne peut pas être vide.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Le contenu du message ne peut pas être vide.' },
        { status: 400 }
      );
    }

    const originalMessage = await getMessage(id);
    if (!originalMessage) {
      return NextResponse.json(
        { success: false, message: 'Message d’origine introuvable.' },
        { status: 404 }
      );
    }

    // Récupérer la configuration SMTP existante
    const smtpConfig = await getSmtpConfig();
    if (!smtpConfig.enabled || !smtpConfig.host || !smtpConfig.user) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Le serveur SMTP n’est pas configuré ou est désactivé. Veuillez vérifier les paramètres dans l’onglet « SMTP & envoi ».',
        },
        { status: 400 }
      );
    }

    const transporter = getTransporter(smtpConfig);
    if (!transporter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Impossible d’initialiser le transporteur SMTP avec la configuration actuelle.',
        },
        { status: 500 }
      );
    }

    const replySubject = subject.trim();
    const replyBody = message.trim();
    const sentAt = new Date().toISOString();

    const formattedDate = new Date(originalMessage.createdAt).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailHtml = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #0c0d12; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden;">
        <div style="background: #11141c; padding: 24px; border-bottom: 1px solid #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38E044; font-weight: 800; background: rgba(56, 224, 68, 0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(56, 224, 68, 0.2);">
              PIXIATECH
            </span>
          </div>
          <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 16px 0 4px 0;">${replySubject}</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Réponse à votre demande de contact</p>
        </div>

        <div style="padding: 24px;">
          <!-- Réponse de l'administrateur -->
          <div style="font-size: 14.5px; line-height: 1.7; color: #f1f5f9; white-space: pre-wrap; margin-bottom: 28px;">
${replyBody}
          </div>

          <div style="border-top: 1px dashed #334155; margin: 24px 0;"></div>

          <!-- Rappel du message d'origine -->
          <div style="background: #11141c; border: 1px solid #1e293b; border-radius: 8px; padding: 18px;">
            <p style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">
              Votre message du ${formattedDate} :
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8; white-space: pre-wrap; font-style: italic;">
${originalMessage.message}
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
            PIXIATECH — Solutions d'affichage dynamique & murs LED • <a href="https://pixiatech.com" style="color: #38E044; text-decoration: none;">pixiatech.com</a>
          </div>
        </div>
      </div>
    `;

    const emailText = `
${replyBody}

--------------------------------------------------
Votre message du ${formattedDate} :
${originalMessage.message}
--------------------------------------------------
PIXIATECH — Solutions d'affichage dynamique & murs LED
https://pixiatech.com
    `.trim();

    // Envoi par le serveur SMTP
    await transporter.sendMail({
      from: smtpConfig.fromEmail || smtpConfig.user,
      to: to.trim(),
      replyTo: smtpConfig.fromEmail || smtpConfig.user,
      subject: replySubject,
      text: emailText,
      html: emailHtml,
    });

    const replyEntry: ContactMessageReply = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subject: replySubject,
      message: replyBody,
      sentAt,
      sentBy: auth.uid,
      recipientEmail: to.trim(),
    };

    const updatedMessage = await addMessageReply(id, replyEntry);

    return NextResponse.json({
      success: true,
      message: 'Votre réponse a été envoyée avec succès par email.',
      data: updatedMessage,
      reply: replyEntry,
    });
  } catch (err: unknown) {
    console.error('[siteWeb reply] SMTP error:', err);
    return NextResponse.json(
      {
        success: false,
        message: `Échec de l’envoi de l’email : ${(err as Error).message || 'Erreur SMTP inconnue.'}`,
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
