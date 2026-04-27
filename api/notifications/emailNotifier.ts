import type { Notifier, NotificationMessage } from './types';
import { formatPlainText, requireEnv } from './utils';

export interface EmailNotifierSmtpAuth {
  user: string;
  pass: string;
}

export interface EmailNotifierOptions {
  host: string;
  port: number;
  secure: boolean;
  auth?: EmailNotifierSmtpAuth;
  from: string;
  to: string[];
}

export class EmailNotifier implements Notifier {
  private readonly options: EmailNotifierOptions;

  constructor(options: EmailNotifierOptions) {
    this.options = options;
  }

  static fromEnv(prefix = 'EMAIL_'): EmailNotifier {
    const host = requireEnv(`${prefix}SMTP_HOST`);
    const port = Number(process.env[`${prefix}SMTP_PORT`] ?? '587');
    const secureRaw = process.env[`${prefix}SMTP_SECURE`];
    const secure = secureRaw ? secureRaw === 'true' || secureRaw === '1' : false;

    const user = process.env[`${prefix}SMTP_USER`];
    const pass = process.env[`${prefix}SMTP_PASS`];
    const auth = user && pass ? { user, pass } : undefined;

    const from = requireEnv(`${prefix}FROM`);
    const toRaw = requireEnv(`${prefix}TO`);
    const to = toRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid SMTP port: ${process.env[`${prefix}SMTP_PORT`]}`);
    }

    if (to.length === 0) {
      throw new Error(`Missing recipients in ${prefix}TO`);
    }

    return new EmailNotifier({
      host,
      port,
      secure,
      auth,
      from,
      to,
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    // Loaded at runtime so TypeScript compilation doesn't require the dependency
    // to be present in node_modules. If it's missing at runtime, we throw a clear error.
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodemailer = require('nodemailer');
    } catch (error) {
      throw new Error(
        `EmailNotifier requires the \"nodemailer\" package at runtime. Install it with: npm install nodemailer. Root error: ${String(
          error
        )}`
      );
    }

    const subjectPrefix = message.level === 'error' ? '[ERROR]' : message.level === 'warn' ? '[WARN]' : '[INFO]';
    const subject = `${subjectPrefix} ${message.title ?? 'Notification'}`;

    const text = formatPlainText(message);

    const transporter = nodemailer.createTransport({
      host: this.options.host,
      port: this.options.port,
      secure: this.options.secure,
      auth: this.options.auth,
    });

    await transporter.sendMail({
      from: this.options.from,
      to: this.options.to.join(','),
      subject,
      text,
    });
  }
}
