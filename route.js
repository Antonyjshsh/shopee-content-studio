import { NextResponse } from 'next/server';
import { cookieName, cookieOptions } from '../../../lib/session';
export async function POST(request) {
  const response=NextResponse.redirect(new URL('/',request.url),303);
  response.cookies.set(cookieName,'',{...cookieOptions,maxAge:0});
  return response;
}
