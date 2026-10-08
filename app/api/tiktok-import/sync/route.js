import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {unzipSync} from 'fflate';
import {put,list} from '@vercel/blob';
import {cookieName,verifySession} from '../../../../lib/session';
export const runtime='nodejs';
export const maxDuration=60;
const repository='Antonyjshsh/shopee-content-studio';
const githubHeaders=()=>({Authorization:'Bearer '+process.env.GITHUB_ACTIONS_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
export async function POST(request){
 const authorized=verifySession((await cookies()).get(cookieName)?.value);
 if(!authorized)return NextResponse.json({error:'Sessão expirada.'},{status:401});
 if(!process.env.GITHUB_ACTIONS_TOKEN||!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:'Integração de armazenamento incompleta.'},{status:503});
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==new URL(request.url).host)return NextResponse.json({error:'Origem não permitida.'},{status:403});
 let id;try{id=Number((await request.json()).runId)}catch{return NextResponse.json({error:'Execução inválida.'},{status:400})}
 if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'ID inválido.'},{status:400});
 try{
  const runRes=await fetch('https://api.github.com/repos/'+repository+'/actions/runs/'+id,{headers:githubHeaders(),cache:'no-store'});
  if(!runRes.ok)return NextResponse.json({error:'Execução não encontrada.'},{status:404});
  const run=await runRes.json();
  if(run.name!=='Importar lote TikTok autorizado'||run.status!=='completed'||run.conclusion!=='success')return NextResponse.json({error:'A importação ainda não terminou com sucesso.'},{status:409});
  const artifactsRes=await fetch('https://api.github.com/repos/'+repository+'/actions/runs/'+id+'/artifacts',{headers:githubHeaders(),cache:'no-store'});
  if(!artifactsRes.ok)throw Error('Falha ao localizar o pacote do GitHub.');
  const artifacts=await artifactsRes.json();
  const artifact=(artifacts.artifacts||[]).find(a=>a.name==='videos-tiktok-autorizados'&&!a.expired);
  if(!artifact)return NextResponse.json({error:'O pacote expirou ou não existe. Inicie um novo lote.'},{status:410});
  if(artifact.size_in_bytes>25*1024*1024)return NextResponse.json({error:'Este lote ultrapassa 25 MB. Precisamos dividir em lotes menores para sincronizar na Vercel.'},{status:413});
  const zipResponse=await fetch('https://api.github.com/repos/'+repository+'/actions/artifacts/'+artifact.id+'/zip',{headers:githubHeaders(),cache:'no-store'});
  if(!zipResponse.ok)throw Error('Não foi possível baixar o pacote para o servidor.');
  const bytes=new Uint8Array(await zipResponse.arrayBuffer());
  if(bytes.byteLength>28*1024*1024)throw Error('Pacote maior que o limite seguro.');
  const entries=unzipSync(bytes);
  const uploaded=[],skipped=[];
  const existing=await list({prefix:'videos/tiktok-',limit:1000});
  const names=new Set(existing.blobs.map(b=>b.pathname));
  for(const [name,data] of Object.entries(entries)){
   const file=name.split('/').pop();
   if(!/^\d{15,22}\.mp4$/i.test(file)||data.length===0)continue;
   if(data.length>20*1024*1024){skipped.push(file+': tamanho excedido');continue}
   const dest='videos/tiktok-'+file;
   if(names.has(dest)){skipped.push(file+': já existe');continue}
   await put(dest,Buffer.from(data),{access:'private',contentType:'video/mp4',addRandomSuffix:false,allowOverwrite:false});
   names.add(dest);uploaded.push(file);
  }
  return NextResponse.json({ok:true,uploaded,skipped,message:uploaded.length+' vídeo(s) armazenado(s) na nuvem.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e.message||'Falha ao sincronizar vídeo.'},{status:502})}
}
