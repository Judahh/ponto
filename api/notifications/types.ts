export type NotificationLevel = 'info' | 'warn' | 'error';

export interface NotificationMessage {
  title?: string;
  body: string;
  level?: NotificationLevel;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface Notifier {
  send(message: NotificationMessage): Promise<void>;
}
