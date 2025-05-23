import { NowRequest, NowResponse } from '@vercel/node';
import { registrarPonto } from './ponto';

function getLatitude(username: string){
    const lat = process.env[`${username}_LATITUDE`] || process.env[`${username.replaceAll('.', '_')}_LATITUDE`] || process.env.LATITUDE;
    return lat || undefined;
}

function getLongitude(username: string){
    const long = process.env[`${username}_LONGITUDE`] || process.env[`${username.replaceAll('.', '_')}_LONGITUDE`] || process.env.LONGITUDE;
    return long || undefined;
}

export default async function handler(req: NowRequest, res: NowResponse) {
  const { username, url, latitude, longitude } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username is required' });
  }

  const result = await registrarPonto(
    username,
    // get url or get from env
    url || process.env.URL,
    latitude || getLatitude(username) || "-15.7417317027277",
    longitude || getLongitude(username) || "-47.914133845299254",
  );

  return res.status(result.error ? 500 : 200).json(result);
}