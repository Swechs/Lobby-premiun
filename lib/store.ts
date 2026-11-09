import {env} from 'cloudflare:workers';
import {initialMenu,changesBetween,validateMenu,type Change,type Menu,type MenuState} from './menu';

const originalMenuChecksum='e91d202110894040af5ad2732456442bcdfc85b9364cca574c5b9c7ecfe73a3f';
const preToastMenuChecksum='55fa35e4f934a191ca97b1d6f8f0e1f1eece4fd7a8097a7bb846bedcd50817d4';
const legacyMenuChecksums=new Set([
 originalMenuChecksum,
 'de8ae2ce9cf2f02139aa5eeb19806bd533b4143434b62dc4342199f8cdff8aaf'
]);
const retiredSandwichCategoryId='cat-14';
const movedToastId='cat-21-item-07';
const removedToastIds=new Set(['cat-21-item-01','cat-21-item-02']);

function applyMenuRevision(previous:Menu):Menu{
 const needsLegacyUpdates=legacyMenuChecksums.has(previous.sourceSha256);
 const categories=initialMenu.categories.map(source=>{
  const saved=previous.categories.find(category=>category.id===source.id);
  return saved?{...saved,sourceLine:source.sourceLine}:source;
 });
 const products=initialMenu.products.map(source=>{
  const saved=previous.products.find(product=>product.id===source.id);
  if(!saved)return source;
  const updateDessertPrice=previous.sourceSha256===originalMenuChecksum&&source.sourceCategoryName==='Tatlılar';
  const updatePrice=updateDessertPrice||(needsLegacyUpdates&&(source.sourceCategoryName==='Nargileler'||source.id==='cat-11-item-12'));
  const price=updatePrice?source.price:saved.price;
  const isMovedToast=source.id===movedToastId;
  const name=isMovedToast||(needsLegacyUpdates&&source.id==='cat-24-item-03')?source.name:saved.name;
  const description=needsLegacyUpdates&&source.sourceCategoryName==='Soslu Tavuklar'
   ?saved.description.replace(/(?:jülyen|jülien) tavuk\b/giu,'tavuk göğsü')
   :saved.description;
  const categoryId=isMovedToast||saved.categoryId===retiredSandwichCategoryId?source.categoryId:saved.categoryId;
  return {...source,name,description,price,categoryId,sortOrder:isMovedToast?source.sortOrder:saved.sortOrder};
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
  if(menu.sourceSha256!==preToastMenuChecksum&&!legacyMenuChecksums.has(menu.sourceSha256))return {menu,revision:row.revision,updatedAt:row.updated_at};
  const updated=applyMenuRevision(menu);
  validateMenu(updated);
  const changes=changesBetween(menu,updated);
  if(legacyMenuChecksums.has(menu.sourceSha256))changes.push({label:'Menü yapısı',field:'category',before:'Sandviçler',after:'Waffle ve Red Bull Kokteyl'});
  for(const product of menu.products.filter(product=>removedToastIds.has(product.id))){
   changes.push({label:product.name,field:'product',before:product.name,after:'(kaldırıldı)'});
  }
  const result=await writeRevision(updated,row.revision,'menu-source-revision-2026-11-09',changes);
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
