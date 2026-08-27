import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { getWorkScope, taskInScope, stampTaskScope } from './work-scope.js';

const $ = id => document.getElementById(id);
const STATUS = { BACKLOG:'Chờ xử lý', TODO:'Cần làm', IN_PROGRESS:'Đang thực hiện', REVIEW:'Chờ duyệt', DONE:'Hoàn thành' };
const PRIORITY = { LOW:'Thấp', MEDIUM:'Trung bình', HIGH:'Cao', URGENT:'Khẩn cấp' };
const POSITION = { INTERN:'Thực tập sinh', COLLABORATOR:'Cộng tác viên', STAFF:'Nhân viên', SPECIALIST:'Chuyên viên', SENIOR_SPECIALIST:'Chuyên viên cao cấp', TEAM_LEAD:'Trưởng nhóm', MANAGER:'Quản lý', DEPARTMENT_HEAD:'Trưởng phòng', DIRECTOR:'Giám đốc', FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO', OTHER:'Khác' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const positionLabel = value => POSITION[String(value || 'STAFF').toUpperCase()] || String(value || 'Nhân viên');
const dateLabel = value => value ? new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${String(value).slice(0,10)}T00:00:00`)) : 'Không deadline';

const el = {
  userName:$('userName'), topUserName:$('topUserName'), logout:$('logoutButton'), total:$('totalCount'), progress:$('progressCount'), done:$('doneCount'), overdue:$('overdueCount'), result:$('resultCount'), list:$('taskList'), kanban:$('kanbanBoard'), search:$('searchInput'), statusFilter:$('statusFilter'), priorityFilter:$('priorityFilter'), modal:$('taskModal'), form:$('taskForm'), id:$('taskId'), title:$('taskTitle'), desc:$('taskDescription'), assigneePicker:$('taskAssigneePicker'), assigneeToggle:$('taskAssigneeToggle'), assigneeMenu:$('taskAssigneeMenu'), assigneeOptions:$('taskAssigneeOptions'), assigneeCount:$('assigneeCount'), memberHint:$('memberHint'), due:$('taskDueDate'), status:$('taskStatus'), priority:$('taskPriority'), save:$('saveTaskBtn'), boardTitle:$('boardTitle'), analytics:$('memberAnalytics'), modalTitle:$('modalTitle')
};

let user = null;
let scope = null;
let tasks = [];
let members = [];
let selectedAssignees = new Set();
let view = 'list';
let activeDetailId = null;

function isAdmin(){ return scope?.type === 'ORGANIZATION'; }
function canManage(t){ return isAdmin() || taskInScope(t, scope) || assignedIds(t).has(user?.uid); }
function assignedIds(task){
  const ids = new Set();
  (Array.isArray(task?.assigneeIds) ? task.assigneeIds : []).forEach(id => id && ids.add(String(id)));
  if(task?.assigneeId) ids.add(String(task.assigneeId));
  (Array.isArray(task?.assignees) ? task.assignees : []).forEach(item => { const id = typeof item === 'string' ? item : item?.id || item?.uid || item?.userId; if(id) ids.add(String(id)); });
  return ids;
}
function normalizeAssignees(task){
  if(Array.isArray(task?.assignees) && task.assignees.length) return task.assignees;
  if(Array.isArray(task?.assigneeIds)) return task.assigneeIds.map(id => { const m = members.find(x => x.id === id); return m ? {id:m.id,name:m.name,position:positionLabel(m.position),department:m.department,team:m.team} : {id}; });
  if(task?.assigneeId) return [{id:task.assigneeId,name:task.assignee || '',position:task.assigneePosition || '',department:task.assigneeDepartment || ''}];
  return [];
}
function assigneeText(task){ const people = normalizeAssignees(task); return people.length ? people.map(x => `${x.name || 'Thành viên'}${x.position ? ` · ${x.position}` : ''}`).join(', ') : 'Chưa giao'; }
function taskDateMillis(value){ if(!value) return 0; if(typeof value.toMillis === 'function') return value.toMillis(); if(typeof value.toDate === 'function') return value.toDate().getTime(); const n = new Date(value).getTime(); return Number.isNaN(n) ? 0 : n; }
function today(){ return new Date().toISOString().slice(0,10); }

async function loadMembers(){
  let identities;
  try { identities = await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE'))); }
  catch { identities = await getDocs(collection(db,'identities')); }
  let memberships = new Map();
  try {
    const snap = await getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE')));
    snap.forEach(s => { const d=s.data()||{}; const uid=d.identityId||d.userId||d.uid||String(s.id).match(/^mem_(.+)_org_/)?.[1]; if(uid) memberships.set(uid,d); });
  } catch {}
  members = identities.docs.map(s => { const x=s.data()||{}, m=memberships.get(s.id)||{}; return { id:s.id, name:x.fullName||x.displayName||x.name||x.email||s.id, email:x.email||'', position:m.position||x.position||'STAFF', departmentId:m.departmentId||x.departmentId||'', department:m.department||x.department||'', teamId:m.teamId||x.teamId||'', team:m.team||x.team||'' }; });
  if(!members.some(m=>m.id===user.uid)){
    try { const own=await getDoc(doc(db,'identities',user.uid)); if(own.exists()){const x=own.data()||{};members.push({id:user.uid,name:x.fullName||x.displayName||user.displayName||user.email||'Bạn',email:x.email||user.email||'',position:x.position||'STAFF',departmentId:x.departmentId||'',department:x.department||'',teamId:x.teamId||'',team:x.team||''});} } catch {}
  }
}

function allowedMembers(){
  if(isAdmin()) return members;
  if(scope?.type?.startsWith('DEPARTMENT')) return members.filter(m => (scope.departmentId && m.departmentId===scope.departmentId) || (!scope.departmentId && scope.department && String(m.department).trim().toLowerCase()===String(scope.department).trim().toLowerCase()));
  if(scope?.type==='TEAM') return members.filter(m => (scope.teamId && m.teamId===scope.teamId) || (!scope.teamId && scope.team && String(m.team).trim().toLowerCase()===String(scope.team).trim().toLowerCase()));
  return members.filter(m => m.id===user.uid);
}

function renderAssigneePicker(){
  if(!el.assigneeOptions) return;
  const list=allowedMembers();
  el.assigneeOptions.innerHTML=list.length ? list.map(m=>`<label class="assignee-option"><input type="checkbox" value="${esc(m.id)}" ${selectedAssignees.has(m.id)?'checked':''}><span class="assignee-check"></span><span class="assignee-person"><strong>${esc(m.name)}</strong><small>${esc(positionLabel(m.position))}${m.department?` · ${esc(m.department)}`:''}${m.team?` · ${esc(m.team)}`:''}</small></span></label>`).join('') : '<div class="assignee-empty">Không có thành viên trong phạm vi này.</div>';
  el.assigneeOptions.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{input.checked?selectedAssignees.add(input.value):selectedAssignees.delete(input.value);updateAssigneeSummary();}));
  updateAssigneeSummary();
}
function updateAssigneeSummary(){ const n=allowedMembers().filter(m=>selectedAssignees.has(m.id)).length; if(el.assigneeCount)el.assigneeCount.textContent=n?`${n} người`:'Chưa giao'; if(el.memberHint)el.memberHint.textContent=n?`${n} người đang được chọn`:`${allowedMembers().length} thành viên có thể nhận công việc`; }
function setAssignees(ids){ const allowed=new Set(allowedMembers().map(m=>m.id)); selectedAssignees=new Set((ids||[]).map(String).filter(id=>allowed.has(id))); renderAssigneePicker(); }
function togglePicker(open){ el.assigneeMenu?.classList.toggle('open',open ?? !el.assigneeMenu.classList.contains('open')); }

async function getTasksForScope(){
  const map=new Map();
  const add=snap=>snap?.docs?.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));
  if(isAdmin()){
    try { add(await getDocs(collection(db,'workTasks'))); }
    catch { try { add(await getDocs(query(collection(db,'workTasks'),orderBy('createdAt','desc')))); } catch(e){ throw e; } }
  } else if(scope?.type?.startsWith('DEPARTMENT')){
    if(scope.departmentId){ try { add(await getDocs(query(collection(db,'workTasks'),where('departmentId','==',scope.departmentId)))); } catch(e){ console.warn('Work departmentId query:',e?.code||e); } }
    if(scope.department){ try { add(await getDocs(query(collection(db,'workTasks'),where('department','==',scope.department)))); } catch(e){ console.warn('Work department query:',e?.code||e); } }
    await addPersonalQueries(map);
  } else if(scope?.type==='TEAM'){
    if(scope.teamId){ try { add(await getDocs(query(collection(db,'workTasks'),where('teamId','==',scope.teamId)))); } catch(e){ console.warn('Work teamId query:',e?.code||e); } }
    if(scope.team){ try { add(await getDocs(query(collection(db,'workTasks'),where('team','==',scope.team)))); } catch(e){ console.warn('Work team query:',e?.code||e); } }
    await addPersonalQueries(map);
  } else {
    await addPersonalQueries(map);
  }
  return [...map.values()].filter(t=>taskInScope(t,scope)).sort((a,b)=>taskDateMillis(b.createdAt)-taskDateMillis(a.createdAt));
}
async function addPersonalQueries(map){
  const queries=[
    query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid)),
    query(collection(db,'workTasks'),where('assigneeId','==',user.uid)),
    query(collection(db,'workTasks'),where('createdBy','==',user.uid))
  ];
  for(const q of queries){ try { const snap=await getDocs(q); snap.forEach(d=>map.set(d.id,{id:d.id,...d.data()})); } catch(e){ console.warn('Work personal query skipped:',e?.code||e); } }
}

function filteredTasks(){ const q=el.search?.value.trim().toLowerCase()||''; return tasks.filter(t=>(!q||`${t.title||''} ${t.description||''} ${assigneeText(t)}`.toLowerCase().includes(q))&&(!el.statusFilter||el.statusFilter.value==='ALL'||t.status===el.statusFilter.value)&&(!el.priorityFilter||el.priorityFilter.value==='ALL'||t.priority===el.priorityFilter.value)); }
function renderStats(){ const d=today(); el.total.textContent=tasks.length; el.progress.textContent=tasks.filter(t=>t.status==='IN_PROGRESS').length; el.done.textContent=tasks.filter(t=>t.status==='DONE').length; el.overdue.textContent=tasks.filter(t=>t.dueDate&&String(t.dueDate).slice(0,10)<d&&t.status!=='DONE').length; }
function renderList(list){
  if(!list.length){ el.list.innerHTML=`<div class="empty"><div>▱</div><strong>${tasks.length?'Không tìm thấy công việc':'Chưa có công việc'}</strong><span>${tasks.length?'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.':'Tạo công việc đầu tiên để bắt đầu vận hành Work.'}</span><button class="outline-btn" data-action="create">＋ Tạo công việc</button></div>`; return; }
  el.list.innerHTML=`<div class="task-table-head"><span>CÔNG VIỆC</span><span>TRẠNG THÁI</span><span>ƯU TIÊN</span><span>NGƯỜI PHỤ TRÁCH</span><span>DEADLINE</span><span></span></div>${list.map(t=>{const overdue=t.dueDate&&String(t.dueDate).slice(0,10)<today()&&t.status!=='DONE';return `<div class="task-row" data-task="${esc(t.id)}"><div class="task-main"><i class="task-dot"></i><div><strong>${esc(t.title||'Không tên')}</strong><small>${esc(t.description||'Chưa có mô tả')}</small></div></div><span class="status ${esc(t.status||'TODO')}">${STATUS[t.status]||'Cần làm'}</span><span class="priority ${esc(t.priority||'MEDIUM')}">${PRIORITY[t.priority]||'Trung bình'}</span><span class="assignee" title="${esc(assigneeText(t))}">${esc(assigneeText(t))}</span><span class="due ${overdue?'overdue':''}">${dateLabel(t.dueDate)}</span><button class="row-menu" data-action="edit" data-id="${esc(t.id)}" title="Chỉnh sửa">⋮</button></div>`;}).join('')}`;
}
function renderKanban(list){ el.kanban.innerHTML=Object.entries(STATUS).map(([status,label])=>{const items=list.filter(t=>(t.status||'TODO')===status);return `<section class="kanban-col" data-status="${status}"><div class="kanban-col-head"><strong>${label}</strong><span>${items.length}</span></div><div class="kanban-items">${items.map(t=>`<article class="kanban-card" draggable="${canManage(t)}" data-task="${esc(t.id)}"><strong>${esc(t.title||'Không tên')}</strong><p>${esc(t.description||'Chưa có mô tả')}</p><div class="kanban-meta"><span>${esc(assigneeText(t))}</span><b class="kanban-priority ${esc(t.priority||'MEDIUM')}">${PRIORITY[t.priority]||'Trung bình'}</b></div><div class="kanban-meta"><span class="kanban-due">${dateLabel(t.dueDate)}</span><button class="row-menu" data-action="edit" data-id="${esc(t.id)}">⋮</button></div></article>`).join('')}</div></section>`;}).join(''); wireKanban(); }
function render(){ const list=filteredTasks(); renderStats(); el.result.textContent=`${list.length} công việc`; el.boardTitle.textContent=isAdmin()?'Danh sách công việc toàn workspace':`Công việc · ${scope?.label||'Phạm vi cá nhân'}`; if(view==='list'){el.list.style.display='block';el.kanban.classList.remove('active');renderList(list);}else{el.list.style.display='none';el.kanban.classList.add('active');renderKanban(list);} renderAnalytics(); }

function renderAnalytics(){
  if(!el.analytics)return;
  const visibleMembers=allowedMembers();
  const rows=visibleMembers.map(m=>{const assigned=tasks.filter(t=>assignedIds(t).has(m.id));const done=assigned.filter(t=>t.status==='DONE');const overdue=assigned.filter(t=>t.dueDate&&String(t.dueDate).slice(0,10)<today()&&t.status!=='DONE');const pct=assigned.length?Math.round(done.length/assigned.length*100):0;return{m,assigned,done,overdue,pct};}).filter(r=>r.assigned.length||r.m.id===user.uid).sort((a,b)=>b.pct-a.pct||b.assigned.length-a.assigned.length);
  el.analytics.innerHTML=`<div class="analytics-head"><div><span class="eyebrow">WORK / ANALYTICS</span><h2>Hiệu suất công việc</h2><p>Tỷ lệ hoàn thành được tính từ công việc đang nằm trong phạm vi hiện tại.</p></div><span class="analytics-scope">${isAdmin()?'Toàn hệ thống':'Theo phạm vi'}</span></div>${rows.length?`<div class="analytics-list">${rows.map(r=>`<article class="analytics-member"><div class="analytics-person"><strong>${esc(r.m.name)}</strong><small>${esc(positionLabel(r.m.position))}</small></div><div class="analytics-bar"><i style="width:${r.pct}%"></i></div><strong>${r.pct}%</strong><span>${r.done.length}/${r.assigned.length} hoàn thành · ${r.overdue.length} quá hạn</span></article>`).join('')}</div>`:'<div class="analytics-empty">Chưa có dữ liệu công việc để thống kê.</div>'}`;
}

function openCreate(){ el.form.reset(); el.id.value=''; el.modalTitle.textContent='Tạo công việc'; el.status.value='TODO'; el.priority.value='MEDIUM'; setAssignees(isAdmin()?[]:[user.uid]); el.modal.classList.add('open'); setTimeout(()=>el.title.focus(),0); }
function openEdit(task){ if(!task||!canManage(task))return; el.modalTitle.textContent='Chỉnh sửa công việc';el.id.value=task.id;el.title.value=task.title||'';el.desc.value=task.description||'';el.due.value=task.dueDate||'';el.status.value=task.status||'TODO';el.priority.value=task.priority||'MEDIUM';setAssignees(normalizeAssignees(task).map(x=>x.id).filter(Boolean));el.modal.classList.add('open');setTimeout(()=>el.title.focus(),0); }
function closeModal(){ el.modal.classList.remove('open');togglePicker(false); }

function detailHtml(task){ const people=normalizeAssignees(task); return `<div class="detail-summary"><div><label>TRẠNG THÁI</label><strong>${STATUS[task.status]||'Cần làm'}</strong></div><div><label>ƯU TIÊN</label><strong>${PRIORITY[task.priority]||'Trung bình'}</strong></div><div><label>DEADLINE</label><strong>${dateLabel(task.dueDate)}</strong></div><div><label>NGƯỜI PHỤ TRÁCH</label><strong>${esc(people.length?people.map(p=>p.name).join(', '):'Chưa giao')}</strong></div><div class="detail-description"><label>MÔ TẢ</label><p>${esc(task.description||'Chưa có mô tả')}</p></div></div><div class="detail-workspace"><section><div class="detail-section-head"><strong>Checklist</strong><span id="detailCheckProgress">Đang tải…</span></div><div class="detail-add"><input id="detailCheckInput" maxlength="160" placeholder="Thêm một mục checklist"><button data-detail-action="add-check">＋</button></div><div id="detailChecklist">Đang tải checklist…</div></section><section><div class="detail-section-head"><strong>Trao đổi</strong><span id="detailCommentCount">0</span></div><div id="detailComments">Đang tải trao đổi…</div><div class="detail-add comment"><textarea id="detailCommentInput" rows="2" maxlength="500" placeholder="Viết trao đổi về công việc..."></textarea><button data-detail-action="add-comment">Gửi</button></div></section></div>`; }
function ensureDetailModal(){ let m=$('workDetailModal'); if(m)return m; m=document.createElement('div');m.id='workDetailModal';m.className='detail-modal';m.innerHTML='<div class="detail-card glass"><div class="detail-head"><div><span class="eyebrow">WORK / TASK DETAIL</span><h2 id="detailTitle">Chi tiết công việc</h2><p id="detailMeta"></p></div><button class="close" data-detail-close>×</button></div><div id="detailBody"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-detail-close]'))m.classList.remove('open');});return m; }
async function openDetail(id){ const task=tasks.find(t=>t.id===id);if(!task)return;activeDetailId=id;const m=ensureDetailModal();$('detailTitle').textContent=task.title||'Chi tiết công việc';$('detailMeta').textContent=`${STATUS[task.status]||'Cần làm'} · ${PRIORITY[task.priority]||'Trung bình'} · ${dateLabel(task.dueDate)}`;$('detailBody').innerHTML=detailHtml(task);m.classList.add('open');await Promise.all([loadChecklist(id),loadComments(id)]); }
async function loadChecklist(id){ const box=$('detailChecklist'),progress=$('detailCheckProgress');try{const s=await getDocs(collection(db,'workTasks',id,'checklist'));const items=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>taskDateMillis(a.createdAt)-taskDateMillis(b.createdAt));const done=items.filter(x=>x.done).length;progress.textContent=`${done}/${items.length}`;box.innerHTML=items.length?items.map(x=>`<label class="check-item"><input type="checkbox" data-check-id="${esc(x.id)}" ${x.done?'checked':''}><span>${esc(x.text||'')}</span></label>`).join(''):'<span class="detail-muted">Chưa có mục checklist.</span>';box.querySelectorAll('[data-check-id]').forEach(i=>i.addEventListener('change',async()=>{try{await updateDoc(doc(db,'workTasks',id,'checklist',i.dataset.checkId),{done:i.checked,updatedBy:user.uid,updatedAt:serverTimestamp()});await loadChecklist(id);}catch(e){i.checked=!i.checked;alert('Không thể cập nhật checklist.');}}));}catch(e){progress.textContent='—';box.innerHTML='<span class="detail-muted">Checklist chưa khả dụng cho tài khoản này.</span>';}}
async function loadComments(id){const box=$('detailComments'),count=$('detailCommentCount');try{const s=await getDocs(collection(db,'workTasks',id,'comments'));const rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>taskDateMillis(a.createdAt)-taskDateMillis(b.createdAt));count.textContent=rows.length;box.innerHTML=rows.length?rows.map(x=>`<article class="detail-comment"><strong>${esc(x.authorName||'Thành viên')}</strong><small>${x.createdAt?.toDate?new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(x.createdAt.toDate()):'Vừa xong'}</small><p>${esc(x.text||'')}</p></article>`).join(''):'<span class="detail-muted">Chưa có trao đổi.</span>';}catch(e){count.textContent='—';box.innerHTML='<span class="detail-muted">Trao đổi chưa khả dụng cho tài khoản này.</span>';}}

async function moveTask(task,status){ if(!canManage(task)||task.status===status)return;try{await updateDoc(doc(db,'workTasks',task.id),{status,updatedBy:user.uid,updatedAt:serverTimestamp()});task.status=status;render();}catch(e){alert('Không thể cập nhật trạng thái của công việc.');}}
function wireKanban(){el.kanban.querySelectorAll('.kanban-card[draggable="true"]').forEach(card=>{card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',card.dataset.task);});});el.kanban.querySelectorAll('.kanban-col').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',async e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const task=tasks.find(t=>t.id===id);if(task)await moveTask(task,col.dataset.status);});});}

async function saveTask(event){ event.preventDefault(); if(el.save.disabled)return;el.save.disabled=true;el.save.textContent='Đang lưu…';try{const selected=allowedMembers().filter(m=>selectedAssignees.has(m.id));const assignees=selected.map(m=>({id:m.id,name:m.name,position:positionLabel(m.position),department:m.department||'',team:m.team||''}));const first=assignees[0]||null;let data={title:el.title.value.trim(),description:el.desc.value.trim(),assigneeIds:assignees.map(a=>a.id),assignees,assignee:first?.name||'',assigneeId:first?.id||null,assigneePosition:first?.position||null,assigneeDepartment:first?.department||'',dueDate:el.due.value||null,status:el.status.value,priority:el.priority.value,updatedBy:user.uid,updatedAt:serverTimestamp()};data=stampTaskScope(data,scope);if(!data.title)throw new Error('Vui lòng nhập tên công việc.');if(el.id.value){const old=tasks.find(t=>t.id===el.id.value);if(!old||!canManage(old))throw new Error('Bạn không có quyền chỉnh sửa công việc này.');await updateDoc(doc(db,'workTasks',el.id.value),data);}else{await addDoc(collection(db,'workTasks'),{...data,createdBy:user.uid,createdAt:serverTimestamp()});}closeModal();tasks=await getTasksForScope();render();}catch(e){console.error('[WORK] save failed',e);alert(e?.message||'Không thể lưu công việc.');}finally{el.save.disabled=false;el.save.textContent='Lưu công việc';}}

function installStyles(){ if($('workScreenStyles'))return;const s=document.createElement('style');s.id='workScreenStyles';s.textContent=`.task-table-head{display:grid;grid-template-columns:minmax(260px,1fr) 132px 105px minmax(130px,180px) 112px 38px;padding:10px 12px;border-bottom:1px solid rgba(155,190,235,.12);color:#65758d;font-size:8px;letter-spacing:.08em}.detail-modal{position:fixed;inset:0;z-index:5000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,7,15,.68);backdrop-filter:blur(12px)}.detail-modal.open{display:flex}.detail-card{width:min(1000px,94vw);max-height:90vh;overflow:auto;border-radius:18px;padding:24px}.detail-head{display:flex;justify-content:space-between;gap:16px}.detail-head h2{margin:5px 0;font-size:22px}.detail-head p{margin:0;color:#8091a9;font-size:9px}.detail-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}.detail-summary>div{padding:14px;border:1px solid rgba(155,190,235,.12);border-radius:12px;background:#ffffff04}.detail-summary label,.detail-section-head{font-size:8px;letter-spacing:.08em;color:#71819a}.detail-summary strong{display:block;margin-top:7px;color:#eaf2ff;font-size:10px}.detail-description{grid-column:1/-1}.detail-description p{margin:7px 0 0;color:#aebbd0;font-size:10px;line-height:1.6;white-space:pre-wrap}.detail-workspace{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.detail-workspace>section{padding:15px;border:1px solid rgba(155,190,235,.12);border-radius:13px;background:#ffffff03}.detail-section-head{display:flex;justify-content:space-between;align-items:center;color:#d8e4f5}.detail-add{display:flex;gap:7px;margin:12px 0}.detail-add input,.detail-add textarea{width:100%;box-sizing:border-box;border:1px solid rgba(155,190,235,.14);border-radius:9px;background:#071322;color:#eaf2ff;padding:9px;font:10px inherit;resize:vertical}.detail-add button{border:0;border-radius:9px;background:#1673ef;color:white;padding:0 13px;font-weight:800}.check-item{display:flex;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #ffffff10;color:#b8c5d7;font-size:9px}.check-item input{accent-color:#3b93ff}.detail-comment{padding:9px 0;border-bottom:1px solid #ffffff10}.detail-comment strong{font-size:9px;color:#dbe7f7}.detail-comment small{margin-left:7px;color:#66768e;font-size:7px}.detail-comment p{margin:5px 0 0;color:#a7b4c7;font-size:9px;line-height:1.5;white-space:pre-wrap}.detail-muted{display:block;padding:14px 0;color:#697991;font-size:9px}.analytics-list{display:grid;grid-template-columns:1fr 1fr;gap:10px}.analytics-member{display:grid;grid-template-columns:190px 1fr 42px;gap:10px;align-items:center;padding:13px;border:1px solid rgba(155,190,235,.12);border-radius:12px;background:#ffffff03}.analytics-person strong{display:block;color:#dbe7f7;font-size:9px}.analytics-person small{display:block;margin-top:3px;color:#6f8098;font-size:7px}.analytics-member>span{grid-column:1/-1;color:#687990;font-size:7px}.analytics-bar{height:6px;background:#0c1727;border-radius:99px;overflow:hidden}.analytics-bar i{display:block;height:100%;background:linear-gradient(90deg,#1e6fe5,#22a8d4);border-radius:99px}.analytics-member>strong{font-size:10px;color:#9ed4ff;text-align:right}.assignee-option{display:flex;gap:9px;padding:10px;border-bottom:1px solid #ffffff0c;cursor:pointer}.assignee-option input{accent-color:#3b93ff}.assignee-person strong{display:block;color:#dce7f6;font-size:9px}.assignee-person small{display:block;color:#73849c;font-size:7px;margin-top:3px}@media(max-width:850px){.task-table-head{display:none}.detail-summary{grid-template-columns:1fr 1fr}.detail-workspace,.analytics-list{grid-template-columns:1fr}.analytics-member{grid-template-columns:150px 1fr 40px}}@media(max-width:560px){.detail-card{padding:16px}.detail-summary{grid-template-columns:1fr}.analytics-member{grid-template-columns:1fr 1fr}.analytics-member>strong{text-align:left}}`;document.head.appendChild(s);}

function installEvents(){
  el.form?.addEventListener('submit',saveTask);
  $('newTaskBtn')?.addEventListener('click',openCreate);
  $('closeModal')?.addEventListener('click',closeModal);$('cancelModal')?.addEventListener('click',closeModal);el.modal?.addEventListener('click',e=>{if(e.target===el.modal)closeModal()});
  el.assigneeToggle?.addEventListener('click',e=>{e.stopPropagation();togglePicker()});document.addEventListener('click',e=>{if(el.assigneePicker&&!el.assigneePicker.contains(e.target))togglePicker(false)});
  el.search?.addEventListener('input',render);el.statusFilter?.addEventListener('change',render);el.priorityFilter?.addEventListener('change',render);
  document.querySelectorAll('.view-btn').forEach(btn=>btn.addEventListener('click',()=>{view=btn.dataset.view;document.querySelectorAll('.view-btn').forEach(x=>x.classList.toggle('active',x===btn));render();}));
  el.list?.addEventListener('click',e=>{const edit=e.target.closest('[data-action="edit"]');if(edit){e.stopPropagation();const t=tasks.find(x=>x.id===edit.dataset.id);if(t)openEdit(t);return;}const create=e.target.closest('[data-action="create"]');if(create){openCreate();return;}const row=e.target.closest('[data-task]');if(row)openDetail(row.dataset.task);});
  el.kanban?.addEventListener('click',e=>{const edit=e.target.closest('[data-action="edit"]');if(edit){e.stopPropagation();const t=tasks.find(x=>x.id===edit.dataset.id);if(t)openEdit(t);return;}const card=e.target.closest('[data-task]');if(card)openDetail(card.dataset.task);});
  document.addEventListener('click',async e=>{const action=e.target.closest('[data-detail-action]')?.dataset.detailAction;if(!action||!activeDetailId)return;if(action==='add-check'){const input=$('detailCheckInput');if(!input?.value.trim())return;try{await addDoc(collection(db,'workTasks',activeDetailId,'checklist'),{text:input.value.trim(),done:false,createdBy:user.uid,createdAt:serverTimestamp()});input.value='';await loadChecklist(activeDetailId);}catch{alert('Không thể thêm checklist.');}}if(action==='add-comment'){const input=$('detailCommentInput');if(!input?.value.trim())return;try{await addDoc(collection(db,'workTasks',activeDetailId,'comments'),{text:input.value.trim(),authorId:user.uid,authorName:el.userName?.textContent||'Thành viên',createdAt:serverTimestamp()});input.value='';await loadComments(activeDetailId);}catch{alert('Không thể gửi trao đổi.');}}});
  el.logout?.addEventListener('click',()=>signOut(auth).catch(console.error));
}

async function boot(u){
  if(!u){location.href='index.html';return;}
  user=u;el.userName.textContent=u.displayName||u.email?.split('@')[0]||'Thành viên';el.topUserName.textContent=el.userName.textContent;
  try{scope=await getWorkScope();await loadMembers();tasks=await getTasksForScope();render();}catch(error){console.error('[WORK] boot failed',error);tasks=[];render();el.result.textContent=error?.message||'Không thể tải dữ liệu Work';}
}

installStyles();installEvents();onAuthStateChanged(auth,boot);