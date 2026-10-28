import {getAdmin,validWriteOrigin} from '../../../../lib/admin-auth';
import {validateMenu} from '../../../../lib/menu';
import {readMenu,saveMenu} from '../../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){if(!await getAdmin())return Response.json({error:'Yetkili yönetici girişi gerekli.'},{status:403});return Response.json(await readMenu(),{headers:{'Cache-Control':'no-store'}});}
export async function PUT(request:Request){
 const admin=await getAdmin();if(!admin)return Response.json({error:'Yetkili yönetici girişi gerekli.'},{status:403});
 if(!validWriteOrigin(request))return Response.json({error:'İstek kaynağı doğrulanamadı.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>250000)return Response.json({error:'İstek çok büyük.'},{status:413});
 try{const raw=await request.text();if(raw.length>250000)return Response.json({error:'İstek çok büyük.'},{status:413});const body=JSON.parse(raw);
  if(!Number.isInteger(body.revision)||body.revision<1)throw new Error('Sürüm geçersiz.');validateMenu(body.menu);
  return Response.json(await saveMenu(body.menu,body.revision,admin.userId),{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'Kaydetme başarısız.';return Response.json({error:message==='CONFLICT'?'Menü başka bir oturumda değişti. Güncel veriyi yeniden yükleyin.':message},{status:message==='CONFLICT'?409:400});}
}
