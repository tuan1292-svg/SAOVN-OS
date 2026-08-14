import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions, hasPermission, role } from './permissions.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=name=>String(name||'S').split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase();
const position=v=>String(v||'').trim()||'Chưa xác định';
const positionCode=v=>String(v||'').trim().toUpperCase();
const statusLabel={BACKLOG:'Backlog',TODO:'Todo',IN_PROGRESS:'Đang thực hiện',REVIEW:'Review',DONE:'Hoàn thành'};
let department=null,members=[],tasks=[];

onAuthStateChanged(auth,async user=>{
  if(!user){location.replace('index.html');return;}
  await getPermissions();
  if(!hasPermission('departments.view')){location.replace('dashboard.html');return;}

  const identity=await getDoc(doc(db,'identities',user.uid));
  const data=identity.exists()?identity.data():{};
  const name=data.fullName||data.displayName||data.name||user.displayName||'Thành viên';

  $('userName').textContent=name;
  $('userAvatar').textContent=initials(name);
  $('userRole').textContent=role()==='ADMIN'?'Founder · Chairman · CEO':role()==='MANAGER'?'Manager':'Workspace member';
  $('logoutBtn').onclick=()=>signOut(auth);
  await loadWorkspace();
});

async function loadWorkspace(){
  const id=new URLSearchParams(location.search).get('id');
  if(!id){location.replace('departments.html');return;}

  try{
    const departmentSnap=await getDoc(doc(db,'departments',id));
    if(!departmentSnap.exists()){
      showError('Không tìm thấy phòng ban.');
      return;
    }

    department={id:departmentSnap.id,...departmentSnap.data()};

    const identitySnap=await getDocs(collection(db,'identities'));
    members=identitySnap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(m=>m.status==='ACTIVE'&&(m.departmentId===department.id||(!m.departmentId&&String(m.department||'').trim().toLowerCase()===String(department.name||'').trim().toLowerCase())))
      .sort((a,b)=>String(a.fullName||a.displayName||a.name||'').localeCompare(String(b.fullName||b.displayName||b.name||''),'vi'));

    renderDepartment();
    await loadTasks();
    renderTeams();
    $('syncState').innerHTML='<i></i> Firebase · Đã đồng bộ';
  }catch(error){
    console.error('Department workspace error:',error);
    $('syncState').innerHTML='<i style="background:#ff3b3b"></i> Firebase · Lỗi';
    showError(error?.code==='permission-denied'?'Không đủ quyền truy cập dữ liệu phòng làm việc.':'Không thể tải phòng làm việc.');
  }
}

function renderDepartment(){
  const name=department.name||'Phòng làm việc';
  $('crumbName').textContent=name;
  $('departmentName').textContent=name;
  $('departmentCode').textContent=department.code||'DEPT';
  $('departmentDescription').textContent=department.description||'Không gian làm việc của phòng ban.';
  $('deptMark').textContent=initials(name).slice(0,2)||'D';
  $('departmentStatus').textContent=department.active===false?'Ngừng hoạt động':'Đang hoạt động';
  $('departmentStatus').classList.toggle('inactive',department.active===false);
  $('memberCount').textContent=members.length;
  $('memberSummary').textContent=`${members.length} người`;

  $('memberList').innerHTML=members.length?members.map(memberCard).join(''):`<div class="empty-workspace"><strong>Chưa có thành viên</strong>Chưa có thành viên Active được phân vào phòng này.</div>`;
}

function memberCard(m){
  const name=m.fullName||m.displayName||m.name||'Thành viên';
  return `<div class="member-item">
    <div class="member-avatar">${esc(initials(name))}</div>
    <div class="member-info"><strong>${esc(name)}</strong><small>${esc(position(m.position))}${m.team?` · ${esc(m.team)}`:''}</small></div>
  </div>`;
}

function renderTeams(){
  const groups=new Map();
  members.forEach(m=>{
    const team=String(m.team||'').trim()||'Chưa phân nhóm';
    if(!groups.has(team))groups.set(team,[]);
    groups.get(team).push(m);
  });

  const entries=[...groups.entries()].sort((a,b)=>{
    if(a[0]==='Chưa phân nhóm')return 1;
    if(b[0]==='Chưa phân nhóm')return -1;
    return a[0].localeCompare(b[0],'vi');
  });

  $('teamSummary').textContent=`${entries.length} nhóm`;
  if(!entries.length){
    $('teamList').innerHTML='<div class="empty-workspace"><strong>Chưa có nhóm</strong>Thành viên sẽ được tổ chức thành Team khi cơ cấu nhóm được thiết lập.</div>';
    return;
  }

  $('teamList').innerHTML=entries.map(([team,people])=>{
    const leader=people.find(m=>['TEAM_LEAD','TRƯỞNG NHÓM'].includes(positionCode(m.position)))||people.find(m=>positionCode(m.position)==='TEAM_LEAD');
    const teamLabel=team==='Chưa phân nhóm'?'Chưa phân nhóm':'TEAM';
    return `<article class="team-card">
      <div class="team-card-head"><div><span class="team-label">${teamLabel}</span><h3>${esc(team)}</h3>${leader?`<div class="team-lead"><span>TRƯỞNG NHÓM</span><strong>${esc(leader.fullName||leader.displayName||leader.name||'')}</strong></div>`:''}</div><strong>${people.length}</strong></div>
      <div class="team-members">${people.map(m=>{
        const name=m.fullName||m.displayName||m.name||'Thành viên';
        const isLeader=leader?.id===m.id;
        return `<span class="${isLeader?'is-leader':''}"><i>${esc(initials(name))}</i><b>${esc(name)}</b><small>${esc(position(m.position))}</small></span>`;
      }).join('')}</div>
    </article>`;
  }).join('');
}

async function loadTasks(){
  const ids=members.map(m=>m.id).filter(Boolean);
  if(!ids.length){renderTasks();return;}

  const map=new Map();
  try{
    const snapshots=await Promise.all(ids.map(id=>getDocs(query(collection(db,'workTasks'),where('assigneeIds','array-contains',id)))));
    snapshots.forEach(s=>s.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data()})));
  }catch(error){
    console.warn('Department task query failed:',error);
    renderTasks(true);
    return;
  }

  tasks=[...map.values()].sort((a,b)=>{
    const av=a.updatedAt?.toMillis?a.updatedAt.toMillis():new Date(a.updatedAt||a.createdAt||0).getTime();
    const bv=b.updatedAt?.toMillis?b.updatedAt.toMillis():new Date(b.updatedAt||b.createdAt||0).getTime();
    return bv-av;
  });

  renderTasks();
}

function renderTasks(queryFailed=false){
  const done=tasks.filter(t=>t.status==='DONE').length;
  $('taskCount').textContent=tasks.length;
  $('activeTaskCount').textContent=tasks.length-done;
  $('doneTaskCount').textContent=done;

  if(queryFailed){
    $('taskList').innerHTML='<div class="empty-workspace"><strong>Chưa tải được công việc</strong>Không thể truy vấn Work theo quyền dữ liệu hiện tại.</div>';
    return;
  }

  if(!tasks.length){
    $('taskList').innerHTML='<div class="empty-workspace"><strong>Chưa có công việc</strong>Các công việc được giao cho thành viên phòng sẽ xuất hiện tại đây.</div>';
    return;
  }

  $('taskList').innerHTML=tasks.slice(0,12).map(taskCard).join('');
}

function taskCard(t){
  const done=t.status==='DONE';
  const assigneeIds=Array.isArray(t.assigneeIds)?t.assigneeIds:[];
  const names=members.filter(m=>assigneeIds.includes(m.id)).map(m=>m.fullName||m.displayName||m.name).filter(Boolean);
  return `<a class="task-item" href="work.html">
    <div class="task-top"><strong>${esc(t.title||'Không tên')}</strong><span class="task-status ${done?'done':''}">${esc(statusLabel[t.status]||'Todo')}</span></div>
    <p class="task-description">${esc(t.description||'Chưa có mô tả')}</p>
    <div class="task-meta"><span>${esc(names.join(', ')||'Chưa xác định')}</span>${t.dueDate?`<span>Deadline ${esc(t.dueDate)}</span>`:''}</div>
  </a>`;
}

function showError(message){
  $('departmentName').textContent='Không thể mở phòng làm việc';
  $('departmentDescription').textContent=message;
  $('memberList').innerHTML=`<div class="empty-workspace"><strong>Không thể tải dữ liệu</strong>${esc(message)}</div>`;
  $('teamList').innerHTML='';
  $('taskList').innerHTML='';
}
