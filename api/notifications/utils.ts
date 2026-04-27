import type { NotificationLevel, NotificationMessage } from './types';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function booleanEnv(name: string, defaultValue = false): boolean {
  const raw = optionalEnv(name);
  if (!raw) return defaultValue;

  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;

  return defaultValue;
}

export function stringifyUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const stackPart = error.stack ? `\n${error.stack}` : '';
    return `${error.message}${stackPart}`;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function levelToEmoji(level: NotificationLevel | undefined): string {
  switch (level) {
    case 'error':
      return '🛑';
    case 'warn':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}

export function formatPlainText(message: NotificationMessage): string {
  const timestamp = message.timestamp ?? new Date();
  const emoji = levelToEmoji(message.level);
  const title = message.title ? `${message.title}` : 'Notification';

  let text = `${emoji} ${title}\n`;
  text += `Time: ${timestamp.toISOString()}\n`;
  text += `\n${message.body}`;

  if (message.metadata && Object.keys(message.metadata).length > 0) {
    text += `\n\nMetadata: ${safeJson(message.metadata)}`;
  }

  return text;
}

export function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10_000, ...rest } = init;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
