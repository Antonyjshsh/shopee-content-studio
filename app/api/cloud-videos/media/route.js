import {NextResponse} from 'next/server';
import {get} from '@vercel/blob';
import {studioAuthorized} from '../../../../lib/studio-auth';
export const runtime='nodejs';
export async function GET(req){
 if(!await studioAuthorized())return new NextResponse('Não autorizado',{status:401});
 const pathname=new URL(req.url).searchParams.get('pathname');
 if(!pathname||!/^videos\/[\w./-]+\.mp4$/.test(pathname)||pathname.includes('..'))return new NextResponse('Arquivo inválido',{status:400});
 const result=await get(pathname,{access:'private'});
 if(!result||result.statusCode!==200)return new NextResponse('Não encontrado',{status:404});
 return new NextResponse(result.stream,{headers:{'Content-Type':'video/mp4','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'none'}})
}
