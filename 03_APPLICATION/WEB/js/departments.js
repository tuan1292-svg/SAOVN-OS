import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions, can } from './permissions.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,departments=[],members=[];

function initials(name){return String(name||'S').split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase()}
function setStatus(text,type=''){$('departmentStatus').textContent=text;$('departmentStatus').className=`form-status ${type}`.trim()}
// Use the permission alias layer rather than asking hasPermission() for a
// legacy capability name that is not stored in the runtime permission Set.
function canView(){return can('departments','read')}
function canManage(){return can('departments','manage')}

onAuthStateChanged(auth,async u=>{
  if(!u){location.replace('index.html');return}
  user=u;
  await getPermissions();
  if(!canView()){location.replace('dashboard.html');return}

  const displayName=u.displayName||'Thành viên';
  if($('userName')) $('userName').textContent=displayName;
  if($('userAvatar')) $('userAvatar').textContent=initials(displayName);
  if($('userRole')) $('userRole').textContent=canManage()?'Founder · Chairman · CEO':'Workspace member';

  if(!canManage()){
    $('adminPageActions')?.remove();
    $('departmentOverlay')?.remove();
    $('adminOnlyNote')?.removeAttribute('hidden');
  }

  await loadAll();
});

async function loadAll(){
  if($('syncState')) $('syncState').innerHTML='<i></i> Đang đồng bộ...';
  try{
    const departmentSnap=await getDocs(collection(db,'departments'));
    departments=departmentSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));

    // Directory visibility can legitimately differ from department visibility.
    // If identities is denied, keep departments usable instead of making the
    // whole page look broken; member counts simply fall back to zero.
    try{
      const identitySnap=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
      members=identitySnap.docs.map(d=>({id:d.id,...d.data()}));
    }catch(error){
      console.warn('Active identity directory unavailable:',error?.code||error);
      members=[];
    }

    render();
    if($('syncState')) $('syncState').innerHTML='<i></i> Firebase · Đã đồng bộ';
  }catch(error){
    console.error('Department load error:',error);
    if($('syncState')) $('syncState').innerHTML='<i style="background:#ff3b3b"></i> Firebase · Lỗi';
    setStatus(error?.code==='permission-denied'?'Firestore Rules chưa cho phép đọc departments.':'Không thể tải dữ liệu phòng ban.','error');
    $('emptyState')?.removeAttribute('hidden');
  }
}

function render(){
  const q=String($('searchInput')?.value||'').trim().toLowerCase();
  const status=$('statusFilter')?.value||'ALL';
  const filtered=departments.filter(d=>
    (!q||`${d.name||''} ${d.code||''} ${d.description||''}`.toLowerCase().includes(q))&&
    (status==='ALL'||(status==='ACTIVE'?d.active!==false:d.active===false))
  );

  if($('departmentCount')) $('departmentCount').textContent=departments.filter(d=>d.active!==false).length;
  if($('assignedMemberCount')) $('assignedMemberCount').textContent=members.filter(m=>m.departmentId||m.department).length;
  if($('unassignedMemberCount')) $('unassignedMemberCount').textContent=members.filter(m=>!(m.departmentId||m.department)).length;

  if($('emptyState')) $('emptyState').hidden=filtered.length>0;
  if($('departmentGrid')) $('departmentGrid').innerHTML=filtered.map(card).join('');
  $('departmentGrid')?.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  $('departmentGrid')?.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>location.href=`department-workspace.html?id=${encodeURIComponent(b.dataset.open)}`);
}

function headName(id){
  const m=members.find(x=>x.id===id);
  return m?.fullName||m?.displayName||m?.name||'Chưa xác định';
}

function memberCount(department){
  return members.filter(m=>m.departmentId===department.id || (!m.departmentId&&String(m.department||'').trim().toLowerCase()===String(department.name||'').trim().toLowerCase())).length;
}

function card(d){
  return `<article class="department-card">
    <div>
      <div class="department-card-head"><div><span class="department-code">${esc(d.code||'DEPT')}</span><h3>${esc(d.name||'Không tên')}</h3></div><span class="department-badge ${d.active===false?'inactive':''}">${d.active===false?'Ngừng hoạt động':'Đang hoạt động'}</span></div>
      <p class="department-description">${esc(d.description||'Chưa có mô tả phòng ban.')}</p>
      <div class="department-meta"><div><small>THÀNH VIÊN</small><strong>${memberCount(d)} người</strong></div><div><small>TRƯỞNG PHÒNG</small><strong>${esc(headName(d.headId))}</strong></div></div>
    </div>
    <div class="department-card-actions"><button type="button" class="workspace-open" data-open="${esc(d.id)}">Mở phòng làm việc</button>${canManage()?`<button type="button" data-edit="${esc(d.id)}">Chỉnh sửa</button>`:''}</div>
  </article>`;
}

function openDialog(){
  if(!canManage())return;
  $('departmentOverlay').hidden=false;
  requestAnimationFrame(()=>$('departmentOverlay').classList.add('open'));
  setTimeout(()=>$('departmentName').focus(),60);
}
function closeDialog(){
  $('departmentOverlay')?.classList.remove('open');
  setTimeout(()=>{if($('departmentOverlay'))$('departmentOverlay').hidden=true},120);
}

function populateHeads(selected=''){
  const options=members.filter(m=>m.id).sort((a,b)=>String(a.fullName||a.displayName||a.name||'').localeCompare(String(b.fullName||b.displayName||b.name||''),'vi'));
  $('departmentHead').innerHTML='<option value="">Chưa xác định</option>'+options.map(m=>`<option value="${esc(m.id)}">${esc(m.fullName||m.displayName||m.name||'Thành viên')}</option>`).join('');
  $('departmentHead').value=selected||'';
}

function openCreate(){
  if(!canManage())return;
  $('departmentDialogTitle').textContent='Thêm phòng ban';
  $('departmentForm').reset();
  $('departmentId').value='';
  $('departmentActive').checked=true;
  populateHeads();
  setStatus('');
  openDialog();
}

function openEdit(id){
  if(!canManage())return;
  const d=departments.find(x=>x.id===id);
  if(!d)return;
  $('departmentDialogTitle').textContent='Chỉnh sửa phòng ban';
  $('departmentId').value=d.id;
  $('departmentName').value=d.name||'';
  $('departmentCode').value=d.code||'';
  $('departmentDescription').value=d.description||'';
  $('departmentActive').checked=d.active!==false;
  populateHeads(d.headId||'');
  setStatus('');
  openDialog();
}

if($('addDepartmentBtn'))$('addDepartmentBtn').onclick=openCreate;
if($('refreshBtn'))$('refreshBtn').onclick=loadAll;
if($('dialogClose'))$('dialogClose').onclick=closeDialog;
if($('dialogCancel'))$('dialogCancel').onclick=closeDialog;
if($('departmentOverlay'))$('departmentOverlay').onclick=e=>{if(e.target.id==='departmentOverlay')closeDialog()};
$('searchInput')?.addEventListener('input',render);
$('statusFilter')?.addEventListener('change',render);
$('logoutBtn')?.addEventListener('click',()=>signOut(auth));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDialog()});

if($('departmentForm'))$('departmentForm').onsubmit=async e=>{
  e.preventDefault();
  if(!canManage())return;
  const id=$('departmentId').value.trim();
  const name=$('departmentName').value.trim();
  const code=$('departmentCode').value.trim().toUpperCase();
  const description=$('departmentDescription').value.trim();
  const headId=$('departmentHead').value||null;
  const active=$('departmentActive').checked;
  const button=$('saveDepartmentBtn');
  if(!name||!code)return;
  if(departments.some(d=>d.id!==id&&String(d.code||'').toUpperCase()===code)){
    setStatus('Mã phòng ban đã tồn tại.','error');
    return;
  }
  button.disabled=true;button.textContent='Đang lưu...';setStatus('Đang cập nhật...','pending');
  try{
    const data={name,code,description,headId,active,updatedAt:serverTimestamp(),updatedBy:user.uid};
    if(id)await setDoc(doc(db,'departments',id),data,{merge:true});
    else await addDoc(collection(db,'departments'),{...data,createdAt:serverTimestamp(),createdBy:user.uid});
    setStatus('Đã lưu phòng ban.','success');
    await loadAll();
    setTimeout(closeDialog,350);
  }catch(error){
    console.error('Department save error:',error);
    setStatus(error?.code==='permission-denied'?'Không đủ quyền Firestore để quản lý phòng ban.':error?.message||'Không thể lưu phòng ban.','error');
  }finally{button.disabled=false;button.textContent='Lưu phòng ban'}
};
