import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, doc, getDocs, getDoc, setDoc, serverTimestamp, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $=id=>document.getElementById(id);
let currentUser=null,currentIsAdmin=false,departments=[];
const roleValues={ADMIN:'org_admin',MANAGER:'manager',MEMBER:'org_member'};

function collectRoles(data){const roles=data?.roles||{};return[...(Array.isArray(roles.system)?roles.system:[]),...(Array.isArray(roles.organization)?roles.organization:[])].map(v=>String(v).toLowerCase())}
function isAdminMembership(data){return collectRoles(data).some(role=>['system_admin','admin','org_admin','organization_admin'].includes(role))}
function status(text,type=''){const el=$('roleSaveStatus');if(!el)return;el.textContent=text;el.className=`role-save-status ${type}`.trim()}
function setEditorEnabled(enabled){['positionSelect','departmentInput','roleSelect','phoneInput'].forEach(id=>{const el=$(id);if(el)el.disabled=!enabled});const button=$('saveMemberBtn');if(button)button.hidden=!enabled}

async function loadDepartments(){
  try{
    const snap=await getDocs(query(collection(db,'departments'),where('active','==',true)));
    departments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  }catch(error){
    console.warn('Không tải được danh sách phòng ban:',error);
    departments=[];
  }
  renderDepartmentOptions();
}

function renderDepartmentOptions(selected=''){
  const select=$('departmentInput');
  const invite=$('inviteDepartment');
  const options=departments.map(d=>`<option value="${String(d.id).replace(/"/g,'&quot;')}">${String(d.name||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</option>`).join('');
  if(select){select.innerHTML='<option value="">Chưa phân phòng ban</option>'+options;select.value=selected||''}
  if(invite){const current=invite.value;invite.innerHTML='<option value="">Chưa phân phòng ban</option>'+options;invite.value=current||''}
}

async function loadCurrentAdmin(){
  if(!currentUser)return;
  const snap=await getDoc(doc(db,'memberships',`mem_${currentUser.uid}_org_saovn_01`));
  currentIsAdmin=snap.exists()&&isAdminMembership(snap.data());
  setEditorEnabled(currentIsAdmin);
  const userRole=$('userRole');
  if(currentIsAdmin&&userRole)userRole.textContent='Founder · Chairman · CEO';
  await loadDepartments();
}

async function populateEditor(identityId){
  if(!identityId)return;
  try{
    const[identitySnap,membershipSnap]=await Promise.all([
      getDoc(doc(db,'identities',identityId)),
      getDoc(doc(db,'memberships',`mem_${identityId}_org_saovn_01`))
    ]);
    const identity=identitySnap.exists()?identitySnap.data():{};
    const membership=membershipSnap.exists()?membershipSnap.data():{};
    const position=membership.position||identity.position||'STAFF';
    const departmentId=membership.departmentId||identity.departmentId||'';
    const legacyDepartment=membership.department||identity.department||'';
    const phone=identity.phone||identity.phoneNumber||identity.mobile||'';
    const roleList=collectRoles(membership);
    const role=roleList.includes('org_admin')||roleList.includes('admin')||roleList.includes('organization_admin')||roleList.includes('system_admin')?'ADMIN':roleList.includes('manager')||roleList.includes('org_manager')?'MANAGER':'MEMBER';

    const positionSelect=$('positionSelect');
    const roleSelect=$('roleSelect');
    if(positionSelect)positionSelect.value=positionSelect.querySelector(`option[value="${CSS.escape(position)}"]`)?position:'OTHER';
    if(roleSelect)roleSelect.value=role;

    let resolvedDepartmentId=departmentId;
    if(!resolvedDepartmentId&&legacyDepartment){
      const legacy=departments.find(d=>String(d.name||'').trim().toLowerCase()===String(legacyDepartment).trim().toLowerCase());
      if(legacy)resolvedDepartmentId=legacy.id;
    }
    renderDepartmentOptions(resolvedDepartmentId);
    if($('phoneInput'))$('phoneInput').value=phone;
    if(currentIsAdmin&&identityId===currentUser.uid&&positionSelect)positionSelect.value='FOUNDER_CHAIRMAN_CEO';
    setEditorEnabled(currentIsAdmin);
  }catch(error){console.error('Không tải được thông tin tổ chức của thành viên:',error)}
}

async function saveOrganizationFields(){
  if(!currentIsAdmin){status('Chỉ Admin mới được điều chỉnh vị trí, phòng ban và liên hệ.','error');return}
  const identityId=$('detailId')?.textContent?.trim();
  if(!identityId||identityId==='—'){status('Không xác định được thành viên.','error');return}
  const position=$('positionSelect')?.value||'STAFF';
  const departmentId=$('departmentInput')?.value||'';
  const department=departments.find(d=>d.id===departmentId)?.name||'';
  const role=$('roleSelect')?.value||'MEMBER';
  const phone=$('phoneInput')?.value?.trim()||'';
  const button=$('saveMemberBtn');
  if(button){button.disabled=true;button.textContent='Đang lưu...'}
  status('Đang cập nhật...','pending');

  try{
    const membershipRef=doc(db,'memberships',`mem_${identityId}_org_saovn_01`);
    const identityRef=doc(db,'identities',identityId);
    const membershipSnap=await getDoc(membershipRef);
    if(!membershipSnap.exists())throw new Error('Không tìm thấy Membership của thành viên.');
    const membership=membershipSnap.data();
    const nextRoles={...(membership.roles||{}),organization:[roleValues[role]||'org_member']};

    await setDoc(identityRef,{position,departmentId:departmentId||null,department,phone,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});
    await setDoc(membershipRef,{position,departmentId:departmentId||null,department,roles:nextRoles,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});

    const positionLabel=$('positionSelect')?.selectedOptions?.[0]?.textContent||position;
    if($('detailPosition'))$('detailPosition').textContent=positionLabel;
    if($('detailDepartment'))$('detailDepartment').textContent=department||'Chưa phân phòng ban';
    if($('detailPhone'))$('detailPhone').textContent=phone||'Chưa cập nhật';
    if($('detailRole'))$('detailRole').textContent=role==='ADMIN'?'Admin':role==='MANAGER'?'Manager':'Member';
    status('Đã lưu vị trí, phòng ban và thông tin liên hệ.','success');
  }catch(error){
    console.error('Lỗi cập nhật thông tin tổ chức:',error);
    status(error?.code==='permission-denied'?'Không đủ quyền cập nhật thành viên.':(error?.message||'Không thể lưu thay đổi.'),'error');
  }finally{
    if(button){button.disabled=false;button.textContent='Lưu thay đổi'}
  }
}

$('saveMemberBtn')?.addEventListener('click',saveOrganizationFields);
document.addEventListener('click',event=>{const row=event.target.closest?.('.member-row');if(!row||row.getAttribute('aria-disabled')==='true')return;const identityId=row.dataset.memberId;setTimeout(()=>populateEditor(identityId),0)});
onAuthStateChanged(auth,user=>{if(!user)return;currentUser=user;loadCurrentAdmin().catch(error=>console.error('Không tải được quyền quản trị:',error))});
