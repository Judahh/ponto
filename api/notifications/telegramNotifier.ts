import type { Notifier, NotificationMessage } from './types';
import { fetchWithTimeout, formatPlainText, requireEnv } from './utils';

export interface TelegramNotifierOptions {
  botToken: string;
  chatId: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
  disableWebPagePreview?: boolean;
}

export class TelegramNotifier implements Notifier {
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly apiBaseUrl: string;
  private readonly timeoutMs: number;
  private readonly disableWebPagePreview: boolean;

  constructor(options: TelegramNotifierOptions) {
    this.botToken = options.botToken;
    this.chatId = options.chatId;
    this.apiBaseUrl = options.apiBaseUrl ?? 'https://api.telegram.org';
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.disableWebPagePreview = options.disableWebPagePreview ?? true;
  }

  static fromEnv(prefix = 'TELEGRAM_'): TelegramNotifier {
    return new TelegramNotifier({
      botToken: requireEnv(`${prefix}BOT_TOKEN`),
      chatId: requireEnv(`${prefix}CHAT_ID`),
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    const url = `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`;
    const text = formatPlainText(message);

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      timeoutMs: this.timeoutMs,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        disable_web_page_preview: this.disableWebPagePreview,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `TelegramNotifier failed: HTTP ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
      );
    }
  }
}
