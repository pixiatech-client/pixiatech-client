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
  theme?: string;
  lang?: string;
}) {
  const {
    code,
    companyName = 'PIXIATECH',
    companySlogan = 'TECHNOLOGY PRO',
    documentLabel = 'estimation du projet',
    validityMinutes = 10,
    messageStyle = 'collaborative_trust',
    theme = 'light_premium',
    lang,
  } = params;

  const isDark = theme === 'dark_luxury';
  const isGlass = theme === 'glass_frosted';
  const isAdaptive = theme === 'auto_adaptive';

  const bgColor = isDark ? '#0b1120' : '#f4f6fa';
  const cardBg = isDark ? '#131c31' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#cbd5e1';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const accentColor = isDark ? '#818cf8' : '#4f46e5';
  const codeBg = isDark ? '#0f1a2e' : '#f8fafc';
  const codeBorder = isDark ? '#334155' : '#cbd5e1';
  const sectionBg = isDark ? '#0f1a2e' : '#f8fafc';
  const sectionBorder = isDark ? '#1e293b' : '#cbd5e1';
  const logoBg = isDark ? '#0f1a2e' : '#0a0f1b';
  const logoBorder = accentColor;

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

  const darkModeStyles = isAdaptive ? `
  @media (prefers-color-scheme: dark) {
    .email-body { background-color:#0b1120 !important; }
    .email-bg { background-color:#0b1120 !important; }
    .email-card { background-color:#131c31 !important; border-color:#1e293b !important; }
    .email-text-primary { color:#f1f5f9 !important; }
    .email-text-secondary { color:#94a3b8 !important; }
    .email-text-muted { color:#64748b !important; }
    .email-code-box { background-color:#0f1a2e !important; border-color:#334155 !important; }
    .email-code-cell { border-color:#334155 !important; background-color:#0f1a2e !important; color:#f1f5f9 !important; }
    .email-section { background-color:#0f1a2e !important; border-color:#1e293b !important; }
    .email-divider { border-top-color:#1e293b !important; }
    .email-footer { border-top-color:#1e293b !important; }
    .email-icon-bg { background-color:#1e1b4b !important; }
    .email-sec { color:#818cf8 !important; }
  }` : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; background-color: ${bgColor}; font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    img { border: 0; height: auto; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .container-table { width: 100% !important; max-width: 480px !important; }
      .code-cell { font-size: 26px !important; letter-spacing: 3px !important; padding: 8px 16px !important; }
      .code-label { font-size: 9px !important; }
    }
    ${isGlass ? `.email-card { background: rgba(255,255,255,0.7) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }
    ${isDark ? `.email-card { background: rgba(19,28,49,0.85) !important; }` : ''}` : ''}
    ${darkModeStyles}
  </style>
  <!--[if mso]>
  <style type="text/css">
    .outer-table { width: 480px !important; }
    .code-cell { border: 1px dashed ${codeBorder} !important; }
  </style>
  <![endif]-->
</head>
<body class="email-body" style="margin:0;padding:0;width:100%;background-color:${bgColor};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bgColor}" style="background-color:${bgColor};">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <!--[if mso]><table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
        <table class="outer-table container-table" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:480px;">
          <tr>
            <td class="email-card" style="background-color:${cardBg};border:1px solid ${cardBorder};border-radius:24px;padding:0;${isGlass ? `background:${isDark ? 'rgba(19,28,49,0.85)' : 'rgba(255,255,255,0.7)'};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);` : ''}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

          <tr>
            <td align="center" style="padding:30px 25px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="${logoBg}" style="background-color:${logoBg};border-radius:14px;">
                <tr>
                  <td style="padding:12px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="36" valign="middle" style="width:36px;padding-right:12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="${isDark ? '#0f1a2e' : '#0d1222'}" style="background-color:${isDark ? '#0f1a2e' : '#0d1222'};border:1px solid ${accentColor};border-radius:50%;width:28px;height:28px;">
                            <tr>
                              <td align="center" valign="middle" style="color:#ffffff;font-size:7px;font-weight:bold;font-family:Arial,sans-serif;line-height:1.1;">
                                PIXIA<br/><span style="color:${accentColor};font-size:5px;font-weight:bold;">TECH</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="font-family:Arial,sans-serif;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-size:13px;font-weight:900;color:#ffffff;letter-spacing:2px;font-family:Arial,sans-serif;line-height:1.2;">${companyName}</td>
                            </tr>
                            <tr>
                              <td style="font-size:7px;font-weight:bold;color:${accentColor};font-family:monospace;letter-spacing:2px;text-transform:uppercase;line-height:1.2;padding-top:1px;">${companySlogan}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 25px 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="email-text-primary" align="center" style="font-size:18px;font-weight:800;color:${textPrimary};letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;padding-bottom:10px;">
                    ${lang === 'en' ? 'VALIDATION CODE' : 'CODE DE VALIDATION'}
                  </td>
                </tr>
                <tr>
                  <td class="email-text-secondary" align="center" style="font-size:11.5px;color:${textSecondary};line-height:1.6;font-family:Arial,sans-serif;">
                    ${lang === 'en' ? 'To securely finalize and sign your' : 'Pour finaliser et signer de fa\u00e7on s\u00e9curis\u00e9e votre'}
                    <strong style="color:${accentColor};">${documentLabel}</strong>,
                    ${lang === 'en' ? 'please copy or note the temporary digital code below and enter it in the application validation field.' : 'veuillez copier ou noter le code num\u00e9rique temporaire ci-dessous et le saisir dans la zone de validation de l\'application.'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 25px 25px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-code-box" style="background-color:${codeBg};border:1px solid ${codeBorder};border-radius:20px;padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" class="code-label" style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;color:${textMuted};letter-spacing:2px;text-transform:uppercase;padding:24px 24px 8px;">
                          ${lang === 'en' ? 'YOUR UNIQUE SECURITY CODE' : 'VOTRE CODE UNIQUE DE S\u00c9CURIT\u00c9'}
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding:8px 24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td class="code-cell email-code-cell" align="center" style="border:1px dashed ${codeBorder};border-radius:12px;background-color:${isDark ? '#0f1a2e' : '#ffffff'};padding:10px 24px;font-family:Courier,monospace;font-size:32px;font-weight:bold;color:${textPrimary};letter-spacing:4px;mso-line-height-rule:exactly;line-height:1.3;">
                                ${code}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Arial,sans-serif;font-size:11px;color:#ef4444;line-height:1.5;font-weight:bold;padding:8px 24px 24px;">
                          ⚠️ ${lang === 'en' ? 'This code is strictly valid for ' + validityMinutes + ' minutes.' : 'Ce code est valide pour une dur\u00e9e stricte de ' + validityMinutes + ' minutes.'}<br/>
                          <span class="email-text-muted" style="font-weight:normal;color:${textMuted};">
                            ${lang === 'en' ? 'After this time, the transaction will be cancelled and you will need to generate a new code.' : 'Apr\u00e8s ce d\u00e9lai, la transaction sera annul\u00e9e et vous devrez g\u00e9n\u00e9rer un nouveau code.'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 25px 25px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-section" style="background-color:${sectionBg};border:1px solid ${sectionBorder};border-radius:14px;padding:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="email-sec" style="font-size:10px;font-weight:bold;color:${accentColor};text-transform:uppercase;font-family:Arial,sans-serif;letter-spacing:0.5px;padding-bottom:8px;">
                          🛡️ ${sec.label}
                        </td>
                      </tr>
                      <tr>
                        <td class="email-text-secondary" style="font-size:11px;color:${isDark ? '#cbd5e1' : '#334155'};line-height:1.6;font-family:Arial,sans-serif;">
                          ${sec.text}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 25px 25px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-section" style="background-color:${sectionBg};border:1px solid ${sectionBorder};border-radius:14px;padding:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="36" valign="middle" style="width:36px;padding-right:12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-icon-bg" bgcolor="${isDark ? '#1e1b4b' : '#e0e7ff'}" style="background-color:${isDark ? '#1e1b4b' : '#e0e7ff'};border-radius:50%;width:28px;height:28px;">
                            <tr>
                              <td align="center" valign="middle" style="color:${accentColor};font-size:13px;font-weight:bold;font-family:Arial,sans-serif;padding:0;line-height:28px;">✓</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="font-family:Arial,sans-serif;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td class="email-text-muted" style="font-size:9px;color:${textMuted};line-height:1.2;font-family:Arial,sans-serif;">
                                ${lang === 'en' ? 'This code was generated for your absolute security.' : 'Ce code a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 pour votre s\u00e9curit\u00e9 absolue.'}
                              </td>
                            </tr>
                            <tr>
                              <td class="email-text-primary" style="font-size:11px;font-weight:bold;color:${textPrimary};padding-top:2px;font-family:Arial,sans-serif;">
                                ${lang === 'en' ? 'The Infrastructure Team \u2014 Global Security' : 'L\'\u00e9quipe Infrastructure \u2014 S\u00e9curit\u00e9 Globale'}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="email-footer" align="center" style="font-family:Arial,sans-serif;font-size:9.5px;color:${textMuted};line-height:1.6;border-top:1px solid ${sectionBorder};padding:18px 25px 30px;">
              ${lang === 'en' ? 'This automatic message is encrypted. PandaDoc Secure Shield 2026.' : 'Ce mail automatique est crypt\u00e9. PandaDoc Secure Shield 2026.'}<br/>
              &copy; 2026 ${companyName} Europe. <a href="mailto:support@pixiatech.com" target="_blank" style="color:${accentColor};text-decoration:underline;font-weight:bold;">${lang === 'en' ? 'Contact support' : 'Contacter le support'}</a>
            </td>
          </tr>

              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
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
