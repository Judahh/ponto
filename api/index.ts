import { VercelRequest, VercelResponse } from '@vercel/node';
import { registerFingerprint } from './fingerprint';
import { booleanEnv, NotificationManager } from './notifications';

function getLatitude(username: string){
    const lat = process.env[`${username}_LATITUDE`] || process.env[`${username.replaceAll('.', '_')}_LATITUDE`] || process.env.LATITUDE;
    return lat as string || undefined;
}

function getLongitude(username: string){
    const long = process.env[`${username}_LONGITUDE`] || process.env[`${username.replaceAll('.', '_')}_LONGITUDE`] || process.env.LONGITUDE;
    return long as string || undefined;
}

function getPassword(username: string): string {
    const password = process.env[username] || process.env[username.replaceAll('.', '_')];
    return password || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username, url, latitude, longitude, password } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username is required' });
  }

  const result = await registerFingerprint(
    username,
    // get url or get from env
    (url || process.env.URL) as unknown as string,
    (latitude || getLatitude(username) || "-15.7417317027277") as unknown as string | undefined,
    (longitude || getLongitude(username) || "-47.914133845299254") as unknown as string | undefined,
    (password as string | undefined) || getPassword(username) as string | undefined
  );

  const isError = Boolean((result as any)?.error);
  const notifyOnSuccess = booleanEnv('NOTIFY_ON_SUCCESS', false);

  if (isError || notifyOnSuccess) {
    const manager = NotificationManager.fromEnv({ strict: false });

    if (manager.isEnabled()) {
      const title = isError ? `Ponto: ERRO (${username})` : `Ponto: OK (${username})`;
      const body =
        typeof (result as any)?.mensagem === 'string'
          ? ((result as any).mensagem as string)
          : JSON.stringify(result);

      try {
        await manager.send({
          level: isError ? 'error' : 'info',
          title,
          body,
          metadata: {
            username,
            hora: (result as any)?.hora,
          },
        });
      } catch (notifyError) {
        // Notification failures shouldn't break the main API behavior.
        console.log('Notification send failed:', notifyError);
      }
    }
  }

  return res.status(result.error ? 500 : 200).json(result);
}