import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Recovery layer: never replaces members.js. It only restores the directory
// when the legacy renderer is still empty after the shared runtime is ready.
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials = value => String(value || 'U').split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
const positions = {INTERN:'Thực tập sinh',COLLABORATOR:'Cộng tác viên',STAFF:'Nhân viên',SPECIALIST:'Chuyên viên',SENIOR_SPECIALIST:'Chuyên viên cao cấp',TEAM_LEAD:'Trưởng nhóm',MANAGER:'Quản lý',DEPARTMENT_HEAD:'Trưởng phòng',DIRECTOR:'Giám đốc',FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO',OTHER:'Khác'};
const role = data => { const values = [...(Array.isArray(data?.roles?.system)?data.roles.system:[]),...(Array.isArray(data?.roles?.organization)?data.roles.organization:[])].map(x=>String(x).toUpperCase()); if(values.some(x=>['ADMIN','ORG_ADMIN','SYSTEM_ADMIN','ORGANIZATION_ADMIN'].includes(x)))return'ADMIN'; if(values.some(x=>['MANAGER','ORG_MANAGER'].includes(x)))return'MANAGER'; return'MEMBER'; };
const position = data => positions[String(data?.position||data?.jobTitle||'STAFF').toUpperCase()] || String(data?.position||data?.jobTitle||'Nhân viên');

async function recover(user){
  const list = $('memberList');
  if(!user || !list || list.children.length) return;
  try {
    const [identitySnap, membershipSnap] = await Promise.all([
      getDocs(query(collection(db,'identities'), where('status','==','ACTIVE'))),
      getDocs(query(collection(db,'memberships'), where('status','==','ACTIVE')))
    ]);
    const membershipByUid = new Map();
    membershipSnap.forEach(s => { const d=s.data(); const uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1]; if(uid) membershipByUid.set(uid,d); });
    const rows = identitySnap.docs.map(s => {
      const identity={id:s.id,...s.data()}; const membership=membershipByUid.get(s.id)||{}; const name=identity.displayName||identity.fullName||identity.name||identity.email||s.id;
      return {id:s.id,name,position:position({...identity,...membership}),role:role(membership),status:'ACTIVE',joinedAt:membership.joinedAt||membership.createdAt||identity.createdAt};
    });
    if(!rows.length) return;
    list.innerHTML=rows.map(m=>`<div class="member-row" data-member-id="${esc(m.id)}" tabindex="0" role="button"><div class="member-info"><div class="member-avatar">${esc(initials(m.name))}</div><div><strong>${esc(m.name)}</strong><small class="member-position">${esc(m.position)}</small></div></div><span class="role ${m.role}">${m.role==='ADMIN'?'Admin':m.role==='MANAGER'?'Manager':'Member'}</span><span class="status ACTIVE">Active</span><span class="joined">—</span></div>`).join('');
    if($('totalMembers'))$('totalMembers').textContent=rows.length;
    if($('activeMembers'))$('activeMembers').textContent=rows.length;
    if($('adminMembers'))$('adminMembers').textContent=rows.filter(x=>x.role!=='MEMBER').length;
    if($('inactiveMembers'))$('inactiveMembers').textContent='0';
    if($('resultCount'))$('resultCount').textContent=`${rows.length} thành viên`;
    if($('emptyState'))$('emptyState').hidden=true;
  } catch(error) {
    console.warn('[SAOVN][MEMBERS][RECOVERY] directory recovery skipped:',error?.code||error);
  }
}

onAuthStateChanged(auth, user => {
  if(!user) return;
  const run = () => setTimeout(() => recover(user), 900);
  if(document.documentElement.dataset.saovnIdentityReady === 'true') run();
  else window.addEventListener('saovn:shell-ready', run, {once:true});
});
