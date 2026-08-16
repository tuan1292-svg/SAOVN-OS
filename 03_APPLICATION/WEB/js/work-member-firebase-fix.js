import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, getDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel={BACKLOG:'Backlog',TODO:'Todo',IN_PROGRESS:'Đang thực hiện',REVIEW:'Review',DONE:'Hoàn thành'};
const priorityLabel={LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao',URGENT:'Khẩn cấp'};

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  // This is a member-only fallback. Admin Work is left to work-v3.js.
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

// Work displays people by name only. Job titles remain available in profile data,
// but are not appended to names in assignee lists, task rows, comments or mentions.
function cleanMemberLabels(root=document){
  root.querySelectorAll('.assignee-person small, .comment-position, .mention-suggestions small').forEach(el=>el.remove());
  root.querySelectorAll('.assignee, .kanban-assignee').forEach(el=>{
    const text=String(el.textContent||'').trim();
    if(!text)return;
    el.textContent=text.split(',').map(part=>part.split(' · ')[0].trim()).filter(Boolean).join(', ');
  });
}

const memberLabelObserver=new MutationObserver(()=>cleanMemberLabels(document));
if(document.body)memberLabelObserver.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>cleanMemberLabels(document),{once:true});
else cleanMemberLabels(document);
