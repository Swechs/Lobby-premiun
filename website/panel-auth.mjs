import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const deriveKey=promisify(scrypt);
const authKey='lobby/admin.json';
const sessionSeconds=8*60*60;
const attemptWindow=10*60*1000;
const cookieName='__Host-lobby-admin';
const sha=value=>createHash('sha256').update(value).digest('hex');
const token=()=>randomBytes(32).toString('hex');
const equal=(left,right)=>typeof right==='string'&&left.length===right.length&&
 timingSafeEqual(Buffer.from(left,'hex'),Buffer.from(right,'hex'));

export function sessionCookie(value,maxAge=sessionSeconds){
 return `${cookieName}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function sessionKey(request){
 const value=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-lobby-admin=([a-f0-9]{64})(?:;|$)/)?.[1];
 return value?sha(value):null;
}

export function hasSession(request,record){
 const key=sessionKey(request);
 return key!==null&&Number(record?.data.sessions[key])>Date.now();
}

export function createAdminAuth(store,setupHash){
 const read=()=>store.read(authKey);
 return {
  read,
  async setup(code,password){
   if(!/^[a-f0-9]{64}$/.test(setupHash??'')||typeof code!=='string'||code.length!==64||!equal(sha(code),setupHash)){
    return {status:403,error:'Kurulum bağlantısı geçersiz.'};
   }
   if(typeof password!=='string'||password.length<12||password.length>128||!password.trim()){
    return {status:400,error:'Parola 12–128 karakter olmalı.'};
   }
   if(await read())return {status:409,error:'Yönetim paneli daha önce kuruldu.'};
   const salt=token(),hash=(await deriveKey(password,salt,64)).toString('hex');
   const data={salt,hash,sessions:{},attempts:{}};
   if(!await store.write(authKey,data,null))return {status:409,error:'Yönetim paneli daha önce kuruldu.'};
   return {status:200};
  },
  async login(ip,password){
   if(typeof password!=='string'||password.length<12||password.length>128){
    return {status:401,error:'Parola doğrulanamadı.'};
   }
   const ipKey=sha(ip);
   for(let retry=0;retry<3;retry++){
    const record=await read();
    if(!record)return {status:503,error:'Önce yönetici kurulumu yapılmalı.'};
    const data=record.data,now=Date.now();
    data.attempts=Object.fromEntries(Object.entries(data.attempts).filter(([,a])=>a.until>now));
    const attempt=data.attempts[ipKey]??{count:0,until:now+attemptWindow};
    if(attempt.count>=8)return {status:429,error:'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.'};
    if(!data.attempts[ipKey]&&Object.keys(data.attempts).length>=1000){
     return {status:429,error:'Çok fazla giriş denemesi yapıldı. Birkaç dakika sonra tekrar deneyin.'};
    }
    const derived=(await deriveKey(password,data.salt,64)).toString('hex');
    if(!equal(derived,data.hash)){
     data.attempts[ipKey]={...attempt,count:attempt.count+1};
     if(await store.write(authKey,data,record.etag))return {status:401,error:'Parola doğrulanamadı.'};
     continue;
    }
    delete data.attempts[ipKey];
    data.sessions=Object.fromEntries(Object.entries(data.sessions).filter(([,until])=>until>now).slice(-99));
    const value=token();
    data.sessions[sha(value)]=now+sessionSeconds*1000;
    if(await store.write(authKey,data,record.etag))return {status:200,session:value};
   }
   return {status:409,error:'Oturum değişti. Tekrar deneyin.'};
  },
  async logout(request){
   const key=sessionKey(request);
   if(!key)return true;
   for(let retry=0;retry<3;retry++){
    const record=await read();
    if(!record?.data.sessions[key])return true;
    delete record.data.sessions[key];
    if(await store.write(authKey,record.data,record.etag))return true;
   }
   return false;
  }
 };
}
