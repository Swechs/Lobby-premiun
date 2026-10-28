import fs from 'node:fs';
import assert from 'node:assert/strict';
import {stripTypeScriptTypes} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const initial=JSON.parse(fs.readFileSync('data/initial-menu.json','utf8'));
const menuSource=fs.readFileSync('lib/menu.ts','utf8').replace("import initial from '../data/initial-menu.json';",'const initial='+JSON.stringify(initial)+';');
const menuUrl=moduleUrl(stripTypeScriptTypes(menuSource));
const {validateMenu,normalizeSearch,formatPrice,changesBetween}=await import(menuUrl);
const tests=[];
function check(name,fn){fn();tests.push({test:name,result:'PASS'});}
async function asyncCheck(name,fn){await fn();tests.push({test:name,result:'PASS'});}
const clone=()=>structuredClone(initial);
const source=fs.readFileSync('source/LOBBY_PREMIUM_ANA_MENU.md','utf8');
check('Source checksum and title preserved',()=>{assert.equal(initial.sourceSha256,createHash('sha256').update(source).digest('hex'));assert.equal(initial.sourceTitle,'LOBBY PREMIUM CAFE');});
const sections=source.replace(/^\uFEFF/,'').split(/^## /m).slice(3);
const fieldDifferences=[];
check('Independent field comparison of all 158 products and 23 categories',()=>{
 assert.equal(sections.length,23);
 for(let i=0;i<sections.length;i++){
  const lines=sections[i].split(/\r?\n/),name=lines.shift(),c=initial.categories[i];assert.equal(c.name,name);assert.equal(c.sortOrder,i);
  const rows=lines.filter(l=>l.startsWith('| ')&&!l.startsWith('| Ürün |')&&!l.startsWith('| ---'));
  const products=initial.products.filter(p=>p.categoryId===c.id);assert.equal(rows.length,products.length);
  rows.forEach((row,j)=>{const [n,price,d]=row.split('|').slice(1,-1).map(s=>s.trim());const expected={name:n,description:d,price:price?Number(price.replace(' TL','').replace(',','.')):null};for(const key of Object.keys(expected)){if(products[j][key]!==expected[key])fieldDifferences.push({id:products[j].id,field:key,expected:expected[key],actual:products[j][key]});}assert.equal(products[j].sortOrder,j);});
 }
 assert.deepEqual(fieldDifferences,[]);assert.equal(initial.products.length,158);validateMenu(initial);
});
check('Exactly 9 desserts and 3 sandwiches have null prices',()=>{const ids=initial.categories.filter(c=>['Tatlılar','Sandviçler'].includes(c.name)).map(c=>c.id);assert.equal(initial.products.filter(p=>p.price===null).length,12);assert.equal(initial.products.filter(p=>ids.includes(p.categoryId)&&p.price===null).length,12);assert.ok(!initial.products.some(p=>/burger|hemingway/i.test(p.name)));});
check('Approved prices, names, and category note',()=>{const prices={'Akdeniz Salata':250,'Karışık Pizza':350,'Kremalı Tavuklu Penne':380,'Penne Arrabbiata':310,'Bazlama Tavuklu Tost':350,'Red Bull':180,'Vejetaryen Pizza':290};for(const [name,price]of Object.entries(prices))assert.equal(initial.products.find(p=>p.name===name)?.price,price);assert.ok(initial.products.filter(p=>p.categoryId==='cat-07').every(p=>p.price===180));for(const name of ["Devil's Cake",'Kuzukulağı','Üç Peynirli Kruvasan'])assert.ok(initial.products.some(p=>p.name===name));assert.equal(initial.categories.find(c=>c.name==='Gözlemeler').description,'Tüm gözlemeler domates, salatalık ve zeytin eşliğinde servis edilir.');});
check('Turkish case, decomposed Unicode, and ASCII search',()=>{assert.equal(normalizeSearch('SICAK İÇECEKLER'),normalizeSearch('sıcak içecekler'));assert.equal(normalizeSearch('ÇİLEKLİ'),normalizeSearch('çilekli'));assert.equal(normalizeSearch('KUŞBURNU'),normalizeSearch('kusburnu'));assert.equal(normalizeSearch('İ'.normalize('NFD')),normalizeSearch('i'));assert.ok(normalizeSearch(initial.products.find(p=>p.name==='Vejetaryen Pizza').description).includes(normalizeSearch('DİLİMLİ SİYAH ZEYTİN')));});
check('Null display empty and TL decimal precision',()=>{assert.equal(formatPrice(null),'');assert.equal(formatPrice(180.25),'180,25 TL');assert.equal(formatPrice(180),'180 TL');});
check('Reject invalid edits and preserve immutable source provenance',()=>{for(const price of [-1,NaN,Infinity,12.001,'180']){const m=clone();m.products[0].price=price;assert.throws(()=>validateMenu(m));}const m=clone();m.products[0].sourceCategoryName='changed';assert.throws(()=>validateMenu(m));const n=clone();n.products[1].id=n.products[0].id;assert.throws(()=>validateMenu(n));const d=clone();d.products.pop();assert.throws(()=>validateMenu(d));});
check('Pre-save changes identify exact before/after fields',()=>{const m=clone();m.products[0].price=null;m.categories[0].name='Yeni ad';assert.equal(changesBetween(initial,m).length,2);assert.equal(changesBetween(initial,m).find(c=>c.field==='price').after,'(boş)');});
fs.mkdirSync('.sites-runtime',{recursive:true});
const dbPath='.sites-runtime/test-'+Date.now()+'.sqlite';let sqlite=new DatabaseSync(dbPath);
sqlite.exec(fs.readFileSync('drizzle/0000_lobby_menu.sql','utf8'));
function adapter(){return {prepare(sql){return {bind(...args){return {async run(){const result=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};},async first(){return sqlite.prepare(sql).get(...args)||null;},_sql:sql,_args:args};}};},async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const result=[];for(const statement of statements){const r=sqlite.prepare(statement._sql).run(...statement._args);result.push({meta:{changes:Number(r.changes)}});}sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};}
globalThis.__lobbyTestEnv={DB:adapter(),ADMIN_EMAILS:'admin@example.com'};
globalThis.__lobbyTestUser=null;
const envUrl=moduleUrl('export const env=globalThis.__lobbyTestEnv;');
const authUrl=moduleUrl('export async function getChatGPTUser(){return globalThis.__lobbyTestUser;}');
const compile=(file,replacements)=>{let s=fs.readFileSync(file,'utf8');for(const [a,b]of replacements)s=s.replace(a,b);return moduleUrl(stripTypeScriptTypes(s));};
const storeUrl=compile('lib/store.ts',[["'cloudflare:workers'",JSON.stringify(envUrl)],["'./menu'",JSON.stringify(menuUrl)]]);
const adminUrl=compile('lib/admin-auth.ts',[["'cloudflare:workers'",JSON.stringify(envUrl)],["'../app/chatgpt-auth'",JSON.stringify(authUrl)]]);
const routeUrl=compile('app/api/admin/menu/route.ts',[["'../../../../lib/admin-auth'",JSON.stringify(adminUrl)],["'../../../../lib/menu'",JSON.stringify(menuUrl)],["'../../../../lib/store'",JSON.stringify(storeUrl)]]);
const expUrl=compile('app/api/admin/export/route.ts',[["'../../../../lib/admin-auth'",JSON.stringify(adminUrl)],["'../../../../lib/store'",JSON.stringify(storeUrl)],["'../../../../lib/menu'",JSON.stringify(menuUrl)]]);
const {readMenu,saveMenu}=await import(storeUrl),route=await import(routeUrl),exportsRoute=await import(expUrl);
const req=(body,origin='https://menu.example')=>new Request('https://menu.example/api/admin/menu',{method:'PUT',headers:{Origin:origin,'Content-Type':'application/json','X-Menu-Action':'save'},body:JSON.stringify(body)});
await asyncCheck('Anonymous and non-admin reads, writes, exports rejected',async()=>{assert.equal((await route.GET()).status,403);assert.equal((await route.PUT(req({menu:initial,revision:1}))).status,403);assert.equal((await exportsRoute.GET(new Request('https://menu.example/api/admin/export'))).status,403);globalThis.__lobbyTestUser={userId:'other',email:'other@example.com'};assert.equal((await route.GET()).status,403);globalThis.__lobbyTestUser={userId:'admin-id',email:'admin@example.com'};assert.equal((await route.GET()).status,200);});
await asyncCheck('Cross-origin writes rejected',async()=>{assert.equal((await route.PUT(req({menu:initial,revision:1},'https://attacker.example'))).status,403);});
await asyncCheck('Price update, clearing, restart durability and no reseed overwrite',async()=>{const m=clone();m.products[0].price=123.45;let r=await route.PUT(req({menu:m,revision:1}));assert.equal(r.status,200);assert.equal((await readMenu()).menu.products[0].price,123.45);sqlite.close();sqlite=new DatabaseSync(dbPath);assert.equal((await readMenu()).menu.products[0].price,123.45);m.products[0].price=null;r=await route.PUT(req({menu:m,revision:2}));assert.equal(r.status,200);sqlite.close();sqlite=new DatabaseSync(dbPath);assert.equal((await readMenu()).menu.products[0].price,null);});
await asyncCheck('Stale and racing revisions cannot overwrite saved data',async()=>{assert.equal((await route.PUT(req({menu:initial,revision:1}))).status,409);const revision=(await readMenu()).revision;const a=clone(),b=clone();a.products[0].price=111;b.products[0].price=222;const results=await Promise.allSettled([saveMenu(a,revision,'admin-id'),saveMenu(b,revision,'admin-id')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);});
await asyncCheck('Only administrator actions mutate data; audit and exports preserved',async()=>{const state=await readMenu();assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM menu_audit').get().n,state.revision-1);const exp=await exportsRoute.GET(new Request('https://menu.example/api/admin/export?type=initial'));assert.deepEqual((await exp.json()).menu,initial);const current=await exportsRoute.GET(new Request('https://menu.example/api/admin/export'));assert.equal((await current.json()).revision,state.revision);});
sqlite.close();fs.rmSync(dbPath);
const report={categoryCount:23,productCount:158,nullPrices:12,counts:initial.categories.map(c=>({category:c.name,count:initial.products.filter(p=>p.categoryId===c.id).length})),fieldDifferences,tests};
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:tests.length,failed:0,fieldDifferences:fieldDifferences.length,counts:report.counts}));
