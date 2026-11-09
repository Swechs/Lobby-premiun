import {BlobPreconditionFailedError,get,put} from '@vercel/blob';
import {changesBetween,initialMenu,validateMenu} from '../public/shared.mjs';
import {createPanelHandler} from '../website/panel.mjs';

const options={access:'private'};
const store={
 async read(pathname){
  const blob=await get(pathname,{...options,useCache:false});
  if(blob===null)return null;
  if(blob.statusCode!==200)throw new Error('Blob read failed');
  const data=await new Response(blob.stream).json();
  return {data,etag:blob.blob.etag};
 },
 async write(pathname,data,etag){
  const conditions=etag===null?{allowOverwrite:false}:{allowOverwrite:true,ifMatch:etag};
  try{
   await put(pathname,JSON.stringify(data),{...options,...conditions,contentType:'application/json'});
   return true;
  }catch(error){
   if(error instanceof BlobPreconditionFailedError)return false;
   if(etag===null&&await store.read(pathname))return false;
   throw error;
  }
 }
};

export default {
 fetch:createPanelHandler({
  store,initialMenu,validateMenu,changesBetween,
  setupHash:process.env.LOBBY_ADMIN_SETUP_SHA,
  siteOrigin:'https://lobby-premium-menu-preview.vercel.app'
 })
};
