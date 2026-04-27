import type { Notifier, NotificationMessage } from './types';
import { fetchWithTimeout, formatPlainText, requireEnv } from './utils';

export interface NtfyNotifierOptions {
  /** Example: https://ntfy.sh/your-topic OR your self-hosted topic URL */
  topicUrl: string;
  timeoutMs?: number;
}

export class NtfyNotifier implements Notifier {
  private readonly topicUrl: string;
  private readonly timeoutMs: number;

  constructor(options: NtfyNotifierOptions) {
    this.topicUrl = options.topicUrl;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  static fromEnv(envVarName = 'NTFY_TOPIC_URL'): NtfyNotifier {
    return new NtfyNotifier({
      topicUrl: requireEnv(envVarName),
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    const text = formatPlainText(message);

    const title = message.title ?? 'Notification';
    const priority = message.level === 'error' ? '5' : message.level === 'warn' ? '4' : '3';

    const response = await fetchWithTimeout(this.topicUrl, {
      method: 'POST',
      timeoutMs: this.timeoutMs,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        Title: title,
        Priority: priority,
      },
      body: text,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `NtfyNotifier failed: HTTP ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
      );
    }
  }
}
