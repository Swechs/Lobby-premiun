import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {stripTypeScriptTypes} from 'node:module';

execFileSync(process.execPath,['scripts/build-website.mjs','--live-menu'],{stdio:'inherit'});
const output=path.resolve('.sites-runtime/vercel-panel');
function write(name,content){
 const target=path.join(output,name);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,content);
}
function copy(source,target=source){write(target,fs.readFileSync(source));}

copy('website/panel-api.mjs','api/lobby.mjs');
for(const name of ['panel.mjs','panel-auth.mjs','render.mjs'])copy('website/'+name);
copy('standalone/ui.mjs');
for(const name of ['ui.mjs','admin-client.mjs','menu-client.mjs'])copy('standalone/'+name,'public/'+name);
copy('website/panel-login.mjs','public/panel-login.mjs');
copy('app/globals.css','public/style.css');
copy('public/favicon.svg','public/favicon.svg');
copy('vercel-preview/public/404.html','public/404.html');
copy('vercel-preview/public/menü.html','public/menü.html');
fs.cpSync('website/assets',path.join(output,'public/assets'),{recursive:true});

const menu=JSON.parse(fs.readFileSync('data/initial-menu.json','utf8'));
const shared=fs.readFileSync('lib/menu.ts','utf8').replace("import initial from '../data/initial-menu.json';",'const initial='+JSON.stringify(menu)+';');
write('public/shared.mjs',stripTypeScriptTypes(shared));
write('package.json',JSON.stringify({private:true,type:'module',engines:{node:'24.x'},dependencies:{'@vercel/blob':'^2.8.2'}},null,2)+'\n');
const config=JSON.parse(fs.readFileSync('vercel-preview/vercel.json','utf8'));
config.redirects[0].destination='/men%C3%BC';
config.rewrites=[
 ['/', 'home'], ['/men%C3%BC', 'menu'], ['/menü', 'menu'], ['/admin', 'admin'],
 ['/api/menu', 'public-menu'], ['/api/admin/menu', 'edit-menu'], ['/api/admin/export', 'export'],
 ['/auth/setup', 'setup'], ['/auth/login', 'login'], ['/auth/logout', 'logout']
].map(([source,route])=>({source,destination:'/api/lobby?lobbyRoute='+route}));
write('vercel.json',JSON.stringify(config,null,2)+'\n');
console.log(output);
