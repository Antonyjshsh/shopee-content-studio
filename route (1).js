import { NextResponse } from 'next/server';
import { createSession, cookieName, cookieOptions, isCorrectPassword } from '../../../lib/session';
export const runtime = 'nodejs';
export async function POST(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) return NextResponse.json({error:'Formato inválido.'},{status:415});
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Dados inválidos.'},{status:400}); }
  if (typeof body.password !== 'string' || body.password.length > 512 || !isCorrectPassword(body.password)) {
    return NextResponse.json({error:'Senha inválida.'},{status:401,headers:{'Cache-Control':'no-store'}});
  }
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(cookieName,createSession(),cookieOptions);
  return response;
}
