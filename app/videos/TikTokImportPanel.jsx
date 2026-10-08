'use client';
import {useCallback,useEffect,useState} from 'react';
const STORAGE='studio-pending-tiktok-import-v2';
const PLAN_KEY='studio-content-plan-v1';
const DEFAULT='https://www.tiktok.com/@vdeos.prontos.ia';
export default function TikTokImportPanel(){
 const [profile,setProfile]=useState(''),[perDay,setPerDay]=useState(3),[days,setDays]=useState(30),[campaign,setCampaign]=useState('Campanha 01'),[count,setCount]=useState(90),[pending,setPending]=useState(null),[state,setState]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState([]);
 useEffect(()=>{try{const p=JSON.parse(localStorage.getItem(STORAGE)||'null');if(p&&p.since)setPending(p);const plan=JSON.parse(localStorage.getItem(PLAN_KEY)||'null');if(plan){setProfile(plan.profile||'');setPerDay(plan.perDay||3);setDays(plan.days||30);setCount(plan.count||90);setCampaign(plan.campaign||'Campanha 01')}}catch{}},[]);
 useEffect(()=>{localStorage.setItem(PLAN_KEY,JSON.stringify({profile,perDay,days,count,campaign}))},[profile,perDay,days,count,campaign]);
 const needed=perDay*days;const shortage=Math.max(0,needed-count);
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
 function resetCampaign(){if(pending){setMessage('Aguarde a importação atual terminar antes de iniciar uma nova campanha.');return}if(!confirm('Criar nova campanha? Os vídeos da biblioteca serão preservados.'))return;const next='Campanha '+String(Date.now()).slice(-5);setCampaign(next);setProfile('');setPerDay(3);setDays(30);setCount(90);setMessage('Nova campanha iniciada. Os vídeos anteriores continuam guardados na biblioteca.');setState('');}
 function usePlan(){setCount(Math.max(1,Math.min(100,needed)));setMessage(needed>100?'O planejamento exige '+needed+' vídeos. O limite por importação é 100; serão necessários '+Math.ceil(needed/100)+' lotes.':'Quantidade preenchida com base no planejamento.');}
 return <section className="studioImporter"><div className="studioHero"><div><div className="studioKicker">SHOPEE CONTENT STUDIO / PRODUÇÃO</div><h2>Seu conteúdo começa <em>aqui.</em></h2><p>Planeje seu estoque de vídeos, importe de um perfil autorizado e revise tudo na sua biblioteca privada.</p></div><div className="studioHeroArt"><span>◉</span><strong>{needed}</strong><small>vídeos para seu plano</small></div></div>
 <div className="studioSteps"><span className="current"><b>01</b> Planejar</span><span><b>02</b> Importar</span><span><b>03</b> Revisar</span><span><b>04</b> Editar (em breve)</span></div>
 <div className="studioPanel"><div className="studioSectionTitle"><div><span className="studioStepTag">ETAPA 01</span><h3>Planejamento de conteúdo</h3><p>Descubra quantos vídeos você precisa antes de importar.</p></div><span className="studioSectionIcon">▦</span></div>
 <div className="studioPlannerGrid"><label>Vídeos por dia<input type="number" min="1" max="30" value={perDay} onChange={e=>setPerDay(Math.max(1,Math.min(30,Number(e.target.value)||1)))}/></label><label>Período em dias<input type="number" min="1" max="365" value={days} onChange={e=>setDays(Math.max(1,Math.min(365,Number(e.target.value)||1)))}/></label><div className="studioPlanResult"><small>TOTAL NECESSÁRIO</small><strong>{needed} <span>vídeos</span></strong><span>{perDay} por dia × {days} dias</span></div></div>
 <div className="studioQuickPlans"><span>PLANOS RÁPIDOS</span>{[{label:'1 semana',d:7},{label:'15 dias',d:15},{label:'30 dias',d:30},{label:'60 dias',d:60}].map(x=><button key={x.d} type="button" className={days===x.d?'active':''} onClick={()=>setDays(x.d)}>{x.label}</button>)}</div>
 <div className="studioPlanHint"><span>✦</span><p>{needed>100?<>Seu plano exige <strong>{needed} vídeos</strong>. Como o importador aceita até 100 por lote, serão necessários <strong>{Math.ceil(needed/100)} lotes</strong>.</>:<>Para publicar {perDay} vídeo(s) por dia por {days} dias, você precisa de <strong>{needed} vídeos</strong>. Quer usar essa quantidade na importação?</>}</p><button onClick={usePlan} type="button">Usar quantidade →</button></div></div>
 <div className="studioPanel"><div className="studioSectionTitle"><div><span className="studioStepTag">ETAPA 02</span><h3>Importar vídeos do TikTok</h3><p>Uma conta, um objetivo: tudo direto para a biblioteca na nuvem.</p></div><span className="studioSectionIcon">↗</span></div>
 <div className="studioInputLayout"><label className="studioWideField">Link do perfil TikTok<input value={profile} onChange={e=>setProfile(e.target.value)} placeholder="https://www.tiktok.com/@usuario" type="url"/></label><label>Quantidade a importar<input type="number" min="1" max="100" value={count} onChange={e=>setCount(Number(e.target.value))}/></label></div>
 <div className="studioImportSummary"><div><span>PLANEJADO</span><strong>{needed} vídeos</strong></div><div><span>SELECIONADO</span><strong>{count||0} vídeos</strong></div><div><span>COBERTURA ESTIMADA</span><strong>{perDay>0?Math.floor((count||0)/perDay):0} dias</strong></div></div>
 <button className="studioImportButton" disabled={busy||!!pending} onClick={start}>{pending?'◌ Importação em andamento...':'↗ Importar vídeos para a biblioteca'}</button>
 {shortage>0&&<p className="studioHint">Para completar este planejamento, ainda faltariam {shortage} vídeos além da quantidade selecionada.</p>}
 {state&&<p role="status" className="videoNotice">{state}</p>}{message&&<p role="status" className="studioHint">{message}</p>}
 {pending&&<div className="reviewTools"><button onClick={retry}>Tentar sincronizar novamente</button><button onClick={()=>{localStorage.removeItem(STORAGE);setPending(null);setState('Acompanhamento encerrado. A execução no GitHub não foi cancelada.')}}>Encerrar acompanhamento</button></div>}
 <p className="studioHint">A importação de perfis ainda é experimental: o TikTok pode limitar a listagem de vídeos. A transferência automática para a nuvem requer manter esta página aberta até o fim do processamento.</p>
 <details className="studioHistory"><summary>Histórico técnico de importações</summary><div className="videoList">{history.slice(0,5).map(r=><div key={r.id} className="videoItem"><span>{r.status==='completed'?(r.conclusion==='success'?'Concluída':'Falhou'):'Em processamento'} — {new Date(r.created).toLocaleString('pt-BR')}</span><a className="textLink" href={r.url} target="_blank" rel="noreferrer">Detalhes ↗</a></div>)}</div></details></div>
 <div className="studioCampaign"><div><span className="studioStepTag">CICLO DE PRODUÇÃO</span><h3>Preparado para a próxima campanha</h3><p>Ao concluir a edição e o cronograma, comece um novo lote com outra conta. O histórico e os vídeos existentes não são apagados.</p></div><button type="button" onClick={resetCampaign}>＋ Nova campanha</button></div>
 </section>
}
