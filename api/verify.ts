import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ valid: false });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const token = (req.query.token as string) || '';

  if (!token) {
    return res.json({ valid: false });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const expectedSig = crypto.createHmac('sha256', ADMIN_PASSWORD).update(decoded.p).digest('hex');
    if (decoded.s === expectedSig) {
      return res.json({ valid: true });
    }
  } catch {
    // Invalid token format
  }

  return res.json({ valid: false });
}
