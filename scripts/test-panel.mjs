import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {changesBetween,initialMenu,validateMenu} from '../.sites-runtime/vercel-panel/public/shared.mjs';
import {createPanelHandler} from '../website/panel.mjs';

const records=new Map();
const store={
 async read(key){return structuredClone(records.get(key)??null);},
 async write(key,data,etag){
  if((records.get(key)?.etag??null)!==etag)return false;
  records.set(key,{data:structuredClone(data),etag:String(Number(etag)+1)});
  return true;
 }
};
const siteOrigin='https://menu.example';
const code='a'.repeat(64),password='Example strong passphrase';
const setupHash=createHash('sha256').update(code).digest('hex');
const options={store,siteOrigin,setupHash,initialMenu,validateMenu,changesBetween};
let handle=createPanelHandler(options);
let cookie;
const call=(path,{method='GET',body,origin=siteOrigin,session=false}={})=>{
 const headers={Origin:origin,'X-Menu-Action':'save'};
 if(session)headers.Cookie=cookie;
 if(body!==undefined)headers['Content-Type']='application/json';
 return handle(new Request(siteOrigin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}));
};
const status=async(path,request,expected)=>assert.equal((await call(path,request)).status,expected,path);
const state=async()=>await (await call('/api/menu')).json();

assert.match(await (await call('/api/lobby?lobbyRoute=admin')).text(),/Yönetim panelini kur/);
await status('/api/admin/menu',{},403);
await status('/auth/setup',{method:'POST',body:{code,password},origin:'https://attacker.example'},403);
await status('/auth/setup',{method:'POST',body:{code:'b'.repeat(64),password}},403);
await status('/auth/setup',{method:'POST',body:{code,password}},200);
await status('/auth/setup',{method:'POST',body:{code,password}},409);
await status('/auth/login',{method:'POST',body:{password:'wrong long password'}},401);
const login=await call('/auth/login',{method:'POST',body:{password}});
assert.equal(login.status,200);
const setCookie=login.headers.get('set-cookie');
assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);
cookie=setCookie.split(';')[0];
assert.match(await (await call('/admin',{session:true})).text(),/Değişiklikleri incele/);
const initial=await state();
assert.deepEqual(initial.menu,initialMenu);
assert.equal(initial.revision,1);
const external=await call('/api/menu',{origin:'https://lobbypremiumcafe.com'});
assert.equal(external.headers.get('access-control-allow-origin'),'https://lobbypremiumcafe.com');
assert.equal(external.headers.get('access-control-allow-credentials'),null);
assert.equal((await call('/api/menu',{origin:'https://attacker.example'})).headers.get('access-control-allow-origin'),null);

const firstEdit=structuredClone(initial);
firstEdit.menu.products[0].price=123.45;
firstEdit.menu.products[0].description='Test açıklaması <etiket>';
firstEdit.menu.categories[0].name='Test kategorisi';
const save={method:'PUT',session:true,body:firstEdit};
await status('/api/admin/menu',{...save,session:false},403);
await status('/api/admin/menu',{...save,origin:'https://lobbypremiumcafe.com'},403);
await status('/api/lobby?lobbyRoute=edit-menu',save,200);
await status('/api/admin/menu',save,409);
handle=createPanelHandler(options);
assert.equal((await state()).menu.products[0].price,123.45);
assert.equal((await state()).menu.categories[0].name,'Test kategorisi');
assert.match(await (await call('/men%C3%BC')).text(),/Test açıklaması \\u003cetiket>/);
const exported=await call('/api/lobby?lobbyRoute=export&type=initial',{session:true});
assert.deepEqual((await exported.json()).menu,initialMenu);

const secondEdit=await state();
secondEdit.menu.products[0].price=null;
const competingEdit=structuredClone(secondEdit);
competingEdit.menu.products[0].price=200;
const writes=await Promise.all([secondEdit,competingEdit].map(body=>call('/api/admin/menu',{...save,body})));
assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
const final=await state();
assert.equal(final.revision,3);
final.menu.products[0].price=null;
await status('/api/admin/menu',{...save,body:final},200);
assert.equal((await state()).menu.products[0].price,null);
await status('/auth/logout',{method:'POST',session:true},303);
await status('/api/admin/menu',{session:true},403);
console.log('Panel doğrulandı: tek kullanımlık kurulum, oturum, erişim, menü kaydı, eşzamanlı kayıt ve dışa aktarma.');
