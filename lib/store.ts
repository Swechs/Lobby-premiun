import {env} from 'cloudflare:workers';
import {initialMenu,changesBetween,type Menu,type MenuState} from './menu';
export async function readMenu():Promise<MenuState>{
 if(!env.DB)throw new Error('Kalıcı menü veritabanı bağlanmamış.');
 await env.DB.prepare('INSERT OR IGNORE INTO menu_state (id,content,revision,updated_at,last_mutation) VALUES (?,?,?,?,?)').bind('main',JSON.stringify(initialMenu),1,new Date().toISOString(),'initial-import').run();
 const row=await env.DB.prepare('SELECT content,revision,updated_at FROM menu_state WHERE id=?').bind('main').first<{content:string;revision:number;updated_at:string}>();
 if(!row)throw new Error('Menü okunamadı.');return {menu:JSON.parse(row.content),revision:row.revision,updatedAt:row.updated_at};
}
export async function saveMenu(menu:Menu,revision:number,actorId:string){
 const current=await readMenu();if(current.revision!==revision)throw new Error('CONFLICT');
 const changes=changesBetween(current.menu,menu);if(!changes.length)return current;
 const id=crypto.randomUUID(),updatedAt=new Date().toISOString();
 const result=await env.DB!.batch([
  env.DB!.prepare('UPDATE menu_state SET content=?,revision=revision+1,updated_at=?,last_mutation=? WHERE id=? AND revision=?').bind(JSON.stringify(menu),updatedAt,id,'main',revision),
  env.DB!.prepare('INSERT INTO menu_audit (id,revision,actor_id,changes,created_at) SELECT ?,revision,?,?,? FROM menu_state WHERE id=? AND last_mutation=?').bind(id,actorId,JSON.stringify(changes),updatedAt,'main',id)
 ]);
 if(result[0].meta.changes!==1)throw new Error('CONFLICT');return {menu,revision:revision+1,updatedAt};
}
