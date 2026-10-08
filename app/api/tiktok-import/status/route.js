import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {cookieName,verifySession} from '../../../../lib/session';
export const runtime='nodejs';
const repo='Antonyjshsh/shopee-content-studio';
export async function GET(){
 const cookie=(await cookies()).get(cookieName)?.value;if(!verifySession(cookie))return NextResponse.json({error:'Sessão expirada.'},{status:401});
 const auth=process.env.GITHUB_ACTIONS_TOKEN;
 if(!auth)return NextResponse.json({error:'A integração GitHub Actions ainda não está configurada.'},{status:503});
 const response=await fetch('https://api.github.com/repos/'+repo+'/actions/workflows/import-tiktok-batch.yml/runs?per_page=8',{headers:{Authorization:'Bearer '+auth,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store'});
 if(!response.ok)return NextResponse.json({error:'Erro ao consultar execução do GitHub.'},{status:502});
 const data=await response.json();
 const runs=(data.workflow_runs||[]).map(r=>({id:r.id,status:r.status,conclusion:r.conclusion,created:r.created_at,url:r.html_url}));
 return NextResponse.json({runs},{headers:{'Cache-Control':'no-store'}});
}
