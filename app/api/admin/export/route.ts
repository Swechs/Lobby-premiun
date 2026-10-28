import {getAdmin} from '../../../../lib/admin-auth';
import {readMenu} from '../../../../lib/store';
import {initialMenu} from '../../../../lib/menu';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await getAdmin())return Response.json({error:'Yetkisiz işlem.'},{status:403});const initial=new URL(request.url).searchParams.get('type')==='initial';return new Response(JSON.stringify(initial?{menu:initialMenu,revision:1}:await readMenu(),null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="lobby-menu-${initial?'initial':'current'}.json"`,'Cache-Control':'no-store'}});}
