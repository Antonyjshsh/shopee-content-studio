import {NextResponse} from 'next/server';
import {list,put} from '@vercel/blob';
import {studioAuthorized} from '../../../../lib/studio-auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await studioAuthorized())return NextResponse.json({error:'Não autorizado'},{status:401});
 try{let cursor,items=[];do{const page=await list({prefix:'videos/',cursor,limit:100});items.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined}while(cursor&&items.length<500);
 return NextResponse.json({videos:items.filter(x=>/\.mp4$/i.test(x.pathname)).map(x=>({id:x.pathname,name:x.pathname.split('/').pop(),size:x.size,added:x.uploadedAt,pathname:x.pathname}))},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return NextResponse.json({error:'Falha ao consultar arquivos privados na nuvem'},{status:500})}
}
export async function POST(req){
 if(!await studioAuthorized())return NextResponse.json({error:'Não autorizado'},{status:401});
 try{const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||!/^video\//.test(file.type))return NextResponse.json({error:'Envie um arquivo de vídeo.'},{status:400});
 if(file.size>4*1024*1024)return NextResponse.json({error:'Upload direto limitado a 4 MB nesta etapa. Vídeos maiores serão enviados pelo importador de servidor.'},{status:413});
 const name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-110);
 const blob=await put('videos/'+Date.now()+'-'+name,file,{access:'private',addRandomSuffix:true,contentType:file.type||'video/mp4'});
 return NextResponse.json({id:blob.pathname,name,size:file.size})
 }catch(e){return NextResponse.json({error:'Falha ao gravar vídeo na nuvem.'},{status:500})}
}
