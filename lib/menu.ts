import initial from '../data/initial-menu.json';
export type Category={id:string;name:string;description:string;sortOrder:number;sourceName:string;sourceLine:number};
export type Product={id:string;categoryId:string;name:string;description:string;price:number|null;sortOrder:number;sourceCategoryId:string;sourceCategoryName:string;sourceLine:number};
export type Menu={schemaVersion:number;sourceTitle:string;sourceSha256:string;categories:Category[];products:Product[]};
export type MenuState={menu:Menu;revision:number;updatedAt:string};
export const initialMenu=initial as Menu;
export const ordered=<T extends {sortOrder:number}>(items:T[])=>[...items].sort((a,b)=>a.sortOrder-b.sortOrder);
// Turkish case mapping first; accent folding also supports ASCII keyboards.
export const normalizeSearch=(value:string)=>value.normalize('NFC').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu,'').replace(/ı/g,'i').trim();
const priceFormatter=new Intl.NumberFormat('tr-TR',{minimumFractionDigits:0,maximumFractionDigits:2});
export const formatPrice=(price:number|null)=>price===null?'':`${priceFormatter.format(price)} TL`;
export type Change={label:string;field:string;before:string;after:string};
export function changesBetween(before:Menu,after:Menu):Change[]{
 const result:Change[]=[];
 for(const kind of ['categories','products'] as const)for(const item of after[kind]){
  const previous=before[kind].find(p=>p.id===item.id);if(!previous)continue;
  for(const field of kind==='products'?['name','description','price','sortOrder','categoryId']:['name','description','sortOrder']){
   const a=(previous as unknown as Record<string,unknown>)[field],b=(item as unknown as Record<string,unknown>)[field];
   if(a!==b)result.push({label:previous.name,field,before:a===null?'(boş)':String(a),after:b===null?'(boş)':String(b)});
  }
 }return result;
}
export function validateMenu(input:unknown):asserts input is Menu{
 const m=input as Menu;
 if(!m||m.schemaVersion!==1||m.sourceTitle!==initialMenu.sourceTitle||m.sourceSha256!==initialMenu.sourceSha256||!Array.isArray(m.categories)||!Array.isArray(m.products))throw new Error('Menü yapısı geçersiz.');
 if(m.categories.length!==23||m.products.length!==158)throw new Error('Kategori veya ürün sayısı değiştirilemez.');
 const text=(s:unknown,max:number,empty=false)=>typeof s==='string'&&s.length<=max&&(empty||s.trim().length>0);
 const sort=(s:unknown)=>Number.isInteger(s)&&Number(s)>=0&&Number(s)<=100000;
 for(const kind of ['categories','products'] as const){
  if(new Set(m[kind].map(p=>p.id)).size!==m[kind].length)throw new Error('Tekrarlanan kimlik.');
  for(const item of m[kind]){const source=initialMenu[kind].find(p=>p.id===item.id);
   if(!source||!text(item.name,160)||!text(item.description,2000,true)||!sort(item.sortOrder)||source.sourceLine!==item.sourceLine)throw new Error('Ürün veya kategori alanlarını kontrol edin.');
   if(kind==='categories'&&(item as Category).sourceName!==(source as Category).sourceName)throw new Error('Kaynak kategori bilgisi değiştirilemez.');
  }
 }
 for(const p of m.products){const source=initialMenu.products.find(s=>s.id===p.id)!;
  if(!m.categories.some(c=>c.id===p.categoryId)||p.sourceCategoryId!==source.sourceCategoryId||p.sourceCategoryName!==source.sourceCategoryName)throw new Error('Kaynak izlenebilirliği korunmalıdır.');
  if(p.price!==null&&(typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0||p.price>100000||Math.abs(p.price*100-Math.round(p.price*100))>0.000001))throw new Error('Fiyat en fazla iki ondalıklı bir TL değeri veya boş olmalı.');
 }
}
