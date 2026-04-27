import type { Notifier, NotificationMessage } from './types';
import { optionalEnv } from './utils';
import { EmailNotifier } from './emailNotifier';
import { NtfyNotifier } from './ntfyNotifier';
import { TelegramNotifier } from './telegramNotifier';

export interface NotificationManagerOptions {
  strict?: boolean;
}

export class NotificationManager {
  private readonly notifiers: Notifier[];

  constructor(notifiers: Notifier[]) {
    this.notifiers = notifiers;
  }

  static fromEnv(options: NotificationManagerOptions = {}): NotificationManager {
    const notifiers: Notifier[] = [];
    const strict = options.strict ?? false;

    const tryAdd = (factory: () => Notifier) => {
      try {
        notifiers.push(factory());
      } catch (error) {
        if (strict) throw error;
      }
    };

    // Telegram
    if (optionalEnv('TELEGRAM_BOT_TOKEN') && optionalEnv('TELEGRAM_CHAT_ID')) {
      tryAdd(() => TelegramNotifier.fromEnv('TELEGRAM_'));
    }

    // ntfy
    if (optionalEnv('NTFY_TOPIC_URL')) {
      tryAdd(() => NtfyNotifier.fromEnv('NTFY_TOPIC_URL'));
    }

    // Email
    if (optionalEnv('EMAIL_SMTP_HOST') && optionalEnv('EMAIL_FROM') && optionalEnv('EMAIL_TO')) {
      tryAdd(() => EmailNotifier.fromEnv('EMAIL_'));
    }

    return new NotificationManager(notifiers);
  }

  isEnabled(): boolean {
    return this.notifiers.length > 0;
  }

  async send(message: NotificationMessage): Promise<void> {
    await Promise.all(this.notifiers.map((n) => n.send(message)));
  }
}
