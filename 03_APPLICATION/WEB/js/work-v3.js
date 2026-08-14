import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { getWorkScope, taskInScope, stampTaskScope } from './work-scope.js';

const $=id=>document.getElementById(id);
const E={name:$('userName'),top:$('topUserName'),logout:$('logoutButton'),sync:$('syncState'),total:$('totalCount'),progress:$('progressCount'),done:$('doneCount'),overdue:$('overdueCount'),result:$('resultCount'),list:$('taskList'),kanban:$('kanbanBoard'),search:$('searchInput'),sf:$('statusFilter'),pf:$('priorityFilter'),modal:$('taskModal'),form:$('taskForm'),id:$('taskId'),title:$('taskTitle'),desc:$('taskDescription'),picker:$('taskAssigneePicker'),toggle:$('taskAssigneeToggle'),menu:$('taskAssigneeMenu'),options:$('taskAssigneeOptions'),count:$('assigneeCount'),memberHint:$('memberHint'),due:$('taskDueDate'),status:$('taskStatus'),priority:$('taskPriority'),save:$('saveTaskBtn'),boardTitle:$('boardTitle')};
let user=null,scope=null,tasks=[],members=[],selectedAssigneeIds=new Set(),view='list',dragId=null;
const SL={BACKLOG:'Backlog',TODO:'Todo',IN_PROGRESS:'Đang thực hiện',REVIEW:'Review',DONE:'Hoàn thành'};
const PL={LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao',URGENT:'Khẩn cấp'};
const POSITIONS={INTERN:'Thực tập sinh',COLLABORATOR:'Cộng tác viên',STAFF:'Nhân viên',SPECIALIST:'Chuyên viên',SENIOR_SPECIALIST:'Chuyên viên cao cấp',TEAM_LEAD:'Trưởng nhóm',MANAGER:'Quản lý',DEPARTMENT_HEAD:'Trưởng phòng',DIRECTOR:'Giám đốc',OTHER:'Khác'};
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const positionLabel=p=>POSITIONS[String(p||'STAFF').toUpperCase()]||String(p||'Nhân viên');

function normalizeAssignees(t){
  if(Array.isArray(t.assignees)&&t.assignees.length)return t.assignees;
  if(Array.isArray(t.assigneeIds)&&t.assigneeIds.length)return t.assigneeIds.map(id=>{const m=members.find(x=>x.id===id);return m?{id:m.id,name:m.name,position:positionLabel(m.position),department:m.department||'',team:m.team||''}:{id};});
  if(t.assigneeId)return[{id:t.assigneeId,name:t.assignee||'',position:t.assigneePosition||'',department:t.assigneeDepartment||''}];
  return[];
}
function assigneeText(t){const a=normalizeAssignees(t);return a.length?a.map(x=>`${x.name||'Thành viên'}${x.position?' · '+x.position:''}`).join(', '):'Chưa giao';}
function isAdmin(){return scope?.type==='ORGANIZATION'}
function canManageScope(){return isAdmin()||scope?.type==='DEPARTMENT'||scope?.type==='DEPARTMENT_LEGACY'||scope?.type==='TEAM'}
function taskEditable(t){return isAdmin()||taskInScope(t,scope)}
function directoryMembers(){
  if(isAdmin())return members;
  if(scope?.type==='DEPARTMENT'||scope?.type==='DEPARTMENT_LEGACY')return members.filter(m=>(scope.departmentId&&m.departmentId===scope.departmentId)||(!scope.departmentId&&scope.department&&String(m.department||'').trim().toLowerCase()===String(scope.department).trim().toLowerCase()));
  if(scope?.type==='TEAM')return members.filter(m=>(scope.teamId&&m.teamId===scope.teamId)||(!scope.teamId&&scope.team&&String(m.team||'').trim().toLowerCase()===String(scope.team).trim().toLowerCase()));
  return members.filter(m=>m.id===user.uid);
}

async function loadDirectory(){
  const [is,ms]=await Promise.all([
    getDocs(query(collection(db,'identities'),where('status','==','ACTIVE'))),
    getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE')))
  ]);
  const map=new Map();
  ms.forEach(s=>{const d=s.data(),uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1];if(uid)map.set(uid,{...d,id:s.id});});
  members=is.docs.map(s=>{
    const x=s.data(),m=map.get(s.id)||{};
    return{id:s.id,name:x.fullName||x.displayName||x.name||x.email||s.id,email:x.email||'',position:m.position||x.position||'STAFF',departmentId:m.departmentId||x.departmentId||'',department:m.department||x.department||'',teamId:m.teamId||x.teamId||'',team:m.team||x.team||'',managerId:m.managerId||x.managerId||'',status:'ACTIVE'};
  });
  if(!members.some(m=>m.id===user.uid)){
    const own=await getDoc(doc(db,'identities',user.uid));
    if(own.exists()){
      const x=own.data();
      members.push({id:user.uid,name:x.fullName||x.displayName||user.displayName||'Bạn',email:x.email||user.email||'',position:x.position||'STAFF',departmentId:x.departmentId||'',department:x.department||'',teamId:x.teamId||'',team:x.team||'',managerId:x.managerId||'',status:'ACTIVE'});
    }
  }
  renderAssigneeOptions();
}

function renderAssigneeOptions(){
  if(!E.options)return;
  const available=directoryMembers();
  E.options.innerHTML=available.map(m=>`<label class="assignee-option"><input type="checkbox" value="${esc(m.id)}" ${selectedAssigneeIds.has(m.id)?'checked':''}><span class="assignee-check"></span><span class="assignee-person"><strong>${esc(m.name)}</strong><small>${esc(positionLabel(m.position))}${m.department?` · ${esc(m.department)}`:''}${m.team?` · ${esc(m.team)}`:''}</small></span></label>`).join('')||'<div class="assignee-empty">Không có thành viên trong phạm vi này.</div>';
  E.options.querySelectorAll('input[type=checkbox]').forEach(i=>i.addEventListener('change',()=>{i.checked?selectedAssigneeIds.add(i.value):selectedAssigneeIds.delete(i.value);updateAssigneeSummary();}));
  updateAssigneeSummary();
}
function updateAssigneeSummary(){const n=directoryMembers().filter(m=>selectedAssigneeIds.has(m.id)).length;if(E.count)E.count.textContent=n?`${n} người`:'Chưa giao';E.toggle?.classList.toggle('has-selection',n>0);if(E.memberHint)E.memberHint.textContent=n?`${n} người đang được chọn · theo phạm vi quản lý`:`${directoryMembers().length} thành viên trong phạm vi có thể nhận công việc`;}
function setAssignees(ids=[]){const allowed=new Set(directoryMembers().map(m=>m.id));selectedAssigneeIds=new Set((ids||[]).filter(id=>allowed.has(id)));renderAssigneeOptions();}
function openPicker(){E.menu?.classList.add('open');renderAssigneeOptions();}function closePicker(){E.menu?.classList.remove('open');}

async function loadTasks(){
  const map=new Map();
  const add=s=>s.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()}));
  if(isAdmin()){
    add(await getDocs(query(collection(db,'workTasks'),orderBy('createdAt','desc'))));
  }else if(scope?.type==='DEPARTMENT'&&scope.departmentId){
    add(await getDocs(query(collection(db,'workTasks'),where('departmentId','==',scope.departmentId))));
    await loadPersonalTasks(map);
  }else if(scope?.type==='DEPARTMENT_LEGACY'&&scope.department){
    add(await getDocs(query(collection(db,'workTasks'),where('department','==',scope.department))));
    await loadPersonalTasks(map);
  }else if(scope?.type==='TEAM'&&scope.teamId){
    add(await getDocs(query(collection(db,'workTasks'),where('teamId','==',scope.teamId))));
    await loadPersonalTasks(map);
  }else if(scope?.type==='TEAM'&&scope.team){
    add(await getDocs(query(collection(db,'workTasks'),where('team','==',scope.team))));
    await loadPersonalTasks(map);
  }else{
    await loadPersonalTasks(map);
  }
  tasks=[...map.values()].filter(t=>taskInScope(t,scope)).sort((a,b)=>{
    const aa=a.createdAt?.toMillis?.()||new Date(a.createdAt||0).getTime()||0;
    const bb=b.createdAt?.toMillis?.()||new Date(b.createdAt||0).getTime()||0;
    return bb-aa;
  });
  render();
}
async function loadPersonalTasks(map){
  const [assigned,created,legacy]=await Promise.all([
    getDocs(query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid))),
    getDocs(query(collection(db,'workTasks'),where('createdBy','==',user.uid))),
    getDocs(query(collection(db,'workTasks'),where('assigneeId','==',user.uid)))
  ]);
  [assigned,created,legacy].forEach(add=>add.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()})));
}

function visible(){const q=E.search.value.trim().toLowerCase();return tasks.filter(t=>(!q||`${t.title||''} ${t.description||''} ${assigneeText(t)}`.toLowerCase().includes(q))&&(E.sf.value==='ALL'||t.status===E.sf.value)&&(E.pf.value==='ALL'||t.priority===E.pf.value));}
function render(){const today=new Date().toISOString().slice(0,10);E.total.textContent=tasks.length;E.progress.textContent=tasks.filter(t=>t.status==='IN_PROGRESS').length;E.done.textContent=tasks.filter(t=>t.status==='DONE').length;E.overdue.textContent=tasks.filter(t=>t.dueDate&&t.dueDate<today&&t.status!=='DONE').length;const v=visible();E.result.textContent=`${v.length} công việc`;E.boardTitle.textContent=isAdmin()?(view==='list'?'Danh sách công việc toàn workspace':'Kanban toàn workspace'):(view==='list'?`Công việc · ${scope?.label||'Phạm vi cá nhân'}`:`Kanban · ${scope?.label||'Phạm vi cá nhân'}`);if(view==='list'){E.list.style.display='block';E.kanban.classList.remove('active');renderList(v);}else{E.list.style.display='none';E.kanban.classList.add('active');renderKanban(v);}}
function row(t){const today=new Date().toISOString().slice(0,10),over=t.dueDate&&t.dueDate<today&&t.status!=='DONE';return`<div class="task-row" data-detail="${esc(t.id)}"><div class="task-main"><i class="task-dot"></i><div><strong>${esc(t.title||'Không tên')}</strong><small>${esc(t.description||'Chưa có mô tả')}</small></div></div><span class="status ${t.status||'TODO'}">${SL[t.status]||'Todo'}</span><span class="priority ${t.priority||'MEDIUM'}">${PL[t.priority]||'Trung bình'}</span><span class="assignee" title="${esc(assigneeText(t))}">${esc(assigneeText(t))}</span><span class="due ${over?'overdue':''}">${t.dueDate?date(t.dueDate):'Không deadline'}</span>${taskEditable(t)?`<button class="row-menu" data-edit="${esc(t.id)}" title="Sửa">⋮</button>`:''}</div>`;}
function renderList(v){if(!v.length){E.list.innerHTML=`<div class="empty"><div>▱</div><strong>${tasks.length?'Không tìm thấy công việc':'Chưa có công việc'}</strong><span>${tasks.length?'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.':'Tạo công việc đầu tiên để bắt đầu vận hành Work.'}</span><button class="outline-btn" id="emptyCreateBtn">＋ Tạo công việc</button></div>`;$('emptyCreateBtn').onclick=openCreate;return;}E.list.innerHTML=v.map(row).join('');E.list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();const t=tasks.find(x=>x.id===b.dataset.edit);if(t&&taskEditable(t))openEdit(t);});}
function kanbanCard(t){const today=new Date().toISOString().slice(0,10),over=t.dueDate&&t.dueDate<today&&t.status!=='DONE';return`<article class="kanban-card" draggable="true" data-id="${esc(t.id)}" data-detail="${esc(t.id)}"><strong>${esc(t.title||'Không tên')}</strong><p>${esc(t.description||'Chưa có mô tả')}</p><div class="kanban-meta"><span class="kanban-assignee">${esc(assigneeText(t))}</span><span class="kanban-priority ${t.priority||'MEDIUM'}">${PL[t.priority]||'Trung bình'}</span></div><div class="kanban-meta"><span class="kanban-due ${over?'overdue':''}">${t.dueDate?date(t.dueDate):'Không deadline'}</span>${taskEditable(t)?`<button class="row-menu" data-edit="${esc(t.id)}" title="Sửa">⋮</button>`:''}</div></article>`;}
function renderKanban(v){E.kanban.innerHTML=Object.keys(SL).map(s=>{const items=v.filter(t=>(t.status||'TODO')===s);return`<div class="kanban-col" data-status="${s}"><div class="kanban-col-head"><strong>${SL[s]}</strong><span>${items.length}</span></div><div class="kanban-items">${items.map(kanbanCard).join('')}</div></div>`;}).join('');wireKanban();}
function wireKanban(){E.kanban.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();const t=tasks.find(x=>x.id===b.dataset.edit);if(t&&taskEditable(t))openEdit(t);});E.kanban.querySelectorAll('.kanban-card').forEach(c=>{c.addEventListener('dragstart',()=>{dragId=c.dataset.id;c.classList.add('dragging')});c.addEventListener('dragend',()=>{dragId=null;c.classList.remove('dragging')});});E.kanban.querySelectorAll('.kanban-col').forEach(col=>{col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drag-over')});col.addEventListener('dragleave',()=>col.classList.remove('drag-over'));col.addEventListener('drop',async e=>{e.preventDefault();col.classList.remove('drag-over');if(!dragId)return;const t=tasks.find(x=>x.id===dragId);if(t&&taskEditable(t)&&t.status!==col.dataset.status)await moveTask(t,col.dataset.status);});});}
async function moveTask(t,status){if(!taskEditable(t))return;try{await updateDoc(doc(db,'workTasks',t.id),{status,updatedBy:user.uid,updatedAt:serverTimestamp()});t.status=status;await logActivity(t.id,'STATUS_CHANGE',`Chuyển trạng thái sang ${SL[status]}`);render();}catch(e){console.error(e);alert('Không thể cập nhật trạng thái. Kiểm tra quyền Work.');}}
async function logActivity(taskId,type,message){try{await addDoc(collection(doc(db,'workTasks',taskId),'activity'),{type,message,by:user.uid,createdAt:serverTimestamp()});}catch(e){console.warn('Activity log skipped',e);}}
function date(v){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T00:00:00'));}
function openCreate(){E.form.reset();E.id.value='';setAssignees(isAdmin()?[]:[user.uid]);E.status.value='TODO';E.priority.value='MEDIUM';$('modalTitle').textContent='Tạo công việc';E.modal.classList.add('open');E.title.focus();}
function openEdit(t){if(!t||!taskEditable(t))return;$('modalTitle').textContent='Chỉnh sửa công việc';E.id.value=t.id;E.title.value=t.title||'';E.desc.value=t.description||'';setAssignees(normalizeAssignees(t).map(x=>x.id).filter(Boolean));E.due.value=t.dueDate||'';E.status.value=t.status||'TODO';E.priority.value=t.priority||'MEDIUM';E.modal.classList.add('open');E.title.focus();}
function close(){E.modal.classList.remove('open');closePicker();}
function createDetailModal(){const m=document.createElement('div');m.className='detail-modal';m.innerHTML='<div class="detail-card glass"><div class="detail-head"><div><span class="eyebrow">WORK / TASK DETAIL</span><h2 id="detailTitle">Chi tiết công việc</h2><p id="detailMeta"></p></div><button class="close" id="detailClose">×</button></div><div id="detailBody"></div></div>';document.body.appendChild(m);$('detailClose').onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m;}
const detailModal=createDetailModal();
document.addEventListener('click',e=>{const target=e.target.closest('[data-detail]');if(!target||e.target.closest('[data-edit]'))return;const t=tasks.find(x=>x.id===target.dataset.detail);if(!t)return;$('detailTitle').textContent=t.title||'Chi tiết công việc';$('detailMeta').textContent=`${SL[t.status]||'Todo'} · ${PL[t.priority]||'Trung bình'} · ${t.dueDate?date(t.dueDate):'Không deadline'}`;const people=normalizeAssignees(t);$('detailBody').innerHTML=`<div class="detail-summary"><div><label>NGƯỜI PHỤ TRÁCH</label><strong>${esc(people.length?people.map(p=>p.name).join(', '):'Chưa giao')}</strong></div><div><label>MÔ TẢ</label><p>${esc(t.description||'Chưa có mô tả')}</p></div></div>`;detailModal.classList.add('open');});
E.toggle?.addEventListener('click',e=>{e.stopPropagation();E.menu?.classList.contains('open')?closePicker():openPicker()});document.addEventListener('click',e=>{if(E.picker&&!E.picker.contains(e.target))closePicker()});
$('newTaskBtn').onclick=openCreate;$('closeModal').onclick=close;$('cancelModal').onclick=close;E.modal.onclick=e=>{if(e.target===E.modal)close()};E.search.oninput=render;E.sf.onchange=render;E.pf.onchange=render;document.querySelectorAll('.view-btn').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('.view-btn').forEach(x=>x.classList.toggle('active',x===b));render()});
E.form.onsubmit=async e=>{e.preventDefault();E.save.disabled=true;E.save.textContent='Đang lưu...';const selected=directoryMembers().filter(m=>selectedAssigneeIds.has(m.id)),assignees=selected.map(m=>({id:m.id,name:m.name,position:positionLabel(m.position),department:m.department||'',team:m.team||''})),first=assignees[0]||null;let data={title:E.title.value.trim(),description:E.desc.value.trim(),assigneeIds:assignees.map(a=>a.id),assignees,assignee:first?.name||'',assigneeId:first?.id||null,assigneePosition:first?.position||null,assigneeDepartment:first?.department||'',dueDate:E.due.value||null,status:E.status.value,priority:E.priority.value,updatedBy:user.uid,updatedAt:serverTimestamp()};data=stampTaskScope(data,scope);try{if(E.id.value){const old=tasks.find(t=>t.id===E.id.value);if(!old||!taskEditable(old))throw new Error('Bạn không có quyền chỉnh sửa công việc này.');await updateDoc(doc(db,'workTasks',E.id.value),data);await logActivity(E.id.value,'UPDATED',`Cập nhật công việc · ${assignees.length} người phụ trách`)}else{const ref=await addDoc(collection(db,'workTasks'),{...data,createdBy:user.uid,createdAt:serverTimestamp()});await logActivity(ref.id,'CREATED',`Tạo công việc · ${assignees.length} người phụ trách`)}close();await loadTasks()}catch(err){console.error(err);alert(err?.message||'Không thể lưu công việc. Kiểm tra Firebase/Firestore Rules.')}finally{E.save.disabled=false;E.save.textContent='Lưu công việc'}};
E.logout.onclick=()=>signOut(auth).catch(console.error);
onAuthStateChanged(auth,async u=>{if(!u){location.href='index.html';return}user=u;try{scope=await getWorkScope();await loadDirectory();const mine=await getDoc(doc(db,'identities',u.uid));const d=mine.exists()?mine.data():{};const name=d.fullName||d.displayName||u.displayName||u.email?.split('@')[0]||'User';E.name.textContent=name;E.top.textContent=name;await loadTasks();E.sync.innerHTML=`<i></i> Firebase · ${scope.label}`;}catch(err){console.error('Work bootstrap error:',err);E.sync.innerHTML='<i style="background:#ff3b3b;box-shadow:0 0 8px #ff3b3b"></i> Firebase · Lỗi kết nối';E.result.textContent=err?.message||'Không thể tải dữ liệu Work';}});
