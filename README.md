# fingerprint

## Notifications

The API can send smartphone notifications on errors (always) and optionally on success.

### Toggle

- `NOTIFY_ON_SUCCESS=true` to also notify when it succeeds (default: false).

### Providers (auto-enabled when env vars are present)

**Telegram**

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

**ntfy**

- `NTFY_TOPIC_URL` (example: `https://ntfy.sh/your-topic`)

**Email (SMTP)**

- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT` (default: `587`)
- `EMAIL_SMTP_SECURE` (`true` for port 465)
- `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASS` (optional)
- `EMAIL_FROM`
- `EMAIL_TO` (comma-separated)