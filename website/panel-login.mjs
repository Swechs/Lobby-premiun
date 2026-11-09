const form=document.querySelector('#login-form');
const setup=form.dataset.mode==='setup';
const code=setup?new URLSearchParams(location.hash.slice(1)).get('kurulum'):null;
if(location.hash)history.replaceState(null,'',location.pathname+location.search);

form.addEventListener('submit',async event=>{
 event.preventDefault();
 const message=document.querySelector('#login-error');
 const password=document.querySelector('#password').value;
 const button=form.querySelector('button');
 message.textContent='';
 button.disabled=true;
 try{
  if(setup&&!code)throw new Error('Size verilen kurulum bağlantısını yeniden açın.');
  if(setup&&document.querySelector('#confirm-password').value!==password)throw new Error('Parolalar eşleşmiyor.');
  const response=await fetch(setup?'/auth/setup':'/auth/login',{
   method:'POST',
   headers:{'Content-Type':'application/json','X-Menu-Action':'save'},
   body:JSON.stringify(setup?{code,password}:{password})
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error);
  location.assign('/admin');
 }catch(error){
  message.textContent=error.message;
 }finally{
  button.disabled=false;
 }
});
