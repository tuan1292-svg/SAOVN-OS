const teamList=document.getElementById('teamList');
if(teamList){
 const wire=()=>teamList.querySelectorAll('.team-members > span').forEach(span=>{
  if(span.dataset.memberLink==='1')return;
  const name=(span.querySelector('b')?.textContent||'').trim();
  if(!name)return;
  span.dataset.memberLink='1';span.classList.add('member-link');span.tabIndex=0;span.setAttribute('role','button');
  const go=()=>location.href=`members.html?memberName=${encodeURIComponent(name)}`;
  span.addEventListener('click',go);span.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
 });
 wire();new MutationObserver(wire).observe(teamList,{childList:true,subtree:true});
}