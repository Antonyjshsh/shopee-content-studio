import { NextResponse } from 'next/server';
import { cookieName, cookieOptions } from '../../../lib/session';
export async function POST(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({error:'Origem inválida.'},{status:403});
  const response=NextResponse.redirect(new URL('/',request.url),303);
  response.cookies.set(cookieName,'',{...cookieOptions,maxAge:0});
  response.headers.set('Cache-Control','no-store');
  return response;
}
