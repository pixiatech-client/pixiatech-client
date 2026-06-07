import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send the real SMTP mail
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, code, companyName, clientName, totalAmount, details } = req.body;

    if (!to) {
      return res.status(400).json({ error: "L'adresse e-mail du destinataire est requise." });
    }

    // SMTP environment variable detection
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const portStr = process.env.SMTP_PORT || process.env.MAIL_PORT;
    const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.MAIL_USERNAME;
    const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.MAIL_PASSWORD;
    const from = process.env.SMTP_FROM || process.env.MAIL_FROM || "PixiaTech Pro <noreply@pixiatech.com>";

    console.log(`[SMTP] Tentative d'envoi d'e-mail à ${to}`);
    console.log(`[SMTP] Configuration détectée : Host=${host}, Port=${portStr}, User=${user ? "Défini" : "Non défini"}`);

    if (!host || !user || !pass) {
      console.warn("[SMTP] Variables de configuration SMTP manquantes dans l'environnement. Envoi simulé réussi.");
      return res.json({ 
        success: true, 
        simulated: true, 
        message: "SMTP non configuré dans l'environnement. Le code simulation est : " + code 
      });
    }

    const port = portStr ? parseInt(portStr, 10) : 587;

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for port 465, false for other ports
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false // avoids SSL handshake issues with some custom certificate hosts
        }
      });

      // Verify connection configuration
      await transporter.verify();

      // HTML body formatted of extreme beauty
      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">PIXIATECH PRO</h1>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Espace de Validation Sécurisé</p>
          </div>
          
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #334155;">
              Bonjour ${clientName || "Collaborateur PixiaTech"},
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Un code de sécurité temporaire à 6 chiffres a été généré pour valider le contrat d'estimation pour l'entreprise <strong>${companyName || "Pixia Tech Europe"}</strong>.
            </p>
            
            <!-- Code Showcase box -->
            <div style="background-color: #f8fafc; border: 2px dashed #bfdbfe; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; display: block; margin-bottom: 10px; font-weight: bold;">Votre code à usage unique</span>
              <div style="letter-spacing: 10px; font-size: 36px; font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #2563eb; display: inline-block; margin-left: 10px;">
                ${code}
              </div>
            </div>

            <!-- Recap brief -->
            ${totalAmount ? `
            <div style="background-color: #eff6ff; border-radius: 12px; padding: 15px 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 14px; text-transform: uppercase;">Détails de l'estimation</h3>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #475569;">Total Estimé :</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #1e3a8a;">${totalAmount} € TTC</td>
                </tr>
                ${details ? `
                <tr>
                  <td style="padding: 5px 0; color: #475569;">Configuration :</td>
                  <td style="padding: 5px 0; text-align: right; color: #475569;">${details}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            ` : ""}

            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                <strong>🚨 Sécurité :</strong> Ce code est strictement confidentiel. Ne le communiquez à personne, y compris à un membre de l'équipe PixiaTech. Il expirera dans 10 minutes.
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0 0 5px 0;">Ce message a été envoyé automatiquement de manière sécurisée par PixiaTech Pro.</p>
            <p style="margin: 0;">© 2026 PixiaTech Europe. Tous droits réservés.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from,
        to,
        subject: subject || "🔑 Votre code de vérification PixiaTech",
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] E-mail envoyé avec succès ! ID: ${info.messageId}`);
      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("[SMTP] Erreur lors de l'envoi de l'e-mail SMTP :", error);
      return res.status(500).json({ 
        error: "Erreur d'envoi SMTP : " + (error.message || error),
        fallbackCode: code
      });
    }
  });

  // Serve Vite assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
