import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {cookieName,verifySession} from '../../lib/session';
import VideoLibrary from './VideoLibrary';
export const dynamic='force-dynamic';
export default async function VideosPage(){const token=(await cookies()).get(cookieName)?.value;if(!verifySession(token))redirect('/');return <main className="dash"><header><div className="brand"><img src="/logo-nfc-orange.png" alt="NFC Technology" className="brand-logo-img" width="112" height="76"/><div><strong>Shopee Content Studio</strong><small>by NFC Technology</small></div></div><a href="/dashboard" className="exit">Voltar ao painel ←</a></header><VideoLibrary/></main>}
