import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const { password } = req.body || {};

  if (password === ADMIN_PASSWORD) {
    const payload = JSON.stringify({ ts: Date.now(), r: crypto.randomBytes(8).toString('hex') });
    const signature = crypto.createHmac('sha256', ADMIN_PASSWORD).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ p: payload, s: signature })).toString('base64');
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
}
