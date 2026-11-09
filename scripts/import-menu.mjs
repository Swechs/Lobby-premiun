import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const toastIds=new Map([
 ['Sucuklu Tost','cat-21-item-03'],
 ['Bazlama Karışık Tost','cat-21-item-04'],
 ['Bazlama Kaşarlı Tost','cat-21-item-05'],
 ['Bazlama Sucuklu Tost','cat-21-item-06']
]);
export function parseMenu(text) {
 const categories=[],products=[];
 const addedCategoryIds=new Map([['Waffle','cat-25'],['Red Bull Kokteyl','cat-26']]);
 let category=null,nextCategoryId=1;
 for(const [index,raw] of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()) {
  if(raw.startsWith('## ')) {
   const name=raw.slice(3);
   category=null;
   if(/^(Doğrulama ve kaynak notları|Kategori bazında ürün sayımı)$/.test(name))continue;
   // Keep the old sandwich ID retired so existing category links keep their meaning.
   if(nextCategoryId===14)nextCategoryId++;
   const id=addedCategoryIds.get(name)??`cat-${String(nextCategoryId++).padStart(2,'0')}`;
   category={id,name,description:'',sortOrder:categories.length,sourceName:name,sourceLine:index+1};
   categories.push(category);
  } else if(category && raw.startsWith('| ') && !raw.startsWith('| Ürün |') && !raw.startsWith('| ---')) {
   const cells=raw.split('|').slice(1,-1).map(s=>s.trim()); assert.equal(cells.length,3);
   const [name,priceText,description]=cells; assert.ok(!priceText || /^\d+(?:[.,]\d{1,2})? TL$/.test(priceText));
   const order=products.filter(p=>p.categoryId===category.id).length;
   // Preserve existing product IDs after removing two toasts and moving Tavuk Bazlama.
   const existingId=category.id==='cat-21'?toastIds.get(name):category.id==='cat-23'&&name==='Tavuk Bazlama'?'cat-21-item-07':undefined;
   const id=existingId??`${category.id}-item-${String(order+1).padStart(2,'0')}`;
   products.push({id,categoryId:category.id,name,description,price:priceText?Number(priceText.replace(' TL','').replace(',','.')):null,sortOrder:order,sourceCategoryId:category.id,sourceCategoryName:category.name,sourceLine:index+1});
  } else if(category && raw.trim() && !raw.startsWith('|'))category.description+=(category.description?'\n':'')+raw;
 }
 return {schemaVersion:1,sourceTitle:text.replace(/^\uFEFF/,'').split(/\r?\n/)[0].slice(2),sourceSha256:crypto.createHash('sha256').update(text).digest('hex'),categories,products};
}
if(process.argv[1]?.endsWith('import-menu.mjs')) {
 const menu=parseMenu(fs.readFileSync(process.argv[2]||'source/LOBBY_PREMIUM_ANA_MENU.md','utf8'));
 const counts={categories:menu.categories.length,products:menu.products.length,nullPrices:menu.products.filter(p=>p.price===null).length};
 assert.deepEqual(counts,{categories:25,products:173,nullPrices:4});assert.ok(!menu.products.some(p=>/burger|hemingway/i.test(p.name)));
 fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/initial-menu.json',JSON.stringify(menu,null,2)+'\n');console.log(JSON.stringify(counts));
}
