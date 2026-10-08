import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

const password = randomBytes(32).toString('hex');
const base = 'http://localhost:3101';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-p','3101'], {cwd: new URL('../',import.meta.url),env:{...process.env,NODE_ENV:'production',STUDIO_PASSWORD:password,SESSION_SECRET:randomBytes(48).toString('hex')},stdio:'ignore'});
const request = (path, options={}) => fetch(base+path,{redirect:'manual',...options});
const login = (body,origin=base) => request('/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
try {
  let ready=false;
  for(let i=0;i<40;i++){try{await request('/login');ready=true;break;}catch{await setTimeout(250);}}
  assert.ok(ready,'Server readiness');
  assert.equal((await request('/login')).status,200);
  const blocked = await request('/dashboard');
  assert.equal(blocked.status,307);
  assert.equal(blocked.headers.get('location'),'/');
  assert.equal((await request('/dashboard',{headers:{Cookie:'studio_session=forged'}})).status,307);
  assert.equal((await login({password:'incorrect'})).status,401);
  assert.equal((await login(null)).status,401);
  assert.equal((await login({password},'https://untrusted.invalid')).status,403);
  const accepted=await login({password});
  assert.equal(accepted.status,200);
  const setCookie=accepted.headers.get('set-cookie');
  assert.ok(setCookie.includes('HttpOnly'));
  assert.ok(setCookie.includes('Secure'));
  assert.ok(setCookie.includes('SameSite=lax'));
  const cookie=setCookie.split(';')[0];
  const dashboard=await request('/dashboard',{headers:{Cookie:cookie}});
  assert.equal(dashboard.status,200);
  assert.ok((await dashboard.text()).includes('PAINEL PRIVADO'));
  const home=await request('/',{headers:{Cookie:cookie}});
  assert.equal(home.status,307);
  assert.equal(home.headers.get('location'),'/dashboard');
  assert.equal((await request('/api/logout',{method:'POST',headers:{Origin:'https://untrusted.invalid',Cookie:cookie}})).status,403);
  const logout=await request('/api/logout',{method:'POST',headers:{Origin:base,Cookie:cookie}});
  assert.equal(logout.status,303);
  assert.ok(logout.headers.get('set-cookie').includes('Max-Age=0'));
  assert.equal((await request('/dashboard')).status,307);
  console.log('PASS: login, logout, redirects, unsigned cookies, origin checks and private dashboard.');
} finally { server.kill('SIGTERM'); }
