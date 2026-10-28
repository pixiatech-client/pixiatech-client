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
    name: 'localhost',
    tls: {
      rejectUnauthorized: false,
      servername: config.host,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  } as any);
}
