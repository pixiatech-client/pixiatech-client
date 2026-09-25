import nodemailer from 'nodemailer';
import type { SmtpConfig } from './types';

export function getTransporter(config: SmtpConfig) {
  if (!config.host || !config.user) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass || '',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
