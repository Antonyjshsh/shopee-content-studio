import {cookies} from 'next/headers';
import {cookieName,verifySession} from './session';
export async function studioAuthorized(){return verifySession((await cookies()).get(cookieName)?.value)}