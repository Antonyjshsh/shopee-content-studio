import {NextResponse} from 'next/server';
import {del} from '@vercel/blob';
import {studioAuthorized} from '../../../../lib/studio-auth';
export async function POST(req){
 if(!await studioAuthorized())return NextResponse.json({error:'Não autorizado'},{status:401});
 const {ids}=await req.json();if(!Array.isArray(ids)||ids.length>100||!ids.every(id=>typeof id==='string'&&/^videos\/[\w./-]+\.mp4$/.test(id)&&!id.includes('..')))return NextResponse.json({error:'Seleção inválida'},{status:400});
 await del(ids);return NextResponse.json({ok:true});
}
