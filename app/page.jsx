import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cookieName, verifySession } from '../lib/session';
import Login from './login/page';
export const dynamic='force-dynamic';
export default async function Home(){const token=(await cookies()).get(cookieName)?.value;if(verifySession(token))redirect('/dashboard');return <Login/>}
