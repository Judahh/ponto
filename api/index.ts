import { VercelRequest, VercelResponse } from '@vercel/node';
import { registrarPonto } from './ponto';

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

  const result = await registrarPonto(
    username,
    // get url or get from env
    (url || process.env.URL) as unknown as string,
    (latitude || getLatitude(username) || "-15.7417317027277") as unknown as string | undefined,
    (longitude || getLongitude(username) || "-47.914133845299254") as unknown as string | undefined,
    (password as string | undefined) || getPassword(username) as string | undefined
  );

  return res.status(result.error ? 500 : 200).json(result);
}