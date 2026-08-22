import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, addDoc, getDocs, getDoc, updateDoc, doc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { getPermissions, hasPermission, can, runtimeContext } from './permissions.js';

const $=id=>document.getElementById(id);
const E={name:$('userName'),top:$('topUserName'),logout:$('logoutButton'),sync:$('syncState'),total:$('totalCount'),progress:$('progressCount'),done:$('doneCount'),overdue:$('overdueCount'),result:$('resultCount'),list:$('taskList'),kanban:$('kanbanBoard'),search:$('searchInput'),sf:$('statusFilter'),pf:$('priorityFilter'),modal:$('taskModal'),form:$('taskForm'),id:$('taskId'),title:$('taskTitle'),desc:$('taskDescription'),picker:$('taskAssigneePicker'),toggle:$('taskAssigneeToggle'),menu:$('taskAssigneeMenu'),options:$('taskAssigneeOptions'),count:$('assigneeCount'),memberHint:$('memberHint'),due:$('taskDueDate'),status:$('taskStatus'),priority:$('taskPriority'),save:$('saveTaskBtn'),boardTitle:$('boardTitle')};
let user=null,tasks=[],members=[],selectedAssigneeIds=new Set(),view='list',dragId=null,permissionsReady=false;
const SL={BACKLOG:'Backlog',TODO:'Todo',IN_PROGRESS:'Đang thực hiện',REVIEW:'Review',DONE:'Hoàn thành'};
const PL={LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao',URGENT:'Khẩn cấp'};
const POSITIONS={INTERN:'Thực tập sinh',COLLABORATOR:'Cộng tác viên',STAFF:'Nhân viên',SPECIALIST:'Chuyên viên',SENIOR_SPECIALIST:'Chuyên viên cao cấp',TEAM_LEAD:'Trưởng nhóm',MANAGER:'Quản lý',DEPARTMENT_HEAD:'Trưởng phòng',DIRECTOR:'Giám đốc',CEO:'CEO',CFO:'CFO',CTO:'CTO',COO:'COO',CHRO:'CHRO',CMO:'CMO',VICE_PRESIDENT:'Phó chủ tịch',VP:'Phó chủ tịch',OTHER:'Khác'};
const STATES=Object.keys(SL);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const positionLabel=p=>{const value=String(p||'').trim();if(!value)return'';return POSITIONS[value.toUpperCase()]||value;};

function normalizeAssignees(t){
    const ids=Array.isArray(t.assigneeIds)&&t.assigneeIds.length?t.assigneeIds:(Array.isArray(t.assignees)&&t.assignees.length?t.assignees.map(a=>a.id).filter(Boolean):(t.assigneeId?[t.assigneeId]:[]));
    if(!ids.length)return[];
    return ids.map(id=>{
        const key=String(id||'').trim().toLowerCase();
        const stored=Array.isArray(t.assignees)?t.assignees.find(a=>String(a?.id||'').trim().toLowerCase()===key):null;
        const m=members.find(x=>[x.id,x.username,x.userName,x.login,x.email].filter(Boolean).map(v=>String(v).trim().toLowerCase()).includes(key));
        if(m)return{id:m.id,name:m.name,position:positionLabel(m.position),department:m.department||'',team:m.team||''};
        const storedUsername=String(stored?.username||stored?.userName||stored?.login||stored?.name||'').trim().toLowerCase();
        const byEmailLocal=storedUsername?members.find(x=>String(x.email||'').split('@')[0].trim().toLowerCase()===storedUsername):null;
        if(byEmailLocal)return{id:byEmailLocal.id,name:byEmailLocal.name,position:positionLabel(byEmailLocal.position),department:byEmailLocal.department||'',team:byEmailLocal.team||''};
        return{id,name:'Chưa xác định',position:'',department:'',team:''};
    });
}
function assigneeText(t){const a=normalizeAssignees(t);if(!a.length)return'Chưa giao';return a.map(x=>`${x.name||'Thành viên'}${x.position?' · '+x.position:''}`).join(', ');}
function renderAssigneeOptions(){if(!E.options)return;E.options.innerHTML=members.map(m=>`<label class="assignee-option"><input type="checkbox" value="${esc(m.id)}" ${selectedAssigneeIds.has(m.id)?'checked':''}><span class="assignee-check"></span><span class="assignee-person"><strong>${esc(m.name)}</strong><small>${esc(positionLabel(m.position))}${m.department?` · ${esc(m.department)}`:''}</small></span></label>`).join('')||'<div class="assignee-empty">Chưa có thành viên Active.</div>';E.options.querySelectorAll('input[type=checkbox]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)selectedAssigneeIds.add(input.value);else selectedAssigneeIds.delete(input.value);updateAssigneeSummary();}));updateAssigneeSummary();}
function updateAssigneeSummary(){const selected=members.filter(m=>selectedAssigneeIds.has(m.id));if(E.count)E.count.textContent=selected.length?`${selected.length} người`:'Chưa giao';if(E.toggle)E.toggle.classList.toggle('has-selection',selected.length>0);if(E.memberHint)E.memberHint.textContent=selected.length?`${selected.length} người đang được chọn · chỉ thành viên Active`:`${members.length} thành viên Active có thể nhận công việc`;}
function setAssignees(ids=[]){selectedAssigneeIds=new Set((ids||[]).filter(id=>members.some(m=>m.id===id)));renderAssigneeOptions();}
function openPicker(){if(!can('work','assign'))return;if(E.menu){E.menu.classList.add('open');renderAssigneeOptions();}}
function closePicker(){E.menu?.classList.remove('open');}

async function loadDirectory(){
    const[identitySnap,membershipSnap]=await Promise.all([getDocs(query(collection(db,'identities'),where('status','==','ACTIVE'))),getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE'))) ]);
    const byUid=new Map();
    membershipSnap.forEach(s=>{const d=s.data();const uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1];if(uid)byUid.set(uid,{...d,id:s.id});});
    members=identitySnap.docs.map(d=>{const x=d.data();const m=byUid.get(d.id);return{id:d.id,name:x.fullName||x.displayName||x.name||'Thành viên',email:x.email||'',username:x.username||x.userName||x.login||'',userName:x.userName||x.username||'',login:x.login||x.username||'',position:x.position||x.jobTitle||m?.position||'',department:x.department||m?.department||'',team:x.team||m?.team||'',status:'ACTIVE'};});
    if(!members.some(m=>m.id===user.uid)){const own=await getDoc(doc(db,'identities',user.uid));if(own.exists()){const x=own.data();const m=byUid.get(user.uid);members.push({id:user.uid,name:x.fullName||x.displayName||x.name||'Thành viên',email:x.email||'',username:x.username||x.userName||x.login||'',userName:x.userName||x.username||'',login:x.login||x.username||'',position:x.position||x.jobTitle||m?.position||'',department:x.department||m?.department||'',team:x.team||m?.team||'',status:String(x.status||'ACTIVE').toUpperCase()});}}
    renderAssigneeOptions();
}

onAuthStateChanged(auth,async u=>{
    if(!u){location.href='index.html';return;}
    user=u;
    try{
        await getPermissions();permissionsReady=true;
        if(!hasPermission('work.view')){location.href='dashboard.html';return;}
        const identity=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
        const mine=identity.docs.find(x=>x.id===u.uid)?.data();
        const name=mine?.fullName||mine?.displayName||mine?.name||u.displayName||'User';
        E.name.textContent=name;E.top.textContent=name;
        await loadDirectory();await loadTasks();applyWorkUI();E.sync.innerHTML='<i></i> Firebase · Đã đồng bộ';
    }catch(e){console.error('Work bootstrap error:',e);E.sync.innerHTML='<i style="background:#ff3b3b;box-shadow:0 0 8px #ff3b3b"></i> Firebase · Lỗi kết nối';E.result.textContent='Không thể tải dữ liệu Work';}
});

function addScopedQuery(queries, field, value){if(value!==undefined&&value!==null&&String(value)!=='')queries.push(query(collection(db,'workTasks'),where(field,'==',value)));}

async function loadTasks(){
    const ctx=runtimeContext()||{};
    const scope=ctx.scope||{};
    const queries=[];
    const effectiveRole=String(ctx.role||ctx.policyRole||'').toUpperCase();
    const isAdminContext=effectiveRole==='ADMIN'||hasPermission('admin.system.manage');

    if(isAdminContext){
        // Admin is the only role allowed to use the unrestricted collection query.
        // Other roles must use queries whose predicates are provable by firestore.rules.
        queries.push(query(collection(db,'workTasks')));
    }else{
        // Every non-admin read is constrained to one of the exact predicates used by Rules:
        // assigned, legacy-assigned, owned, department or team.
        addScopedQuery(queries,'assigneeIds',null);
        queries.push(query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid)));
        queries.push(query(collection(db,'workTasks'),where('assigneeId','==',user.uid)));
        queries.push(query(collection(db,'workTasks'),where('createdBy','==',user.uid)));
        addScopedQuery(queries,'departmentId',scope.departmentId);
        addScopedQuery(queries,'department',scope.departmentId);
        addScopedQuery(queries,'teamId',scope.teamId);
        addScopedQuery(queries,'team',scope.teamId);
    }

    const snapshots=await Promise.all(queries);
    const map=new Map();
    snapshots.forEach(s=>s.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()})));
    tasks=[...map.values()].sort((a,b)=>{
        const aa=a.createdAt?.toMillis?a.createdAt.toMillis():new Date(a.createdAt||0).getTime();
        const bb=b.createdAt?.toMillis?b.createdAt.toMillis():new Date(b.createdAt||0).getTime();
        return bb-aa;
    });
    render();
}

function canEditTask(t){return hasPermission('work.edit')&&(hasPermission('work.assign')||t.createdBy===user?.uid||(Array.isArray(t.assigneeIds)&&t.assigneeIds.includes(user?.uid))||t.assigneeId===user?.uid);}
function visible(){const q=E.search.value.trim().toLowerCase();return tasks.filter(t=>(!q||`${t.title||''} ${t.description||''} ${assigneeText(t)}`.toLowerCase().includes(q))&&(E.sf.value==='ALL'||t.status===E.sf.value)&&(E.pf.value==='ALL'||t.priority===E.pf.value));}
function render(){const today=new Date().toISOString().slice(0,10);E.total.textContent=tasks.length;E.progress.textContent=tasks.filter(t=>t.status==='IN_PROGRESS').length;E.done.textContent=tasks.filter(t=>t.status==='DONE').length;E.overdue.textContent=tasks.filter(t=>t.dueDate&&t.dueDate<today&&t.status!=='DONE').length;const v=visible();E.result.textContent=`${v.length} công việc`;if(view==='list'){E.list.style.display='block';E.kanban.classList.remove('active');E.boardTitle.textContent='Danh sách công việc';renderList(v);}else{E.list.style.display='none';E.kanban.classList.add('active');E.boardTitle.textContent='Kanban Work';renderKanban(v);}}
function renderList(v){if(!v.length){E.list.innerHTML=`<div class="empty"><div>▱</div><strong>${tasks.length?'Không tìm thấy công việc':'Chưa có công việc'}</strong><span>${tasks.length?'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.':'Tạo công việc đầu tiên để bắt đầu vận hành Work.'}</span>${hasPermission('work.create')?'<button class="outline-btn" id="emptyCreateBtn">＋ Tạo công việc</button>':''}</div>`;$('emptyCreateBtn')?.addEventListener('click',openCreate);return;}E.list.innerHTML=v.map(row).join('');E.list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const t=tasks.find(t=>t.id===b.dataset.edit);if(canEditTask(t))openEdit(t);});}
function row(t){const today=new Date().toISOString().slice(0,10);const over=t.dueDate&&t.dueDate<today&&t.status!=='DONE';const dot=t.status==='DONE'?'#55aaff':t.status==='IN_PROGRESS'?'#00e676':t.status==='REVIEW'?'#ff9f1c':t.priority==='URGENT'?'#ff3b3b':'#2587ff';return`<div class="task-row" data-detail="${esc(t.id)}"><div class="task-main"><i class="task-dot" style="color:${dot};background:${dot}"></i><div><strong>${esc(t.title||'Không tên')}</strong><small>${esc(t.description||'Chưa có mô tả')}</small></div></div><span class="status ${t.status||'TODO'}">${SL[t.status]||'Todo'}</span><span class="priority ${t.priority||'MEDIUM'}">${PL[t.priority]||'Trung bình'}</span><span class="assignee" title="${esc(assigneeText(t))}">${esc(assigneeText(t))}</span><span class="due ${over?'overdue':''}">${t.dueDate?date(t.dueDate):'Không deadline'}</span>${canEditTask(t)?`<button class="row-menu" data-edit="${esc(t.id)}" title="Sửa">⋮</button>`:''}</div>`;}
function renderKanban(v){E.kanban.innerHTML=STATES.map(status=>{const items=v.filter(t=>(t.status||'TODO')===status);return`<div class="kanban-col" data-status="${status}"><div class="kanban-col-head"><strong>${SL[status]}</strong><span>${items.length}</span></div><div class="kanban-items">${items.map(kanbanCard).join('')}</div></div>`;}).join('');wireKanban();}
function kanbanCard(t){const today=new Date().toISOString().slice(0,10);const over=t.dueDate&&t.dueDate<today&&t.status!=='DONE';const editable=canEditTask(t);return`<article class="kanban-card" draggable="${editable}" data-id="${esc(t.id)}" data-detail="${esc(t.id)}"><strong>${esc(t.title||'Không tên')}</strong><p>${esc(t.description||'Chưa có mô tả')}</p><div class="kanban-meta"><span class="kanban-assignee">${esc(assigneeText(t))}</span><span class="kanban-priority ${t.priority||'MEDIUM'}">${PL[t.priority]||'Trung bình'}</span></div><div class="kanban-meta"><span class="kanban-due ${over?'overdue':''}">${t.dueDate?date(t.dueDate):'Không deadline'}</span>${editable?`<button class="row-menu" data-edit="${esc(t.id)}" title="Sửa">⋮</button>`:''}</div></article>`;}
function wireKanban(){E.kanban.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation();const t=tasks.find(t=>t.id===b.dataset.edit);if(canEditTask(t))openEdit(t);});E.kanban.querySelectorAll('.kanban-card[draggable="true"]').forEach(card=>{card.addEventListener('dragstart',()=>{dragId=card.dataset.id;card.classList.add('dragging');});card.addEventListener('dragend',()=>{dragId=null;card.classList.remove('dragging');E.kanban.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));});});E.kanban.querySelectorAll('.kanban-col').forEach(col=>{col.addEventListener('dragover',e=>{if(!hasPermission('work.edit'))return;e.preventDefault();col.classList.add('drag-over');});col.addEventListener('dragleave',()=>col.classList.remove('drag-over'));col.addEventListener('drop',async e=>{e.preventDefault();col.classList.remove('drag-over');if(!dragId||!hasPermission('work.edit'))return;const t=tasks.find(x=>x.id===dragId);const status=col.dataset.status;if(t&&t.status!==status&&canEditTask(t))await moveTask(t,status);});});}
async function logActivity(taskId,type,message){try{await addDoc(collection(doc(db,'workTasks',taskId),'activity'),{type,message,by:user.uid,createdAt:serverTimestamp()});}catch(e){console.warn('Activity log skipped',e);}}
async function moveTask(t,status){if(!canEditTask(t))return;try{await updateDoc(doc(db,'workTasks',t.id),{status,updatedBy:user.uid,updatedAt:serverTimestamp()});t.status=status;await logActivity(t.id,'STATUS_CHANGE',`Chuyển trạng thái sang ${SL[status]}`);render();}catch(e){console.error(e);alert('Không thể cập nhật trạng thái. Hãy kiểm tra Firebase/Firestore Rules.');}}
function date(v){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T00:00:00'));}
function openCreate(){if(!hasPermission('work.create'))return;E.form.reset();E.id.value='';setAssignees([]);E.status.value='TODO';E.priority.value='MEDIUM';$('modalTitle').textContent='Tạo công việc';E.modal.classList.add('open');E.title.focus();}
function openEdit(t){if(!t||!canEditTask(t))return;$('modalTitle').textContent='Chỉnh sửa công việc';E.id.value=t.id;E.title.value=t.title||'';E.desc.value=t.description||'';setAssignees(normalizeAssignees(t).map(a=>a.id).filter(Boolean));E.due.value=t.dueDate||'';E.status.value=t.status||'TODO';E.priority.value=t.priority||'MEDIUM';E.modal.classList.add('open');E.title.focus();}
function close(){E.modal.classList.remove('open');closePicker();}
function applyWorkUI(){if(!hasPermission('work.create'))$('newTaskBtn')?.remove();if(!hasPermission('work.assign')){E.toggle?.setAttribute('disabled','true');E.toggle?.classList.add('disabled');}if(!hasPermission('work.edit')){E.status?.setAttribute('disabled','true');E.priority?.setAttribute('disabled','true');E.save?.remove();}}
E.toggle?.addEventListener('click',e=>{e.stopPropagation();E.menu?.classList.contains('open')?closePicker():openPicker();});document.addEventListener('click',e=>{if(E.picker&&!E.picker.contains(e.target))closePicker();});$('newTaskBtn')?.addEventListener('click',openCreate);$('closeModal')?.addEventListener('click',close);$('cancelModal')?.addEventListener('click',close);E.modal.onclick=e=>{if(e.target===E.modal)close();};E.search.oninput=render;E.sf.onchange=render;E.pf.onchange=render;document.querySelectorAll('.view-btn').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('.view-btn').forEach(x=>x.classList.toggle('active',x===b));render();});
E.form.onsubmit=async e=>{e.preventDefault();if(E.id.value){const current=tasks.find(t=>t.id===E.id.value);if(!canEditTask(current))return;}else if(!hasPermission('work.create'))return;E.save.disabled=true;E.save.textContent='Đang lưu...';const selected=members.filter(m=>selectedAssigneeIds.has(m.id));const assignees=selected.map(m=>({id:m.id,name:m.name,position:positionLabel(m.position),department:m.department||'',team:m.team||''}));const first=assignees[0]||null;if(assignees.length&&!hasPermission('work.assign')){E.save.disabled=false;E.save.textContent='Lưu công việc';alert('Bạn không có quyền giao công việc cho thành viên khác.');return;}const data={title:E.title.value.trim(),description:E.desc.value.trim(),assigneeIds:assignees.map(a=>a.id),assignees,assignee:first?.name||'',assigneeId:first?.id||null,assigneePosition:first?.position||null,assigneeDepartment:first?.department||'',dueDate:E.due.value||null,status:E.status.value,priority:E.priority.value,updatedBy:user.uid,updatedAt:serverTimestamp()};try{if(E.id.value){await updateDoc(doc(db,'workTasks',E.id.value),data);await logActivity(E.id.value,'UPDATED',`Cập nhật công việc${assignees.length?` · ${assignees.length} người phụ trách`:''}`);}else{const ref=await addDoc(collection(db,'workTasks'),{...data,createdBy:user.uid,createdAt:serverTimestamp()});await logActivity(ref.id,'CREATED','Tạo công việc mới');}close();await loadTasks();}catch(error){console.error('Work save error:',error);alert(`Không thể lưu công việc: ${error?.code||error?.message||'Lỗi không xác định'}`);}finally{E.save.disabled=false;E.save.textContent='Lưu công việc';}};
E.logout?.addEventListener('click',async()=>{try{await signOut(auth);location.href='index.html';}catch(e){console.error(e);}});
