import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
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
function memberFrom(identity, membership, fallbackId) { const id=identity.id||fallbackId; const roles=collectRoles(membership); const statusRaw=String(membership?.status||identity?.status||'ACTIVE').toUpperCase(); const status=['PENDING','SUSPENDED'].includes(statusRaw)?statusRaw:'ACTIVE'; const name=identity.displayName||identity.name||identity.fullName||identity.email||id; return {id,name,email:identity.email||identity.emailAddress||'',role:normalizeRole(roles.join(' ')),status,joinedAt:membership?.joinedAt||membership?.createdAt||identity?.createdAt||null,membershipId:membership?.id||null}; }

async function loadMembers() {
  const resultCount=$('resultCount'); if(resultCount) resultCount.textContent='Đang tải...';
  try {
    const identitySnap=await getDocs(collection(db,'identities')); const membershipSnap=await getDocs(collection(db,'memberships')); const membershipsByUid=new Map();
    membershipSnap.forEach(s=>{const d=s.data(); const uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1]; if(uid) membershipsByUid.set(uid,{...d,id:s.id});});
    members=identitySnap.docs.map(s=>memberFrom({...s.data(),id:s.id},membershipsByUid.get(s.id),s.id));
    if(!members.length&&currentUid){const own=await getDoc(doc(db,'identities',currentUid));const ownMem=await getDoc(doc(db,'memberships',`mem_${currentUid}_org_saovn_01`));if(own.exists())members=[memberFrom({...own.data(),id:currentUid},ownMem.exists()?{...ownMem.data(),id:ownMem.id}:{},currentUid)];}
    render();
  } catch(error) {
    console.error('Lỗi tải thành viên:',error);
    try{if(currentUid){const own=await getDoc(doc(db,'identities',currentUid));const ownMem=await getDoc(doc(db,'memberships',`mem_${currentUid}_org_saovn_01`));members=own.exists()?[memberFrom({...own.data(),id:currentUid},ownMem.exists()?{...ownMem.data(),id:ownMem.id}:{},currentUid)]:[];}}catch(_){members=[];}
    render(); if(resultCount) resultCount.textContent='Không thể tải toàn bộ danh sách với quyền hiện tại';
  }
}

function render() {
  const search=$('searchInput'),status=$('statusFilter'),role=$('roleFilter');
  if(!search||!status||!role)return;
  const q=search.value.trim().toLowerCase(),sf=status.value,rf=role.value; const filtered=members.filter(m=>(!q?true:`${m.name} ${m.email}`.toLowerCase().includes(q))&&(sf==='ALL'||m.status===sf)&&(rf==='ALL'||m.role===rf));
  if($('totalMembers'))$('totalMembers').textContent=members.length; if($('activeMembers'))$('activeMembers').textContent=members.filter(m=>m.status==='ACTIVE').length; if($('adminMembers'))$('adminMembers').textContent=members.filter(m=>m.role==='ADMIN'||m.role==='MANAGER').length; if($('inactiveMembers'))$('inactiveMembers').textContent=members.filter(m=>m.status!=='ACTIVE').length; if($('resultCount'))$('resultCount').textContent=`${filtered.length} thành viên`; if($('emptyState'))$('emptyState').hidden=filtered.length>0;
  const list=$('memberList'); if(!list)return;
  list.innerHTML=filtered.map(m=>`<div class="member-row" data-member-id="${safe(m.id)}" tabindex="0" role="button"><div class="member-info"><div class="member-avatar">${safe(initials(m.name))}</div><div><strong>${safe(m.name)}</strong><small>${safe(m.email)}</small></div></div><span class="role ${m.role}">${safe(roleLabel(m.role))}</span><span class="status ${m.status}">${safe(statusLabel(m.status))}</span><span class="joined">${formatDate(m.joinedAt)}</span></div>`).join('');
  document.querySelectorAll('.member-row').forEach(row=>{const open=()=>openMemberDetail(members.find(m=>m.id===row.dataset.memberId));row.addEventListener('click',open);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}

function openMemberDetail(member) {
  if(!member)return; currentMember=member;
  const fields={detailAvatar:initials(member.name),detailName:member.name,detailEmail:member.email||'Không có email',detailRole:roleLabel(member.role),detailStatus:statusLabel(member.status),detailJoined:formatDate(member.joinedAt),detailId:member.id};
  Object.entries(fields).forEach(([id,value])=>{const el=$(id);if(el)el.textContent=value;});
  const roleSelect=$('roleSelect'); if(roleSelect)roleSelect.value=member.role;
  const saveStatus=$('roleSaveStatus'); if(saveStatus){saveStatus.textContent='';saveStatus.className='role-save-status';}
  const permissionGrid=$('permissionGrid'); if(permissionGrid)renderPermissionGrid(permissionGrid,member.role);
  const overlay=$('memberDetailOverlay'); if(!overlay)return; overlay.hidden=false; requestAnimationFrame(()=>overlay.classList.add('open'));
}
function closeMemberDetail(){const overlay=$('memberDetailOverlay');if(!overlay)return;overlay.classList.remove('open');setTimeout(()=>overlay.hidden=true,120);currentMember=null;}
function formatDate(value){if(!value)return'—';try{const d=value?.toDate?value.toDate():new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('vi-VN');}catch{return'—';}}

[['searchInput','input'],['statusFilter','change'],['roleFilter','change']].forEach(([id,event])=>$(id)?.addEventListener(event,render));
$('refreshBtn')?.addEventListener('click',loadMembers); $('logoutBtn')?.addEventListener('click',()=>signOut(auth)); $('detailClose')?.addEventListener('click',closeMemberDetail); $('memberDetailOverlay')?.addEventListener('click',e=>{if(e.target.id==='memberDetailOverlay')closeMemberDetail();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMemberDetail();});
$('roleSelect')?.addEventListener('change',e=>{renderPermissionGrid($('permissionGrid'),e.target.value);const s=$('roleSaveStatus');if(s){s.textContent='Thay đổi chưa lưu';s.className='role-save-status pending';}});
$('saveRoleBtn')?.addEventListener('click',async()=>{if(!currentMember)return;const role=$('roleSelect')?.value;const button=$('saveRoleBtn');if(!button)return;button.disabled=true;button.textContent='Đang lưu...';const s=$('roleSaveStatus');if(s)s.textContent='';try{if(!currentMember.membershipId)throw new Error('Thành viên này chưa có Membership trong workspace.');await saveMemberRole(currentMember.membershipId,role);currentMember.role=role;const target=members.find(m=>m.id===currentMember.id);if(target)target.role=role;if($('detailRole'))$('detailRole').textContent=roleLabel(role);if(s){s.textContent='Đã lưu vai trò thành công.';s.className='role-save-status success';}render();}catch(error){console.error('Lỗi lưu vai trò:',error);if(s){s.textContent=error?.message||'Không thể lưu vai trò.';s.className='role-save-status error';}}finally{button.disabled=false;button.textContent='Lưu vai trò';}});

onAuthStateChanged(auth,async user=>{if(!user){location.href='index.html';return;}currentUid=user.uid;if($('userName'))$('userName').textContent=user.displayName||user.email?.split('@')[0]||'User';if($('userAvatar'))$('userAvatar').textContent=initials(user.displayName||user.email?.split('@')[0]);await loadMembers();});