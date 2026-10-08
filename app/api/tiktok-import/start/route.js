import {NextResponse} from 'next/server';
import {cookies,headers} from 'next/headers';
import {cookieName,verifySession} from '../../../../lib/session';
export const runtime='nodejs';
const repo='Antonyjshsh/shopee-content-studio';
export async function POST(request){
 const token=(await cookies()).get(cookieName)?.value;
 if(!verifySession(token))return NextResponse.json({error:'Sessão expirada.'},{status:401});
 const origin=(await headers()).get('origin');const url=new URL(request.url);
 if(origin&&new URL(origin).host!==url.host)return NextResponse.json({error:'Origem inválida.'},{status:403});
 const secret=process.env.GITHUB_ACTIONS_TOKEN;
 if(!secret)return NextResponse.json({error:'Falta configurar GITHUB_ACTIONS_TOKEN na Vercel. Este token deve ter permissão Actions: write no repositório.'},{status:503});
 let body;try{body=await request.json()}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400})}
 const profile=String(body.profile||'').trim();
 const match=profile.match(/^https:\/\/(?:www\.|m\.)?tiktok\.com\/@([A-Za-z0-9._]{1,40})\/?(?:\?.*)?$/i);
 const count=Number(body.count);
 if(!match||!Number.isInteger(count)||count<1||count>100)return NextResponse.json({error:'Informe um perfil TikTok válido e de 1 a 100 vídeos.'},{status:400});
 const response=await fetch('https://api.github.com/repos/'+repo+'/actions/workflows/import-tiktok-batch.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+secret,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'main',inputs:{perfil:match[1],quantidade:String(count)}}),cache:'no-store'});
 if(!response.ok){return NextResponse.json({error:'O GitHub não aceitou o início do lote. Verifique as permissões do token. Código: '+response.status},{status:502})}
 return NextResponse.json({ok:true,message:'Importação solicitada ao GitHub. O processamento poderá levar alguns minutos.'},{headers:{'Cache-Control':'no-store'}});
}
