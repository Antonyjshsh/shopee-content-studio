'use client';
import {useCallback,useEffect,useState} from 'react';
const STORAGE='studio-pending-tiktok-import-v2';
const DEFAULT='https://www.tiktok.com/@vdeos.prontos.ia';
export default function TikTokImportPanel(){
 const [profile,setProfile]=useState(DEFAULT),[count,setCount]=useState(3),[pending,setPending]=useState(null),[state,setState]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState([]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem(STORAGE)||'null');if(p&&p.since)setPending(p)}catch{}},[]);
 const check=useCallback(async()=>{
  try{
   const res=await fetch('/api/tiktok-import/status',{cache:'no-store'});const data=await res.json();
   if(!res.ok)throw Error(data.error||'Erro ao consultar importações');
   setHistory(data.runs||[]);
   if(!pending)return;
   const matches=(data.runs||[]).filter(r=>new Date(r.created).getTime()>=pending.since-120000);
   const run=matches.find(r=>r.id===pending.id)||matches[0];
   if(!run){setState('Aguardando início do processamento no GitHub...');return}
   if(pending.id!==run.id){const changed={...pending,id:run.id};setPending(changed);localStorage.setItem(STORAGE,JSON.stringify(changed))}
   if(run.status!=='completed'){setState('Importando vídeos no servidor. Aguarde...');return}
   if(run.conclusion!=='success'){
    setMessage('A importação falhou. A consulta ao perfil pode ter sido bloqueada pelo TikTok. Veja os detalhes da execução para diagnóstico.');
    setState('Falha no processamento');setPending(null);localStorage.removeItem(STORAGE);return
   }
   if(pending.syncing)return;
   const changed={...pending,id:run.id,syncing:true};setPending(changed);localStorage.setItem(STORAGE,JSON.stringify(changed));
   setState('Transferindo MP4 diretamente para a biblioteca na nuvem...');
   const uploaded=await fetch('/api/tiktok-import/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:run.id})});
   const result=await uploaded.json();
   if(!uploaded.ok)throw Error(result.error||'Erro ao transferir');
   setMessage(result.message+(result.skipped?.length?' Ignorados: '+result.skipped.length+'.':''));
   setState('Importação finalizada');setPending(null);localStorage.removeItem(STORAGE);
   window.dispatchEvent(new Event('studio:cloud-updated'));
  }catch(e){setMessage(e.message||'Falha na sincronização');setState('Atenção: verifique a importação');setPending(p=>{if(!p)return p;const changed={...p,syncing:false};localStorage.setItem(STORAGE,JSON.stringify(changed));return changed})}
 },[pending]);
 useEffect(()=>{check();const t=setInterval(check,12000);return()=>clearInterval(t)},[check]);
 async function start(){
  if(!/^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.-]+\/?(?:\?.*)?$/i.test(profile.trim())){setMessage('Cole um link válido de perfil TikTok.');return}
  if(!Number.isInteger(count)||count<1||count>100){setMessage('Selecione de 1 a 100 vídeos.');return}
  if(pending){setMessage('Já existe uma importação em andamento.');return}
  setBusy(true);setMessage('');
  try{const since=Date.now();const res=await fetch('/api/tiktok-import/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:profile.trim(),count})});const data=await res.json();if(!res.ok)throw Error(data.error||'Não foi possível iniciar');const p={since,id:null,syncing:false};localStorage.setItem(STORAGE,JSON.stringify(p));setPending(p);setState('Solicitação enviada. Aguardando GitHub Actions...');setMessage('Pode acompanhar nesta página. Após o processamento, os vídeos serão transferidos automaticamente para a nuvem.')}catch(e){setMessage(e.message)}finally{setBusy(false)}
 }
 function retry(){if(!pending)return;const p={...pending,syncing:false};setPending(p);localStorage.setItem(STORAGE,JSON.stringify(p));}
 return <section className="videoPanel"><div className="eyebrow" style={{marginTop:0}}>IMPORTADOR TIKTOK</div><h2>Importar diretamente para a biblioteca</h2><p>Cole o perfil de origem, selecione a quantidade e inicie. Os vídeos encontrados serão enviados à nuvem, sem downloads para seu computador.</p><div className="cloudForm"><label htmlFor="tiktok-profile" className="fieldLabel">Link do perfil</label><input id="tiktok-profile" value={profile} onChange={e=>setProfile(e.target.value)} placeholder="https://www.tiktok.com/@usuario" type="url"/><label htmlFor="tiktok-count" className="fieldLabel">Quantidade de vídeos (1 a 100)</label><input id="tiktok-count" value={count} onChange={e=>setCount(Number(e.target.value))} type="number" min="1" max="100"/><button className="primaryAction" disabled={busy||!!pending} onClick={start}>{pending?'Importação em andamento...':'Importar para biblioteca'}</button></div>{state&&<p role="status" className="videoNotice">{state}</p>}{message&&<p className="helper" role="status">{message}</p>}{pending&&<div className="reviewTools"><button onClick={retry}>Tentar sincronizar novamente</button><button onClick={()=>{localStorage.removeItem(STORAGE);setPending(null);setState('Acompanhamento encerrado. A execução no GitHub não foi cancelada.')}}>Encerrar acompanhamento</button></div>}<p className="helper">A importação de 100 vídeos depende da listagem disponibilizada pelo TikTok. A plataforma pode bloquear a descoberta de vídeos; nesse caso, o Studio mostrará uma falha real, sem afirmar que importou 100. O envio automático para a nuvem depende desta página permanecer aberta enquanto o lote termina nesta versão.</p><details><summary>Histórico técnico de importações</summary><div className="videoList">{history.slice(0,5).map(r=><div key={r.id} className="videoItem"><span>{r.status==='completed'?(r.conclusion==='success'?'Concluída':'Falhou'):'Em processamento'} — {new Date(r.created).toLocaleString('pt-BR')}</span><a className="textLink" href={r.url} target="_blank" rel="noreferrer">Detalhes ↗</a></div>)}</div></details></section>
}
