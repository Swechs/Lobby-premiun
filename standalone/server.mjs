import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {publicShell,adminShell,brand,esc} from './ui.mjs';
import {renderHomeDocument} from '../website/render.mjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const dataDir=process.env.LOBBY_DATA_DIR||path.join(root,'.sites-runtime','standalone');fs.mkdirSync(dataDir,{recursive:true});
const database=new DatabaseSync(path.join(dataDir,'menu.sqlite'));database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
if(!database.prepare("SELECT name FROM sqlite_master WHERE name='menu_state'").get())database.exec(fs.readFileSync(path.join(root,'drizzle/0000_lobby_menu.sql'),'utf8'));
database.exec('CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS login_throttle (ip TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_end INTEGER NOT NULL);');
const initial=JSON.parse(fs.readFileSync(path.join(root,'data/initial-menu.json'),'utf8'));
const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const sharedSource=stripTypeScriptTypes(fs.readFileSync(path.join(root,'lib/menu.ts'),'utf8').replace("import initial from '../data/initial-menu.json';",'const initial='+JSON.stringify(initial)+';'));
const sharedUrl=moduleUrl(sharedSource),{validateMenu}=await import(sharedUrl);
const adapter={prepare(sql){return{bind(...args){return{_sql:sql,_args:args,async run(){return{meta:{changes:Number(database.prepare(sql).run(...args).changes)}};},async first(){return database.prepare(sql).get(...args)||null;}};}};},async batch(statements){database.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>({meta:{changes:Number(database.prepare(s._sql).run(...s._args).changes)}}));database.exec('COMMIT');return results;}catch(e){database.exec('ROLLBACK');throw e;}}};
// Isolated local D1 adapter. Hosted Sites always uses its native binding.
const envUrl=moduleUrl('export const env=globalThis.__lobbyStandaloneEnv;');globalThis.__lobbyStandaloneEnv={DB:adapter};
const storeSource=stripTypeScriptTypes(fs.readFileSync(path.join(root,'lib/store.ts'),'utf8').replace("'cloudflare:workers'",JSON.stringify(envUrl)).replace("'./menu'",JSON.stringify(sharedUrl)));
const {readMenu,saveMenu}=await import(moduleUrl(storeSource));
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4317),origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
const parsedOrigin=new URL(origin);if(process.env.NODE_ENV==='production'&&parsedOrigin.protocol!=='https:')throw new Error('Production requires an HTTPS PUBLIC_ORIGIN.');
const secure=parsedOrigin.protocol==='https:',cookie=(token,maxAge)=>`lobby_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;
const hash=token=>crypto.createHash('sha256').update(token).digest('hex');
function session(req){const token=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('lobby_admin='))?.slice(12);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return database.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>?').get(hash(token),Date.now());}
const scrypt=promisify(crypto.scrypt);
function passwordConfig(){try{return JSON.parse(process.env.ADMIN_PASSWORD_HASH||fs.readFileSync(path.join(dataDir,'admin.json'),'utf8'));}catch{return null;}}
async function passwordMatches(password){const config=passwordConfig();if(!config||typeof password!=='string'||password.length>256)return false;try{const result=await scrypt(password,config.salt,64);const expected=Buffer.from(config.hash,'hex');return expected.length===result.length&&crypto.timingSafeEqual(result,expected);}catch{return false;}}
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
function send(res,status,body,type='application/json; charset=utf-8',extra={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':csp,...(secure?{'Strict-Transport-Security':'max-age=31536000'}:{}),...extra});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));}
function html(content,state,script,admin=false){return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${admin?'Menü Yönetimi':'Menü'} | LOBBY PREMIUM LOUNGE</title><meta name="description" content="LOBBY PREMIUM LOUNGE güncel dijital menüsü.">${admin?'<meta name="robots" content="noindex,nofollow">':''}<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css"></head><body>${content}${state?`<script id="initial-state" type="application/json">${JSON.stringify(state).replace(/</g,'\\u003c')}</script>`:''}${script?`<script type="module" src="/${script}"></script>`:''}</body></html>`;}
function loginPage(message=''){return html(`<main class="auth-page"><a href="/">${brand()}</a><div class="auth-card"><span class="eyebrow">YÖNETİM ALANI</span><h1>Menü yönetimi</h1><p>Menüyü düzenlemek için yönetici parolanızla giriş yapın.</p><form id="login-form"><label class="field">Yönetici parolası<input id="password" type="password" autocomplete="current-password" required maxlength="256"></label><p id="login-error" class="admin-help" role="alert">${esc(message)}</p><button class="primary" type="submit">Giriş yap</button></form><a class="back-link" href="/">Menüye dön</a></div></main>`,null,'login-client.mjs',true);}
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>250000)throw new Error('İstek çok büyük.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
const assets={'/assets/images/friends-games.avif':['website/assets/images/friends-games.avif','image/avif'],'/assets/site.css':['website/assets/site.css','text/css; charset=utf-8'],'/assets/site.js':['website/assets/site.js','text/javascript; charset=utf-8'],'/style.css':['app/globals.css','text/css; charset=utf-8'],'/favicon.svg':['public/favicon.svg','image/svg+xml'],'/ui.mjs':['standalone/ui.mjs','text/javascript; charset=utf-8'],'/menu-client.mjs':['standalone/menu-client.mjs','text/javascript; charset=utf-8'],'/admin-client.mjs':['standalone/admin-client.mjs','text/javascript; charset=utf-8'],'/login-client.mjs':['standalone/login-client.mjs','text/javascript; charset=utf-8']};
export async function handle(req,res){try{
 const url=new URL(req.url,origin),pathname=decodeURIComponent(url.pathname);
 if(req.method==='GET'&&assets[pathname]){const [file,type]=assets[pathname];return send(res,200,fs.readFileSync(path.join(root,file)),type);}
 if(req.method==='GET'&&pathname==='/shared.mjs')return send(res,200,sharedSource,'text/javascript; charset=utf-8');
 if(req.method==='GET'&&pathname==='/')return send(res,200,renderHomeDocument((await readMenu()).menu),'text/html; charset=utf-8');
 if(req.method==='GET'&&['/menu','/menu/'].includes(pathname))return send(res,308,'','text/plain',{Location:'/men%C3%BC'+url.search});
 if(req.method==='GET'&&['/menü','/menü/'].includes(pathname))return send(res,200,html(publicShell(),await readMenu(),'menu-client.mjs'),'text/html; charset=utf-8');
 if(req.method==='GET'&&pathname==='/api/menu')return send(res,200,await readMenu());
 if(req.method==='GET'&&pathname==='/admin')return send(res,200,session(req)?html(adminShell(),await readMenu(),'admin-client.mjs',true):loginPage(passwordConfig()?'':'Yönetici parolası henüz sunucuda tanımlanmamış.'),'text/html; charset=utf-8');
 if(pathname==='/auth/login'&&req.method==='POST'){
  if(req.headers.origin!==origin||req.headers['x-menu-action']!=='save')return send(res,403,{error:'İstek kaynağı doğrulanamadı.'});
  if(!passwordConfig())return send(res,503,{error:'Yönetici parolası sunucuda tanımlanmalı.'});
  const ip=req.socket.remoteAddress||'local',now=Date.now();let rate=database.prepare('SELECT * FROM login_throttle WHERE ip=?').get(ip);
  if(rate&&rate.window_end>now&&rate.attempts>=10)return send(res,429,{error:'Çok fazla giriş denemesi. Daha sonra yeniden deneyin.'});
  if(!rate||rate.window_end<=now){database.prepare('INSERT OR REPLACE INTO login_throttle VALUES (?,?,?)').run(ip,0,now+900000);}
  database.prepare('UPDATE login_throttle SET attempts=attempts+1 WHERE ip=?').run(ip);
  const {password}=await body(req);if(!await passwordMatches(password))return send(res,401,{error:'Parola doğrulanamadı.'});
  database.prepare('DELETE FROM login_throttle WHERE ip=?').run(ip);database.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').run(now);
  const token=crypto.randomBytes(32).toString('hex');database.prepare('INSERT INTO admin_sessions VALUES (?,?)').run(hash(token),now+8*3600000);return send(res,200,{ok:true},undefined,{'Set-Cookie':cookie(token,28800)});
 }
 if(pathname==='/auth/logout'&&req.method==='POST'){if(req.headers.origin!==origin)return send(res,403,{error:'İstek kaynağı doğrulanamadı.'});const s=session(req);if(s)database.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(s.token_hash);return send(res,303,'','text/plain',{Location:'/admin','Set-Cookie':cookie('',0)});}
 if(pathname.startsWith('/api/admin/')){
  if(!session(req))return send(res,403,{error:'Yetkili yönetici girişi gerekli.'});
  if(req.method==='GET'&&pathname==='/api/admin/menu')return send(res,200,await readMenu());
  if(req.method==='GET'&&pathname==='/api/admin/export'){const initialExport=url.searchParams.get('type')==='initial';return send(res,200,JSON.stringify(initialExport?{menu:initial,revision:1}:await readMenu(),null,2),undefined,{'Content-Disposition':`attachment; filename="lobby-menu-${initialExport?'initial':'current'}.json"`});}
  if(req.method==='PUT'&&pathname==='/api/admin/menu'){
   if(req.headers.origin!==origin||req.headers['x-menu-action']!=='save'||!req.headers['content-type']?.startsWith('application/json'))return send(res,403,{error:'İstek kaynağı doğrulanamadı.'});
   const b=await body(req);if(!Number.isInteger(b.revision)||b.revision<1)return send(res,400,{error:'Sürüm geçersiz.'});validateMenu(b.menu);return send(res,200,await saveMenu(b.menu,b.revision,'standalone-admin'));
  }
 }
 return send(res,404,{error:'Sayfa bulunamadı.'});
 }catch(error){const message=error instanceof Error?error.message:'İşlem tamamlanamadı.';send(res,message==='CONFLICT'?409:400,{error:message==='CONFLICT'?'Menü başka bir oturumda değişti. Güncel veriyi yeniden yükleyin.':message});}
}
export function closeDatabase(){database.close();}
const server=http.createServer(handle);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(port,host,()=>console.log('LOBBY local: '+origin));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{database.close();process.exit(0);}));
