// ============================================
// Shared Email Templates — based on signaturev2
// ============================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
}

function logoSection(): string {
  return `
<table align="center" style="margin: 0 auto 18px auto; border-collapse: collapse; text-align: center;">
  <tr>
    <td align="center" style="padding: 0;">
      <div style="background-color: #0c0d12; border-radius: 20px; padding: 10px 24px; display: inline-block; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <table style="border-collapse: collapse; margin: 0 auto;">
          <tr>
            <td style="padding: 0; vertical-align: middle; text-align: left;">
              <div style="width: 32px; height: 32px; background-color: #090a0f; border: 2.5px solid #8076f8; border-radius: 50%; text-align: center; display: inline-block; vertical-align: middle; box-sizing: border-box;">
                <div style="font-family: Arial, sans-serif; font-size: 6.5px; font-weight: 900; color: #ffffff; padding-top: 6px; line-height: 1.1; letter-spacing: 0.3px;">PIXIA</div>
                <div style="font-family: Arial, sans-serif; font-size: 6.5px; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: 0.3px;">TECH</div>
              </div>
            </td>
            <td style="padding-left: 10px; vertical-align: middle; text-align: left;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 1px; line-height: 1.1;">PIXIATECH</div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 8px; font-weight: 700; color: #3b82f6; letter-spacing: 2px; margin-top: 1px; text-transform: uppercase; line-height: 1;">TECHNOLOGY PRO</div>
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
</table>`;
}

function browserBar(label: string): string {
  return `
<div style="background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7; padding: 12px 20px; box-sizing: border-box;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="text-align: left; width: 33%;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ff5f56; margin-right: 4px;"></span>
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ffbd2e; margin-right: 4px;"></span>
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #27c93f;"></span>
      </td>
      <td style="text-align: right; font-family: monospace; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; width: 67%;">
        ${label}
      </td>
    </tr>
  </table>
</div>`;
}

function footer(lang?: string): string {
  return `
<div style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center; font-family: sans-serif; font-size: 10px; color: #9ca3af; line-height: 1.5;">
  <p style="margin: 0 0 4px 0;">${lang === 'en' ? 'This automatic message is encrypted. PandaDoc Secure Shield.' : 'Ce message automatique est crypté. PandaDoc Secure Shield.'}</p>
  <p style="margin: 0;">© 2026 PixiaTech Europe. <a href="mailto:contact@pixiatech.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">${lang === 'en' ? 'Contact support' : 'Contacter le support'}</a></p>
</div>`;
}

function wrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PixiaTech Pro</title>
</head>
<body style="margin: 0; padding: 40px 10px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); overflow: hidden;">
    ${content}
  </div>
</body>
</html>`;
}

export function buildOtpEmailHtml(code: string, _cleanAppUrl?: string, lang?: string) {
  const now = new Date();
  const emissionTime = formatTime(now);
  const expirationDate = new Date(now.getTime() + 10 * 60 * 1000);
  const expirationTime = formatTime(expirationDate);

  const body = `
    ${browserBar('Client Webmail Sécurisé')}
    <div style="padding: 40px 30px; text-align: center;">
      ${logoSection()}
      <h3 style="margin: 0 0 6px 0; font-family: sans-serif; font-size: 14px; font-weight: 900; color: #111827; letter-spacing: 1px; text-transform: uppercase;">
        ${lang === 'en' ? 'Authentication' : 'Authentification'}
      </h3>
      <p style="margin: 0 auto 15px auto; font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.5; max-width: 360px;">
        ${lang === 'en'
          ? 'A security code is required to access your Pixiatech estimate.'
          : 'Un code de sécurité est requis pour accéder à votre estimation Pixiatech.'}
      </p>
      <div style="display: inline-flex; align-items: center; gap: 6px; background-color: #fef9c3; border: 1px solid #facc15; border-radius: 10px; padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: 800; color: #92400e; margin: 0 auto 25px auto; width: fit-content; box-shadow: 0 2px 6px rgba(250,204,21,0.1);">
        <span style="font-size: 14px;">⏳</span>
        <span>${lang === 'en' ? 'Code expires in 09:59' : 'Code expire dans 09:59'}</span>
      </div>
      <div style="margin: 0 auto 24px auto; max-width: 320px;">
        <div style="font-family: sans-serif; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 12px; font-weight: bold; text-align: center;">
          ${lang === 'en' ? 'Your temporary authentication code' : "Votre code temporaire d'authentification"}
        </div>
        <div style="text-align: center; padding: 12px 24px; background-color: #f5fafd; border: 2.5px solid #3b82f6; border-radius: 14px; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.05);">
          <span style="font-family: monospace, Courier, monospace; font-size: 26px; font-weight: 950; color: #2563eb; letter-spacing: 5px; text-transform: uppercase; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all;">${code}</span>
        </div>
      </div>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 16px 18px; text-align: left; margin-bottom: 25px; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td style="vertical-align: top; width: 20px; padding: 0;">
              <span style="font-size: 16px; line-height: 1.2;">⚠️</span>
            </td>
            <td style="vertical-align: top; padding: 0 0 0 10px;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 900; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; line-height: 1;">
                ${lang === 'en' ? 'Important Security Information' : 'Information de sécurité importante'}
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 600; color: #991b1b; line-height: 1.5;">
                ${lang === 'en'
                  ? 'This code is strictly personal. Do not share it under any circumstances, including with Pixiatech employees. It is used to prove your identity for electronically signing the estimate.'
                  : "Ce code est strictement personnel. Ne le communiquez sous aucun prétexte, y compris aux collaborateurs Pixiatech. Il sert à prouver votre identité pour signer électroniquement l'estimation."}
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
    ${footer(lang)}`;

  return wrapper(body);
}

export function buildVerificationEmailHtml(verificationUrl: string, lang?: string) {
  const body = `
    ${browserBar('Client Webmail Sécurisé')}
    <div style="padding: 40px 30px; text-align: center;">
      ${logoSection()}
      <h3 style="margin: 0 0 6px 0; font-family: sans-serif; font-size: 14px; font-weight: 900; color: #111827; letter-spacing: 1px; text-transform: uppercase;">
        ${lang === 'en' ? 'Email Verification' : 'Vérification Email'}
      </h3>
      <p style="margin: 0 auto 15px auto; font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.5; max-width: 360px;">
        ${lang === 'en'
          ? 'Please confirm your email address to finalize your Pixiatech estimate.'
          : 'Veuillez confirmer votre adresse email pour finaliser votre estimation Pixiatech.'}
      </p>
      <div style="margin-bottom: 25px;">
        <a href="${verificationUrl}" style="display: inline-block; background-color: #00a870; color: #ffffff; padding: 14px 34px; font-family: sans-serif; font-weight: bold; border-radius: 9999px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(0, 168, 112, 0.25);">
          ${lang === 'en' ? 'Confirm my email' : 'Confirmer mon email'}
        </a>
      </div>
      <p style="margin: 0; font-family: sans-serif; font-size: 10px; color: #9ca3af;">
        ${lang === 'en' ? 'This link expires in 24 hours.' : 'Ce lien expire dans 24 heures.'}
      </p>
    </div>
    ${footer(lang)}`;

  return wrapper(body);
}

// ============================================
// PIXIA-VERIFY 2026 — Email Safe HTML
// Compatible tous clients email (Gmail, Outlook, etc.)
// Tables HTML pures, dimensions figées, pas de JS
// ============================================

type MessageStyle = 'collaborative_trust' | 'ultra_secure_2026' | 'classic_refinement';

export function buildSecureEmailHtml(params: {
  code: string;
  companyName?: string;
  companySlogan?: string;
  documentLabel?: string;
  validityMinutes?: number;
  messageStyle?: MessageStyle;
  lang?: string;
}) {
  const {
    code,
    companyName = 'PIXIATECH',
    companySlogan = 'TECHNOLOGY PRO',
    documentLabel = 'estimation du projet',
    validityMinutes = 10,
    messageStyle = 'collaborative_trust',
    lang,
  } = params;

  const getSecurityMsg = () => {
    switch (messageStyle) {
      case 'collaborative_trust':
        return {
          label: lang === 'en' ? 'COLLABORATIVE COMMITMENT' : 'ENGAGEMENT COLLABORATIF',
          text: lang === 'en'
            ? 'The absolute protection of your data and your estimate involves both our advisors and your own vigilance. In accordance with our protocols, no member or employee of the company is authorized to solicit you for this code. It remains strictly encrypted for your sole use.'
            : "La protection absolue de vos données et de votre estimation implique autant nos conseillers que votre propre vigilance. Conformément à nos protocoles, aucun membre ni collaborateur de l'entreprise n'est autorisé à vous solliciter pour obtenir ce code. Il reste strictement crypté à votre unique usage.",
        };
      case 'ultra_secure_2026':
        return {
          label: lang === 'en' ? 'ELECTRONIC SIGNATURE' : 'SIGNATURE ÉLECTRONIQUE',
          text: lang === 'en'
            ? 'This secret code serves as a digital certificate to sign your document. To prevent identity theft, never disclose it. No Pixiatech employee is authorized to ask you for it, whether by call, SMS, or email.'
            : "Ce code secret sert de certificat numérique pour signer votre document. Pour prévenir toute usurpation d'identité, veillez à ne jamais le divulguer. Aucun collaborateur de Pixiatech n'est habilité à vous le demander, que ce soit par appel, SMS ou e-mail.",
        };
      case 'classic_refinement':
        return {
          label: lang === 'en' ? 'CHECKPOINT' : 'POINT DE CONTRÔLE',
          text: lang === 'en'
            ? 'This temporary validation code is strictly private. It is used for immediate compliance verification. Our network governance rules formally prohibit sharing it with any third party or advisor.'
            : "Ce code de validation temporaire est strictement privé. Il sert à la vérification de conformité immédiate. Les règles de gouvernance de notre réseau interdisent formellement son partage avec tout tiers ou conseiller.",
        };
    }
  };

  const sec = getSecurityMsg();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #f4f6fa; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .container-table { width: 100% !important; max-width: 480px !important; }
      .code-display { font-size: 26px !important; padding: 10px 18px !important; letter-spacing: 3px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f6fa; font-family: Arial, sans-serif;">
  <table width="100%" bgcolor="#f4f6fa" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; background-color: #f4f6fa; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table class="container-table" width="480" cellpadding="0" cellspacing="0" border="0" style="width: 480px; max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 35px 25px; text-align: center;">

          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <table bgcolor="#0a0f1b" align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0f1b; border-radius: 14px; padding: 12px 24px; margin: 0 auto; text-align: left;">
                <tr>
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" bgcolor="#0d1222" style="background-color: #0d1222; border: 1px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="color: #ffffff; font-size: 8px; font-weight: bold; font-family: sans-serif; line-height: 1.2; padding: 0;">
                          PIXIA<br/><span style="color: #6366f1; font-size: 5px;">TECH</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: middle; padding: 0;">
                    <span style="font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 2px; font-family: sans-serif; line-height: 1.1; display: block; margin: 0;">${companyName}</span>
                    <span style="font-size: 6px; font-weight: bold; color: #6366f1; font-family: monospace; letter-spacing: 2px; text-transform: uppercase; margin-top: 1px; line-height: 1; display: block; margin: 0;">${companySlogan}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 10px 0; font-family: Arial, sans-serif;">${lang === 'en' ? 'VALIDATION CODE' : 'CODE DE VALIDATION'}</h2>
              <p style="font-size: 11.5px; color: #475569; line-height: 1.6; max-width: 380px; margin: 0 auto; font-family: Arial, sans-serif;">
                ${lang === 'en' ? 'To securely finalize and sign your' : 'Pour finaliser et signer de fa\u00e7on s\u00e9curis\u00e9e votre'}
                <span style="font-weight: bold; color: #4f46e5;">${documentLabel}</span>,
                ${lang === 'en' ? 'please copy or note the temporary digital code below and enter it in the application validation field.' : 'veuillez copier ou noter le code num\u00e9rique temporaire ci-dessous et le saisir dans la zone de validation de l\'application.'}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <table bgcolor="#f8fafc" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center;">
                <tr>
                  <td align="center" style="padding-bottom: 8px; font-family: sans-serif; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">
                    ${lang === 'en' ? 'YOUR UNIQUE SECURITY CODE' : 'VOTRE CODE UNIQUE DE S\u00c9CURIT\u00c9'}
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <span class="code-display" style="font-family: Courier, monospace; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 4px; background-color: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 10px 24px; display: inline-block; text-align: center; mso-line-height-rule: exactly;">${code}</span>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 10px; font-family: Arial, sans-serif; font-size: 11px; color: #ef4444; line-height: 1.5; font-weight: bold;">
                    ⚠️ ${lang === 'en' ? 'This code is strictly valid for ' + validityMinutes + ' minutes.' : 'Ce code est valide pour une dur\u00e9e stricte de ' + validityMinutes + ' minutes.'}<br/>
                    <span style="font-weight: normal; color: #64748b;">
                      ${lang === 'en' ? 'After this time, the transaction will be cancelled and you will need to generate a new code.' : 'Apr\u00e8s ce d\u00e9lai, la transaction sera annul\u00e9e et vous devrez g\u00e9n\u00e9rer un nouveau code.'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding-bottom: 25px;">
              <table bgcolor="#f8fafc" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; padding: 16px; width: 100%;">
                <tr>
                  <td align="left" style="font-size: 10px; font-family: monospace; font-weight: bold; color: #4f46e5; text-transform: uppercase; padding-bottom: 6px; letter-spacing: 0.5px;">
                    🛡️ ${sec.label}
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-size: 11px; color: #334155; line-height: 1.6; text-align: left; font-family: Arial, sans-serif; margin: 0;">
                    ${sec.text}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="32" style="vertical-align: middle; padding-right: 12px;">
                    <table cellpadding="0" cellspacing="0" border="0" bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="color: #4f46e5; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif; padding: 0;">✓</td>
                      </tr>
                    </table>
                  </td>
                  <td align="left" style="vertical-align: middle; padding: 0;">
                    <div style="font-size: 9px; color: #64748b; line-height: 1.2; font-family: Arial, sans-serif; margin: 0;">
                      ${lang === 'en' ? 'This code was generated for your absolute security.' : 'Ce code a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 pour votre s\u00e9curit\u00e9 absolue.'}
                    </div>
                    <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-top: 2px; font-family: Arial, sans-serif; margin: 0;">
                      ${lang === 'en' ? 'The Infrastructure Team \u2014 Global Security' : 'L\'\u00e9quipe Infrastructure \u2014 S\u00e9curit\u00e9 Globale'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 18px; font-size: 9.5px; color: #94a3b8; line-height: 1.6; font-family: Arial, sans-serif;">
              ${lang === 'en' ? 'This automatic message is encrypted. PandaDoc Secure Shield 2026.' : 'Ce mail automatique est crypt\u00e9. PandaDoc Secure Shield 2026.'}<br />
              &copy; 2026 ${companyName} Europe. <a href="mailto:support@pixiatech.com" target="_blank" style="color: #4f46e5; text-decoration: underline;">${lang === 'en' ? 'Contact support' : 'Contacter le support'}</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildSupplierEmailHtml(supplierEmail: string, quoteNumber: string, clientName: string, message?: string, lang?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.pixiatech.com';
  const dashboardUrl = `${baseUrl}/admin/quote-requests?tab=Fournisseur`;

  const body = `
    ${browserBar('PixiaTech Pro')}
    <div style="padding: 40px 30px;">
      ${logoSection()}
      <h3 style="margin: 0 0 16px 0; font-family: sans-serif; font-size: 14px; font-weight: 900; color: #111827; letter-spacing: 1px; text-transform: uppercase; text-align: center;">
        ${lang === 'en' ? 'New Estimate Transmitted' : 'Nouvelle Estimation Transmise'}
      </h3>
      <p style="font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.6;">
        ${lang === 'en' ? 'Hello,' : 'Bonjour,'}
      </p>
      <p style="font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.6;">
        ${lang === 'en'
          ? `A new estimate request (<b>N°${quoteNumber}</b>) for client <b>${clientName}</b> has been transmitted to you.`
          : `Une nouvelle demande d'estimation (<b>N°${quoteNumber}</b>) pour le client <b>${clientName}</b> vous a été transmise.`}
      </p>
      ${message ? `<div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0c0d12; border-radius: 8px; margin: 20px 0; font-family: sans-serif; font-size: 12px; color: #4b5563;">${message}</div>` : ''}
      <p style="font-family: sans-serif; font-size: 12px; color: #4b5563; line-height: 1.6;">
        ${lang === 'en' ? 'Please log in to your dashboard to process this request.' : 'Veuillez vous connecter à votre tableau de bord pour traiter cette demande.'}
      </p>
      <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #0c0d12; color: #ffffff; padding: 14px 34px; font-family: sans-serif; font-weight: bold; border-radius: 9999px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${lang === 'en' ? 'Access dashboard' : 'Accéder au tableau de bord'}
        </a>
      </div>
    </div>
    ${footer(lang)}`;

  return wrapper(body);
}
