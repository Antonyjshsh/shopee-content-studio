import { createHmac, timingSafeEqual } from 'node:crypto';

export const cookieName = 'studio_session';
const lifetime = 60 * 60 * 24 * 7;

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must have at least 32 characters');
  return createHmac('sha256', secret).update(payload).digest('hex');
}
export function createSession() {
  const payload = String(Math.floor(Date.now() / 1000) + lifetime);
  return `${payload}.${sign(payload)}`;
}
export function verifySession(token) {
  try {
    if (!token) return false;
    const [expiry, signature, extra] = token.split('.');
    if (extra !== undefined || !/^\d+$/.test(expiry) || !/^[a-f0-9]{64}$/.test(signature)) return false;
    if (Number(expiry) <= Date.now() / 1000) return false;
    return timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(expiry),'hex'));
  } catch { return false; }
}
export function isCorrectPassword(value) {
  const expected = process.env.STUDIO_PASSWORD;
  if (!expected || expected.length < 12) return false;
  const a = createHmac('sha256','studio-password-check').update(value).digest();
  const b = createHmac('sha256','studio-password-check').update(expected).digest();
  return timingSafeEqual(a,b);
}
export const cookieOptions = { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:lifetime };
