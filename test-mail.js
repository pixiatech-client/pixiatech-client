const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const isSecure = smtpPort === 465;

console.log("SMTP Config:", { smtpHost, smtpUser, smtpPort, isSecure });

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: { user: smtpUser, pass: smtpPass },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const testEmail = process.argv[2] || smtpUser; // envoie à soi-même si pas de destinataire

transporter.sendMail({
  from: `"PixiaTech Test" <${smtpUser}>`,
  to: testEmail,
  subject: "🧪 Test OTP PixiaTech",
  html: `<div style="font-family:sans-serif;padding:20px;">
    <h2>Test de vérification OTP</h2>
    <p>Votre code est : <strong style="font-size:32px;letter-spacing:8px;color:#2563eb;">123456</strong></p>
    <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
  </div>`,
}, (error, info) => {
  if (error) {
    console.error("❌ Erreur envoi email:", error);
  } else {
    console.log("✅ Email envoyé avec succès! MessageId:", info.messageId);
    console.log("Response:", info.response);
  }
});
