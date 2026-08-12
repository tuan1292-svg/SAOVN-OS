import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { renderPermissionGrid, saveMemberRole } from './role-permissions.js';

const $ = id => document.getElementById(id);
let currentUid = null;
let currentMember = null;
let members = [];

const normalizeRole = role => { const r = String(role || '').toLowerCase(); if (r.includes('admin')) return 'ADMIN'; if (r.includes('manager')) return 'MANAGER'; return 'MEMBER'; };
const roleLabel = role => ({ADMIN:'Admin',MANAGER:'Manager',MEMBER:'Member'})[role] || role;
const statusLabel = status => ({ACTIVE:'Active',PENDING:'Pending',SUSPENDED:'Suspended'})[status] || status;
const initials = name => String(name || 'U').split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase();
const safe = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function collectRoles(data) { const roles=data?.roles||{}; return [...(Array.isArray(roles.system)?roles.system:[]),...(Array.isArray(roles.organization)?roles.organization:[]),...(Array.isArray(data?.role)?data.role:[data?.role].filter(Boolean))]; }
function memberFrom(identity, membership, fallbackId) { const id=identity.id||fallbackId; const roles=collectRoles(membership); const statusRaw=String(membership?.status||identity?.status||'ACTIVE').toUpperCase(); const status=['PENDING','SUSPENDED'].includes(statusRaw)?statusRaw:'ACTIVE'; const name=identity.displayName||identity.name||identity.fullName||identity.email||id; return {id,name,email:identity.email||identity.emailAddress||'',role:normalizeRole(roles.join(' ')),status,joinedAt:membership?.joinedAt||membership?.createdAt||identity?.createdAt||null,membershipId:membership?.id||null,type:'member'}; }
function invitationFrom(snapshot) { const d=snapshot.data(); return {id:`invite_${snapshot.id}`,name:d.email||'Lời mời thành viên',email:d.email||'',role:normalizeRole(d.role),status:'PENDING',joinedAt:d.createdAt||null,membershipId:null,type:'invitation',inviteId:snapshot.id}; }

async function loadMembers() {
  const resultCount=$('resultCount'); if(resultCount) resultCount.textContent='Đang tải...';
  try {
    const identitySnap=await getDocs(collection(db,'identities'));
    const membershipSnap=await getDocs(collection(db,'memberships'));
    const membershipsByUid=new Map();
    membershipSnap.forEach(s=>{const d=s.data(); const uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1]; if(uid) membershipsByUid.set(uid,{...d,id:s.id});});
    const activeMembers=identitySnap.docs.map(s=>memberFrom({...s.data(),id:s.id},membershipsByUid.get(s.id),s.id));

    let pendingInvites=[];
    try {
      const invitationSnap=await getDocs(collection(db,'invitations'));
      pendingInvites=invitationSnap.docs.filter(s=>String(s.data()?.status||'PENDING').toUpperCase()==='PENDING').map(invitationFrom);
    } catch(inviteError) {
      console.warn('Không thể đọc invitations:',inviteError);
    }

    members=[...activeMembers,...pendingInvites];
    if(!members.length&&currentUid){
      const own=await getDoc(doc(db,'identities',currentUid));
      const ownMem=await getDoc(doc(db,'memberships',`mem_${currentUid}_org_saovn_01`));
      if(own.exists())members=[memberFrom({...own.data(),id:currentUid},ownMem.exists()?{...ownMem.data(),id:ownMem.id}:{},currentUid)];
    }
    render();
  } catch(error) {
    console.error('Lỗi tải thành viên:',error);
    try{if(currentUid){const own=await getDoc(doc(db,'identities',currentUid));const ownMem=await getDoc(doc(db,'memberships',`mem_${currentUid}_org_saovn_01`));members=own.exists()?[memberFrom({...own.data(),id:currentUid},ownMem.exists()?{...ownMem.data(),id:ownMem.id}:{},currentUid)]:[];}}catch(_){members=[];}
    render(); if(resultCount) resultCount.textContent='Không thể tải toàn bộ danh sách với quyền hiện tại';
  }
}

function render() {
  const search=$('searchInput'),status=$('statusFilter'),role=$('roleFilter'); if(!search||!status||!role)return;
  const q=search.value.trim().toLowerCase(),sf=status.value,rf=role.value;
  const filtered=members.filter(m=>(!q?true:`${m.name} ${m.email}`.toLowerCase().includes(q))&&(sf==='ALL'||m.status===sf)&&(rf==='ALL'||m.role===rf));
  if($('totalMembers'))$('totalMembers').textContent=members.length;
  if($('activeMembers'))$('activeMembers').textContent=members.filter(m=>m.status==='ACTIVE').length;
  if($('adminMembers'))$('adminMembers').textContent=members.filter(m=>m.role==='ADMIN'||m.role==='MANAGER').length;
  if($('inactiveMembers'))$('inactiveMembers').textContent=members.filter(m=>m.status!=='ACTIVE').length;
  if($('resultCount'))$('resultCount').textContent=`${filtered.length} thành viên`;
  if($('emptyState'))$('emptyState').hidden=filtered.length>0;
  const list=$('memberList'); if(!list)return;
  list.innerHTML=filtered.map(m=>`<div class="member-row ${m.type==='invitation'?'is-pending-invite':''}" data-member-id="${safe(m.id)}" tabindex="0" role="button"><div class="member-info"><div class="member-avatar">${safe(initials(m.name))}</div><div><strong>${safe(m.name)}</strong><small>${safe(m.email)}</small></div></div><span class="role ${m.role}">${safe(roleLabel(m.role))}</span><span class="status ${m.status}">${safe(statusLabel(m.status))}</span><span class="joined">${formatDate(m.joinedAt)}</span></div>`).join('');
  document.querySelectorAll('.member-row').forEach(row=>{const open=()=>{const member=members.find(m=>m.id===row.dataset.memberId);if(member?.type==='invitation')return;openMemberDetail(member);};row.addEventListener('click',open);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}

function openMemberDetail(member) {
  if(!member)return; currentMember=member;
  const fields={detailAvatar:initials(member.name),detailName:member.name,detailEmail:member.email||'Không có email',detailRole:roleLabel(member.role),detailStatus:statusLabel(member.status),detailJoined:formatDate(member.joinedAt),detailId:member.id}; Object.entries(fields).forEach(([id,value])=>{const el=$(id);if(el)el.textContent=value;});
  const roleSelect=$('roleSelect'); if(roleSelect)roleSelect.value=member.role; const saveStatus=$('roleSaveStatus'); if(saveStatus){saveStatus.textContent='';saveStatus.className='role-save-status';} const permissionGrid=$('permissionGrid'); if(permissionGrid)renderPermissionGrid(permissionGrid,member.role);
  const overlay=$('memberDetailOverlay'); if(!overlay)return; overlay.hidden=false; requestAnimationFrame(()=>overlay.classList.add('open'));
}
function closeMemberDetail(){const overlay=$('memberDetailOverlay');if(!overlay)return;overlay.classList.remove('open');setTimeout(()=>overlay.hidden=true,120);currentMember=null;}
function openInvite(){const overlay=$('inviteOverlay');if(!overlay)return;const form=$('inviteForm');if(form)form.reset();const status=$('inviteStatus');if(status){status.textContent='';status.className='role-save-status';}const result=$('inviteResult');if(result)result.hidden=true;const code=$('inviteCode');if(code)code.textContent='—';overlay.hidden=false;requestAnimationFrame(()=>overlay.classList.add('open'));setTimeout(()=>$('inviteEmail')?.focus(),60);}
function closeInvite(){const overlay=$('inviteOverlay');if(!overlay)return;overlay.classList.remove('open');setTimeout(()=>overlay.hidden=true,120);}
function formatDate(value){if(!value)return'—';try{const d=value?.toDate?value.toDate():new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('vi-VN');}catch{return'—';}}
function createInviteCode(){const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase().match(/.{1,4}/g).join('-');}

async function createManualInvitation() {
  const email=String($('inviteEmail')?.value||'').trim().toLowerCase(); const role=String($('inviteRole')?.value||'MEMBER').toUpperCase(); const status=$('inviteStatus'); const button=$('sendInviteBtn');
  if(!email)return;
  if(status){status.textContent='Đang tạo mã mời...';status.className='role-save-status pending';} if(button){button.disabled=true;button.textContent='Đang tạo...';}
  try {
    const duplicate=await getDocs(collection(db,'invitations')); const exists=duplicate.docs.some(s=>String(s.data()?.email||'').toLowerCase()===email && String(s.data()?.status||'PENDING').toUpperCase()==='PENDING');
    if(exists)throw new Error('Email này đang có một lời mời chờ xử lý.');
    const code=createInviteCode();
    await addDoc(collection(db,'invitations'),{email,role,status:'PENDING',organizationId:'org_saovn_01',invitedBy:auth.currentUser.uid,inviteCode:code,delivery:'MANUAL',createdAt:serverTimestamp()});
    if($('inviteCode'))$('inviteCode').textContent=code; if($('inviteResult'))$('inviteResult').hidden=false; if(status){status.textContent='Đã tạo mã mời. Không có email nào được gửi tự động.';status.className='role-save-status success';}
    if($('sendInviteBtn'))$('sendInviteBtn').textContent='Tạo mã khác';
    await loadMembers();
  } catch(error) { console.error('Lỗi tạo mã mời:',error); if(status){status.textContent=error?.message||'Không thể tạo mã mời.';status.className='role-save-status error';} }
  finally {if(button)button.disabled=false;}
}

[['searchInput','input'],['statusFilter','change'],['roleFilter','change']].forEach(([id,event])=>$(id)?.addEventListener(event,render));
$('refreshBtn')?.addEventListener('click',loadMembers); $('logoutBtn')?.addEventListener('click',()=>signOut(auth)); $('detailClose')?.addEventListener('click',closeMemberDetail); $('memberDetailOverlay')?.addEventListener('click',e=>{if(e.target.id==='memberDetailOverlay')closeMemberDetail();});
$('inviteMemberBtn')?.addEventListener('click',openInvite); $('inviteClose')?.addEventListener('click',closeInvite); $('inviteOverlay')?.addEventListener('click',e=>{if(e.target.id==='inviteOverlay')closeInvite();}); $('inviteForm')?.addEventListener('submit',e=>{e.preventDefault();createManualInvitation();});
$('copyInviteCode')?.addEventListener('click',async()=>{const code=$('inviteCode')?.textContent;if(!code||code==='—')return;try{await navigator.clipboard.writeText(code);const b=$('copyInviteCode');b.textContent='Đã sao chép';setTimeout(()=>b.textContent='Sao chép',1500);}catch{const status=$('inviteStatus');if(status){status.textContent='Không thể sao chép tự động. Hãy copy mã bằng tay.';status.className='role-save-status error';}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMemberDetail();closeInvite();}});
$('roleSelect')?.addEventListener('change',e=>{renderPermissionGrid($('permissionGrid'),e.target.value);const s=$('roleSaveStatus');if(s){s.textContent='Thay đổi chưa lưu';s.className='role-save-status pending';}});
$('saveRoleBtn')?.addEventListener('click',async()=>{if(!currentMember)return;const role=$('roleSelect')?.value;const button=$('saveRoleBtn');if(!button)return;button.disabled=true;button.textContent='Đang lưu...';const s=$('roleSaveStatus');if(s)s.textContent='';try{if(!currentMember.membershipId)throw new Error('Thành viên này chưa có Membership trong workspace.');await saveMemberRole(currentMember.membershipId,role);currentMember.role=role;const target=members.find(m=>m.id===currentMember.id);if(target)target.role=role;if($('detailRole'))$('detailRole').textContent=roleLabel(role);if(s){s.textContent='Đã lưu vai trò thành công.';s.className='role-save-status success';}render();}catch(error){console.error('Lỗi lưu vai trò:',error);if(s){s.textContent=error?.message||'Không thể lưu vai trò.';s.className='role-save-status error';}}finally{button.disabled=false;button.textContent='Lưu vai trò';}});

onAuthStateChanged(auth,async user=>{if(!user){location.href='index.html';return;}currentUid=user.uid;if($('userName'))$('userName').textContent=user.displayName||user.email?.split('@')[0]||'User';if($('userAvatar'))$('userAvatar').textContent=initials(user.displayName||user.email?.split('@')[0]);await loadMembers();});