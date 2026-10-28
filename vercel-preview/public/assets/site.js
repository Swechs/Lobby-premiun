(()=>{
const header=document.getElementById('site-header'),navigation=document.getElementById('mobile-navigation');let queued=false;
const sync=()=>{if(header)header.dataset.scrolled=String(window.scrollY>30);queued=false;};
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(sync);}},{passive:true});sync();
if(navigation){navigation.addEventListener('click',event=>{if(event.target.closest('a'))navigation.open=false;});document.addEventListener('click',event=>{if(navigation.open&&!navigation.contains(event.target))navigation.open=false;});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.open){navigation.open=false;navigation.querySelector('summary').focus();}});}
const list=document.querySelector('.selection-tabs');if(!list)return;
const tabs=[...list.querySelectorAll('[role=tab]')],panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
if(!tabs.length||panels.some(panel=>!panel))return;
const select=(index,focus=false)=>{tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});if(focus)tabs[index].focus();};
list.hidden=false;panels.forEach((panel,i)=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tabs[i].id);});const initialTab=tabs.findIndex(tab=>tab.id==='tab-cat-15');select(initialTab<0?0:initialTab);
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next,true);});});
})();