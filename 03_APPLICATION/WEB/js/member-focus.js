const params=new URLSearchParams(location.search);
const targetId=params.get('memberId');
const targetName=params.get('memberName');
if(targetId||targetName){
  const open=()=>{const rows=[...document.querySelectorAll('#memberList .member-row')];const row=rows.find(r=>targetId?r.dataset.memberId===targetId:(r.querySelector('strong')?.textContent||'').trim()===targetName);if(row){row.click();return true}return false};
  let tries=0;const timer=setInterval(()=>{tries++;if(open()||tries>40)clearInterval(timer)},250);
}