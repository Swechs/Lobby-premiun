import {env} from 'cloudflare:workers';
import {initialMenu,changesBetween,validateMenu,type Change,type Menu,type MenuState} from './menu';

const previousMenuChecksum='e91d202110894040af5ad2732456442bcdfc85b9364cca574c5b9c7ecfe73a3f';

function applyNovemberMenuUpdate(previous:Menu):Menu{
 const categories=initialMenu.categories.map(source=>{
  const saved=previous.categories.find(category=>category.id===source.id);
  return saved?{...saved,sourceLine:source.sourceLine}:source;
 });
 const products=initialMenu.products.map(source=>{
  const saved=previous.products.find(product=>product.id===source.id);
  if(!saved)return source;
  const price=source.sourceCategoryName==='Tatlılar'?source.price:saved.price;
  return {...saved,price,sourceLine:source.sourceLine};
 });
 return {...previous,sourceSha256:initialMenu.sourceSha256,categories,products};
}

async function writeRevision(menu:Menu,revision:number,actorId:string,changes:Change[]):Promise<MenuState|null>{
 const id=crypto.randomUUID(),updatedAt=new Date().toISOString();
 const result=await env.DB!.batch([
  env.DB!.prepare('UPDATE menu_state SET content=?,revision=revision+1,updated_at=?,last_mutation=? WHERE id=? AND revision=?').bind(JSON.stringify(menu),updatedAt,id,'main',revision),
  env.DB!.prepare('INSERT INTO menu_audit (id,revision,actor_id,changes,created_at) SELECT ?,revision,?,?,? FROM menu_state WHERE id=? AND last_mutation=?').bind(id,actorId,JSON.stringify(changes),updatedAt,'main',id)
 ]);
 return result[0].meta.changes===1?{menu,revision:revision+1,updatedAt}:null;
}

export async function readMenu():Promise<MenuState>{
 if(!env.DB)throw new Error('Kalıcı menü veritabanı bağlanmamış.');
 await env.DB.prepare('INSERT OR IGNORE INTO menu_state (id,content,revision,updated_at,last_mutation) VALUES (?,?,?,?,?)').bind('main',JSON.stringify(initialMenu),1,new Date().toISOString(),'initial-import').run();
 while(true){
  const row=await env.DB.prepare('SELECT content,revision,updated_at FROM menu_state WHERE id=?').bind('main').first<{content:string;revision:number;updated_at:string}>();
  if(!row)throw new Error('Menü okunamadı.');
  const menu=JSON.parse(row.content) as Menu;
  if(menu.sourceSha256!==previousMenuChecksum)return {menu,revision:row.revision,updatedAt:row.updated_at};
  const updated=applyNovemberMenuUpdate(menu);
  validateMenu(updated);
  const changes=changesBetween(menu,updated);
  changes.push({label:'Nargileler',field:'category',before:'(boş)',after:'4 ürün eklendi'});
  const result=await writeRevision(updated,row.revision,'menu-source-update-2026-11-09',changes);
  if(result)return result;
 }
}
export async function saveMenu(menu:Menu,revision:number,actorId:string){
 const current=await readMenu();if(current.revision!==revision)throw new Error('CONFLICT');
 const changes=changesBetween(current.menu,menu);if(!changes.length)return current;
 const result=await writeRevision(menu,revision,actorId,changes);
 if(!result)throw new Error('CONFLICT');
 return result;
}
