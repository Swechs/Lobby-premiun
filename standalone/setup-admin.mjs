import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),dir=process.env.LOBBY_DATA_DIR||path.join(root,'.sites-runtime','standalone');
if(!process.stdin.isTTY)throw new Error('Parolayı etkileşimli terminalde belirleyin.');
async function ask(label){process.stdout.write(label);return await new Promise(resolve=>{let value='';process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');const onData=chunk=>{for(const c of chunk){if(c==='\u0003'){process.stdin.setRawMode(false);process.exit(130);}if(c==='\r'||c==='\n'){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value);return;}if(c==='\u007f'||c==='\b'){if(value){value=value.slice(0,-1);process.stdout.write('\b \b');}}else if(c>=' '){value+=c;process.stdout.write('*');}}};process.stdin.on('data',onData);});}
const password=await ask('Yeni yönetici parolası (en az 12 karakter): '),confirm=await ask('Parolayı tekrar girin: ');
if(password.length<12||password.length>256||password!==confirm)throw new Error('Parolalar aynı olmalı ve en az 12 karakter içermeli.');
const salt=crypto.randomBytes(32).toString('hex'),hash=crypto.scryptSync(password,salt,64).toString('hex');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'admin.json'),JSON.stringify({version:1,salt,hash}),{mode:0o600});console.log('Yönetici parolası kaydedildi. Düz metin parola saklanmadı.');
