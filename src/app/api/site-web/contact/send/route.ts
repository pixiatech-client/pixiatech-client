import { NextRequest, NextResponse } from 'next/server';
import { getSmtpConfig, getContactInfo, saveMessage, getAutoResponderConfig } from '@/lib/site-web/firestore';
import { getTransporter } from '@/lib/site-web/transport';
import { rateLimitExceeded } from '@/lib/rate-limit';
import type { ContactMessage, ContactSubmissionPayload } from '@/lib/site-web/types';

export async function POST(request: NextRequest) {
  if (rateLimitExceeded(request, 10, 200)) {
    return NextResponse.json(
      { success: false, message: 'Trop de demandes, veuillez réessayer plus tard.' },
      { status: 429 }
    );
  }

  try {
    const payload = (await request.json()) as ContactSubmissionPayload;

    if (!payload.name || !payload.email || !payload.message) {
      return NextResponse.json(
        { success: false, message: 'Veuillez remplir tous les champs obligatoires (Nom, Email, Message).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return NextResponse.json({ success: false, message: 'Veuillez fournir une adresse email valide.' }, { status: 400 });
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let deliveryStatus: ContactMessage['emailDeliveryStatus'] = 'simulated';
    let deliveryNote = 'Message enregistré en boîte de réception locale.';

    const smtpConfig = await getSmtpConfig();
    const contactInfo = await getContactInfo();

    if (smtpConfig.enabled && smtpConfig.host && smtpConfig.user) {
      const transporter = getTransporter(smtpConfig);
      if (transporter) {
        try {
          const emailSubject = `[Contact PIXIATECH] ${payload.subject || 'Nouveau message'} - ${payload.name}`;
          await transporter.sendMail({
            from: smtpConfig.fromEmail || contactInfo.primaryEmail,
            to: smtpConfig.recipientEmail || contactInfo.primaryEmail,
            replyTo: payload.email,
            subject: emailSubject,
            text: `
NOUVEAU MESSAGE DE CONTACT - PIXIATECH
--------------------------------------
Nom: ${payload.name}
Email: ${payload.email}
Téléphone: ${payload.phone || 'Non précisé'}
Entreprise: ${payload.company || 'Particulier / Non précisé'}
Projet: ${payload.projectType || 'Standard'}
Objet: ${payload.subject || 'Demande générale'}

Message:
${payload.message}
--------------------------------------
Date: ${new Date().toLocaleString('fr-FR')}
            `,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #0c0d12; color: #f8fafc; border-radius: 8px; border: 1px solid #1e293b; overflow: hidden;">
                <div style="background: #11141c; padding: 24px; border-bottom: 1px solid #1e293b;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: bold; background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 4px;">Demande entrante</span>
                  <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0;">${payload.subject || 'Nouveau message de contact'}</h1>
                  <p style="color: #94a3b8; font-size: 13px; margin: 0;">Reçu via le formulaire du site web PIXIATECH</p>
                </div>
                <div style="padding: 24px;">
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 8px 12px; background: #161a24; color: #94a3b8; width: 30%; font-size: 13px; border-bottom: 1px solid #1e293b;">Expéditeur :</td>
                      <td style="padding: 8px 12px; background: #161a24; color: #ffffff; font-weight: bold; font-size: 13px; border-bottom: 1px solid #1e293b;">${payload.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; background: #11141c; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Email :</td>
                      <td style="padding: 8px 12px; background: #11141c; color: #38bdf8; font-size: 13px; border-bottom: 1px solid #1e293b;"><a href="mailto:${payload.email}" style="color: #38bdf8; text-decoration: none;">${payload.email}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; background: #161a24; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Téléphone :</td>
                      <td style="padding: 8px 12px; background: #161a24; color: #ffffff; font-size: 13px; border-bottom: 1px solid #1e293b;">${payload.phone || 'Non renseigné'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; background: #11141c; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Entreprise :</td>
                      <td style="padding: 8px 12px; background: #11141c; color: #ffffff; font-size: 13px; border-bottom: 1px solid #1e293b;">${payload.company || 'Non renseignée'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; background: #161a24; color: #94a3b8; font-size: 13px;">Catégorie :</td>
                      <td style="padding: 8px 12px; background: #161a24; color: #38bdf8; font-size: 13px; font-weight: 500;">${payload.projectType || 'Général'}</td>
                    </tr>
                  </table>
                  <div style="background: #11141c; border: 1px solid #1e293b; border-radius: 6px; padding: 18px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Contenu du message :</h3>
                    <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #f1f5f9;">${payload.message}</p>
                  </div>
                  <div style="font-size: 12px; color: #64748b; text-align: center;">
                    Vous pouvez répondre directement à cet email pour contacter ${payload.name} (${payload.email}).
                  </div>
                </div>
              </div>
            `,
          });
          deliveryStatus = 'sent';
          deliveryNote = `Transmis avec succès à ${smtpConfig.recipientEmail} via ${smtpConfig.host}`;
        } catch (mailErr: unknown) {
          deliveryStatus = 'failed';
          deliveryNote = `Erreur d'envoi SMTP : ${(mailErr as Error).message}`;
          console.error('[siteWeb send] SMTP send error:', mailErr);
        }
      }
    } else {
      deliveryStatus = 'simulated';
      deliveryNote = 'Message stocké localement. Configurez le SMTP dans la console d\'administration pour un envoi en direct.';
    }

    // ---- Répondeur automatique sécurisé (si configuré et activé) ----
    let autoReplySent = false;
    let autoReplySentAt: string | undefined = undefined;
    let autoReplyError: string | undefined = undefined;

    try {
      const autoConfig = await getAutoResponderConfig();
      if (autoConfig.enabled && smtpConfig.enabled && smtpConfig.host && smtpConfig.user) {
        const transporter = getTransporter(smtpConfig);
        if (transporter) {
          const clientName = payload.name.trim();
          const clientEmail = payload.email.trim();
          const originalSubject = payload.subject ? payload.subject.trim() : 'Demande de contact';

          const renderTemplate = (text: string) =>
            text
              .replace(/\{\{\s*client_name\s*\}\}/gi, clientName)
              .replace(/\{\{\s*client_email\s*\}\}/gi, clientEmail)
              .replace(/\{\{\s*subject\s*\}\}/gi, originalSubject);

          const autoSubject = renderTemplate(autoConfig.subject || 'Nous avons bien reçu votre demande – Pixiatech');
          const autoBody = renderTemplate(autoConfig.template);

          const autoHtml = `
            <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #0c0d12; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden;">
              <div style="background: #11141c; padding: 24px; border-bottom: 1px solid #1e293b;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38E044; font-weight: 800; background: rgba(56, 224, 68, 0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(56, 224, 68, 0.2);">
                  PIXIATECH
                </span>
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 16px 0 4px 0;">${autoSubject}</h1>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Confirmation automatique de prise en charge</p>
              </div>
              <div style="padding: 24px;">
                <div style="font-size: 14.5px; line-height: 1.7; color: #f1f5f9; white-space: pre-wrap; margin-bottom: 24px;">
${autoBody}
                </div>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
                  PIXIATECH — Solutions d'affichage dynamique & murs LED • <a href="https://pixiatech.com" style="color: #38E044; text-decoration: none;">pixiatech.com</a>
                </div>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: smtpConfig.fromEmail || smtpConfig.user,
            to: clientEmail,
            replyTo: smtpConfig.fromEmail || smtpConfig.user,
            subject: autoSubject,
            text: autoBody,
            html: autoHtml,
          });

          autoReplySent = true;
          autoReplySentAt = new Date().toISOString();
        }
      }
    } catch (autoErr: unknown) {
      console.error('[siteWeb send] Autoresponder error:', autoErr);
      autoReplyError = (autoErr as Error).message || 'Erreur d’envoi répondeur automatique';
    }

    const newMessage: ContactMessage = {
      id: messageId,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: (payload.phone || '').trim(),
      company: (payload.company || '').trim(),
      projectType: payload.projectType || 'Autre',
      subject: payload.subject || 'Demande de contact',
      message: payload.message.trim(),
      consent: Boolean(payload.consent),
      createdAt: new Date().toISOString(),
      status: 'unread',
      emailDeliveryStatus: deliveryStatus,
      deliveryNote,
      autoReplySent,
      autoReplySentAt,
      autoReplyError,
    };

    await saveMessage(newMessage);

    return NextResponse.json({
      success: true,
      message:
        deliveryStatus === 'sent'
          ? 'Votre message a été transmis avec succès à l’équipe PIXIATECH. Nos experts vous répondront sous 2 heures ouvrées.'
          : 'Votre message a été bien enregistré avec succès dans notre système. Notre équipe prendra contact avec vous dans les plus brefs délais.',
      data: { id: newMessage.id, deliveryStatus: newMessage.emailDeliveryStatus, createdAt: newMessage.createdAt },
    });
  } catch (err: unknown) {
    console.error('[siteWeb send] Error handling contact submission:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Une erreur interne est survenue lors de l’envoi de votre message.',
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
