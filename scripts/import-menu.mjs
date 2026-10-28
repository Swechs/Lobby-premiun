import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
export function parseMenu(text) {
 const categories=[],products=[]; let category=null;
 for(const [index,raw] of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()) {
  if(raw.startsWith('## ')) {
   const name=raw.slice(3);
   category=/^(Doğrulama ve kaynak notları|Kategori bazında ürün sayımı)$/.test(name)?null:{id:`cat-${String(categories.length+1).padStart(2,'0')}`,name,description:'',sortOrder:categories.length,sourceName:name,sourceLine:index+1};
   if(category)categories.push(category);
  } else if(category && raw.startsWith('| ') && !raw.startsWith('| Ürün |') && !raw.startsWith('| ---')) {
   const cells=raw.split('|').slice(1,-1).map(s=>s.trim()); assert.equal(cells.length,3);
   const [name,priceText,description]=cells; assert.ok(!priceText || /^\d+(?:[.,]\d{1,2})? TL$/.test(priceText));
   const order=products.filter(p=>p.categoryId===category.id).length;
   products.push({id:`${category.id}-item-${String(order+1).padStart(2,'0')}`,categoryId:category.id,name,description,price:priceText?Number(priceText.replace(' TL','').replace(',','.')):null,sortOrder:order,sourceCategoryId:category.id,sourceCategoryName:category.name,sourceLine:index+1});
  } else if(category && raw.trim() && !raw.startsWith('|'))category.description+=(category.description?'\n':'')+raw;
 }
 return {schemaVersion:1,sourceTitle:text.replace(/^\uFEFF/,'').split(/\r?\n/)[0].slice(2),sourceSha256:crypto.createHash('sha256').update(text).digest('hex'),categories,products};
}
if(process.argv[1]?.endsWith('import-menu.mjs')) {
 const menu=parseMenu(fs.readFileSync(process.argv[2]||'source/LOBBY_PREMIUM_ANA_MENU.md','utf8'));
 assert.equal(menu.categories.length,23);assert.equal(menu.products.length,158);assert.equal(menu.products.filter(p=>p.price===null).length,12);assert.ok(!menu.products.some(p=>/burger|hemingway/i.test(p.name)));
 fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/initial-menu.json',JSON.stringify(menu,null,2)+'\n');console.log(JSON.stringify({categories:23,products:158,nullPrices:12}));
}
