import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
export function isAdminEmail(email:string,allowlist:string|undefined){return !!allowlist?.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());}
export async function getAdmin(){const user=await getChatGPTUser();return user&&isAdminEmail(user.email,env.ADMIN_EMAILS)?user:null;}
export function validWriteOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('x-menu-action')==='save'&&request.headers.get('content-type')?.startsWith('application/json');}
