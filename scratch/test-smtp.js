
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully!');
    
    const info = await transporter.sendMail({
      from: `"Test Pixia" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'Test SMTP PixiaTech',
      text: 'Ceci est un test de connexion SMTP.',
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('SMTP Error:', error);
  }
}

testEmail();
