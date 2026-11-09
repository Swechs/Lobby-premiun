import {adminShell,brand,publicShell} from '../standalone/ui.mjs';
import {renderHomeDocument} from './render.mjs';
import {createAdminAuth,hasSession,sessionCookie} from './panel-auth.mjs';

const menuKey='lobby/menu.json';
const externalMenus=new Set(['https://lobbypremiumcafe.com','https://www.lobbypremiumcafe.com']);
const categoryFields=['name','description','sortOrder'];
const productFields=[...categoryFields,'price','categoryId'];
const routes=new Map([
 ['home','/'],['menu','/menü'],['admin','/admin'],['public-menu','/api/menu'],
 ['edit-menu','/api/admin/menu'],['export','/api/admin/export'],
 ['setup','/auth/setup'],['login','/auth/login'],['logout','/auth/logout']
]);
const securityHeaders={
 'Cache-Control':'no-store',
 'Referrer-Policy':'same-origin',
 'X-Content-Type-Options':'nosniff',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{...securityHeaders,...headers}});
const html=content=>new Response(content,{headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8'}});
const error=(message,status)=>json({error:message},status);
const conflict=()=>error('Menü başka bir oturumda değişti. Sayfayı yenileyip tekrar deneyin.',409);

function document(content,state,script,admin=false){
 return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${admin?'Menü Yönetimi':'Menü'} | LOBBY PREMIUM LOUNGE</title>${admin?'<meta name="robots" content="noindex,nofollow">':''}<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css"></head><body>${content}${state?`<script id="initial-state" type="application/json">${JSON.stringify(state).replace(/</g,'\\u003c')}</script>`:''}<script type="module" src="/${script}"></script></body></html>`;
}

function loginPage(setup){
 const title=setup?'Yönetim panelini kur':'Menü yönetimi';
 const intro=setup?'İşletmenin kullanacağı yönetici parolasını belirleyin. Kurulum için size verilen tek kullanımlık bağlantıyı açın.':'Menüyü düzenlemek için yönetici parolanızla giriş yapın.';
 return document(`<main class="auth-page"><a href="/">${brand()}</a><div class="auth-card"><span class="eyebrow">YÖNETİM ALANI</span><h1>${title}</h1><p>${intro}</p><form id="login-form" data-mode="${setup?'setup':'login'}"><label class="field">Yönetici parolası<input id="password" type="password" autocomplete="${setup?'new-password':'current-password'}" required minlength="12" maxlength="128"></label>${setup?'<label class="field">Parola tekrarı<input id="confirm-password" type="password" autocomplete="new-password" required minlength="12" maxlength="128"></label>':''}<p id="login-error" class="admin-help" role="alert"></p><button class="primary" type="submit">${setup?'Parolayı oluştur':'Giriş yap'}</button></form><a class="back-link" href="/menü">Menüye dön</a></div></main>`,null,'panel-login.mjs',true);
}

function mergeItems(items,overrides,fields){
 return items.map(item=>{
  const patch=overrides?.[item.id];
  if(!patch)return item;
  return {...item,...Object.fromEntries(fields.filter(field=>Object.hasOwn(patch,field)).map(field=>[field,patch[field]]))};
 });
}

function itemOverrides(initial,edited,fields){
 const byId=new Map(edited.map(item=>[item.id,item]));
 return Object.fromEntries(initial.flatMap(item=>{
  const saved=byId.get(item.id);
  const changes=fields.filter(field=>saved[field]!==item[field]);
  return changes.length?[[item.id,Object.fromEntries(changes.map(field=>[field,saved[field]]))]]:[];
 }));
}

async function requestJson(request,limit){
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new Error('JSON istek gerekli.');
 const reader=request.body?.getReader();
 if(!reader)throw new Error('İstek boş.');
 const chunks=[];
 let size=0;
 while(true){
  const {done,value}=await reader.read();
  if(done)break;
  size+=value.length;
  if(size>limit){await reader.cancel();throw new Error('İstek çok büyük.');}
  chunks.push(value);
 }
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createPanelHandler({store,initialMenu,validateMenu,changesBetween,setupHash,siteOrigin}){
 const auth=createAdminAuth(store,setupHash);
 const initialState={menu:initialMenu,revision:1,updatedAt:null};
 function toState(record){
  if(!record)return initialState;
  const data=record.data;
  const menu={
   ...initialMenu,
   categories:mergeItems(initialMenu.categories,data.categories,categoryFields),
   products:mergeItems(initialMenu.products,data.products,productFields)
  };
  for(const product of menu.products){
   if(!menu.categories.some(category=>category.id===product.categoryId)){
    product.categoryId=initialMenu.products.find(item=>item.id===product.id).categoryId;
   }
  }
  validateMenu(menu);
  return {menu,revision:data.revision,updatedAt:data.updatedAt};
 }
 async function saveMenu(input){
  try{validateMenu(input?.menu);}catch(e){return error(e.message,400);}
  const record=await store.read(menuKey),current=toState(record);
  if(input.revision!==current.revision)return conflict();
  if(!changesBetween(current.menu,input.menu).length)return json(current);
  const data={
   revision:current.revision+1,
   updatedAt:new Date().toISOString(),
   categories:itemOverrides(initialMenu.categories,input.menu.categories,categoryFields),
   products:itemOverrides(initialMenu.products,input.menu.products,productFields)
  };
  if(!await store.write(menuKey,data,record?.etag??null))return conflict();
  return json(toState({data}));
 }
 async function handle(request){
  const url=new URL(request.url),method=request.method;
  const pathname=decodeURIComponent(url.pathname).replace(/\/$/,'')||'/';
  const route=pathname==='/api/lobby'?routes.get(url.searchParams.get('lobbyRoute')):pathname;
  if(!route||![...routes.values()].includes(route))return error('Sayfa bulunamadı.',404);
  if(route==='/api/menu'&&method==='GET'){
   const origin=request.headers.get('origin');
   const cors=externalMenus.has(origin)?{'Access-Control-Allow-Origin':origin}:undefined;
   return json(toState(await store.read(menuKey)),200,{...cors,Vary:'Origin'});
  }
  if(method==='GET'&&(route==='/'||route==='/menü')){
   let state;
   try{state=toState(await store.read(menuKey));}catch{state=initialState;}
   return html(route==='/'?renderHomeDocument(state.menu):document(publicShell(),state,'menu-client.mjs'));
  }
  if(route==='/admin'&&method==='GET'){
   const record=await auth.read();
   if(!hasSession(request,record))return html(loginPage(!record));
   return html(document(adminShell(),toState(await store.read(menuKey)),'admin-client.mjs',true));
  }
  const sameOrigin=request.headers.get('origin')===siteOrigin&&url.origin===siteOrigin;
  if(route==='/auth/logout'&&method==='POST'){
   if(!sameOrigin)return error('İstek kaynağı doğrulanamadı.',403);
   if(!await auth.logout(request))return error('Oturum kapatılamadı. Tekrar deneyin.',409);
   return new Response(null,{status:303,headers:{...securityHeaders,Location:'/admin','Set-Cookie':sessionCookie('',0)}});
  }
  if(method==='POST'&&(route==='/auth/login'||route==='/auth/setup')){
   if(!sameOrigin||request.headers.get('x-menu-action')!=='save')return error('İstek kaynağı doğrulanamadı.',403);
   let input;
   try{input=await requestJson(request,4096);}catch{return error('İstek biçimi geçersiz.',400);}
   const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()||'unknown';
   const result=route==='/auth/setup'?await auth.setup(input?.code,input?.password):await auth.login(ip,input?.password);
   if(result.error)return error(result.error,result.status);
   return json({ok:true},200,result.session?{'Set-Cookie':sessionCookie(result.session)}:{});
  }
  if(route.startsWith('/api/admin/')){
   if(!hasSession(request,await auth.read()))return error('Yetkili yönetici girişi gerekli.',403);
   if(route==='/api/admin/export'&&method==='GET'){
    const initial=url.searchParams.get('type')==='initial';
    const state=initial?initialState:toState(await store.read(menuKey));
    return json(state,200,{'Content-Disposition':`attachment; filename="lobby-menu-${initial?'initial':'current'}.json"`});
   }
   if(route==='/api/admin/menu'&&method==='GET')return json(toState(await store.read(menuKey)));
   if(route==='/api/admin/menu'&&method==='PUT'){
    if(!sameOrigin||request.headers.get('x-menu-action')!=='save')return error('İstek kaynağı doğrulanamadı.',403);
    let input;
    try{input=await requestJson(request,2_000_000);}catch{return error('İstek biçimi geçersiz.',400);}
    return saveMenu(input);
   }
  }
  return error('İstek yöntemi desteklenmiyor.',405);
 }
 return async request=>{
  try{return await handle(request);}
  catch(exception){
   console.error('LOBBY panel request failed:',exception?.name);
   return error('Menü hizmetine şu anda ulaşılamıyor. Lütfen tekrar deneyin.',503);
  }
 };
}
