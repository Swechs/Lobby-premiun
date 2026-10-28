import {readMenu} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await readMenu(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Menü şu anda yüklenemiyor. Lütfen yeniden deneyin.'},{status:503});}}
