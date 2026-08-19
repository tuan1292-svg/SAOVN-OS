import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, getDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

for(const id of ['WORK.TASK','WORK.CHECKLIST','WORK.COMMENTS','WORK.MENTIONS','WORK.ANALYTICS']) {
}

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel={BACKLOG:'Backlog',TODO:'Todo',IN_PROGRESS:'Đang thực hiện',REVIEW:'Review',DONE:'Hoàn thành'};
const priorityLabel={LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao',URGENT:'Khẩn cấp'};
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const people=new Map();

async function loadDirectoryLinks(){
  try{
    const snap=await getDocs(collection(db,'identities'));
    snap.forEach(s=>{
      const d=s.data()||{};
      const name=d.fullName||d.displayName||d.name||d.email||s.id;
      const person={id:s.id,name};
      people.set(norm(name),person);
      if(d.email)people.set(norm(d.email),person);
    });
    enhanceDirectoryLinks(document);
  }catch(error){console.warn('Work identity directory fallback:',error?.code||error);}
}

function enhanceDirectoryLinks(root){
  root.querySelectorAll?.('.assignee,.kanban-assignee').forEach(el=>{
    if(el.querySelector('[data-directory-profile]'))return;
    const parts=(el.textContent||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(!parts.length)return;
    el.innerHTML=parts.map(part=>{
      const clean=part.replace(/\s+·\s+.*/,'').trim();
      const person=people.get(norm(clean));
      return person?`<a class="work-member-link" data-directory-profile="1" href="member-profile.html?id=${encodeURIComponent(person.id)}">${esc(person.name)}</a>`:esc(part);
    }).join(', ');
  });
  root.querySelectorAll?.('.analytics-person a').forEach(a=>{
    const person=people.get(norm(a.textContent));
    if(person){a.href=`member-profile.html?id=${encodeURIComponent(person.id)}`;a.dataset.directoryProfile='1';}
  });
}

const directoryObserver=new MutationObserver(()=>enhanceDirectoryLinks(document));
if(document.body)directoryObserver.observe(document.body,{childList:true,subtree:true});
loadDirectoryLinks();

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  try{
    const membership=await getDoc(doc(db,'memberships',`mem_${user.uid}_org_saovn_01`));
    const roles=membership.exists()?membership.data()?.roles||{}:{};
    const all=[...(Array.isArray(roles.system)?roles.system:[]),...(Array.isArray(roles.organization)?roles.organization:[])].map(v=>String(v).toLowerCase());
    if(all.some(v=>v.includes('admin')))return;

    const tasks=new Map();
    const queries=[
      query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid)),
      query(collection(db,'workTasks'),where('assigneeId','==',user.uid)),
      query(collection(db,'workTasks'),where('createdBy','==',user.uid))
    ];
    for(const q of queries){try{const snap=await getDocs(q);snap.docs.forEach(d=>tasks.set(d.id,{id:d.id,...d.data()}));}catch(e){console.warn('Member Work fallback query skipped:',e?.code||e);}}
    if(!tasks.size){
      const sync=$('syncState');
      if(sync){sync.innerHTML='<i></i> Firebase · Đã kết nối';sync.title='Không có công việc trong phạm vi cá nhân hoặc query phụ bị từ chối.';}
      return;
    }

    const list=[...tasks.values()].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const total=$('totalCount'),progress=$('progressCount'),done=$('doneCount'),overdue=$('overdueCount'),result=$('resultCount'),taskList=$('taskList');
    const today=new Date().toISOString().slice(0,10);
    total&&(total.textContent=list.length);
    progress&&(progress.textContent=list.filter(t=>t.status==='IN_PROGRESS').length);
    done&&(done.textContent=list.filter(t=>t.status==='DONE').length);
    overdue&&(overdue.textContent=list.filter(t=>t.dueDate&&t.dueDate<today&&t.status!=='DONE').length);
    result&&(result.textContent=`${list.length} công việc`);
    if(taskList){
      taskList.innerHTML=list.map(t=>`<div class="task-row" data-member-fallback-task="${esc(t.id)}"><div class="task-main"><i class="task-dot"></i><div><strong>${esc(t.title||'Không tên')}</strong><small>${esc(t.description||'Chưa có mô tả')}</small></div></div><span class="status ${esc(t.status||'TODO')}">${esc(statusLabel[t.status]||'Todo')}</span><span class="priority ${esc(t.priority||'MEDIUM')}">${esc(priorityLabel[t.priority]||'Trung bình')}</span><span class="assignee">${esc(t.assignee||'Bạn')}</span><span class="due">${esc(t.dueDate||'Không deadline')}</span></div>`).join('');
    }
    const sync=$('syncState');
    if(sync)sync.innerHTML='<i></i> Firebase · Đã kết nối';
  }catch(error){console.warn('Member Work fallback error:',error?.code||error);}
});
