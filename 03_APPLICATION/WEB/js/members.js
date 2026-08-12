import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
let currentUid = null;
let members = [];

const normalizeRole = role => {
  const r = String(role || '').toLowerCase();
  if (r.includes('admin')) return 'ADMIN';
  if (r.includes('manager')) return 'MANAGER';
  return 'MEMBER';
};
const roleLabel = role => ({ADMIN:'Admin',MANAGER:'Manager',MEMBER:'Member'})[role] || role;
const statusLabel = status => ({ACTIVE:'Active',PENDING:'Pending',SUSPENDED:'Suspended'})[status] || status;
const initials = name => String(name || 'U').split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase();
const safe = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function collectRoles(data) {
  const roles = data?.roles || {};
  return [
    ...(Array.isArray(roles.system) ? roles.system : []),
    ...(Array.isArray(roles.organization) ? roles.organization : []),
    ...(Array.isArray(data?.role) ? data.role : [data?.role].filter(Boolean))
  ];
}

function memberFrom(identity, membership, fallbackId) {
  const id = identity.id || fallbackId;
  const roles = collectRoles(membership);
  const statusRaw = String(membership?.status || identity?.status || 'ACTIVE').toUpperCase();
  const status = ['PENDING','SUSPENDED'].includes(statusRaw) ? statusRaw : 'ACTIVE';
  const name = identity.displayName || identity.name || identity.fullName || identity.email || id;
  return {
    id, name, email: identity.email || identity.emailAddress || '',
    role: normalizeRole(roles.join(' ')), status,
    joinedAt: membership?.joinedAt || membership?.createdAt || identity?.createdAt || null
  };
}

async function loadMembers() {
  $('resultCount').textContent = 'Đang tải...';
  try {
    const identitySnap = await getDocs(collection(db, 'identities'));
    const membershipSnap = await getDocs(collection(db, 'memberships'));
    const membershipsByUid = new Map();
    membershipSnap.forEach(s => {
      const d = s.data();
      const uid = d.identityId || d.userId || d.uid || s.id.match(/^mem_(.+)_org_/)?.[1];
      if (uid) membershipsByUid.set(uid, d);
    });

    members = identitySnap.docs.map(s => memberFrom({...s.data(), id:s.id}, membershipsByUid.get(s.id), s.id));
    if (!members.length && currentUid) {
      const own = await getDoc(doc(db, 'identities', currentUid));
      const ownMem = await getDoc(doc(db, 'memberships', `mem_${currentUid}_org_saovn_01`));
      if (own.exists()) members = [memberFrom({...own.data(),id:currentUid}, ownMem.exists()?ownMem.data():{}, currentUid)];
    }
    render();
  } catch (error) {
    console.error('Lỗi tải thành viên:', error);
    try {
      if (currentUid) {
        const own = await getDoc(doc(db, 'identities', currentUid));
        const ownMem = await getDoc(doc(db, 'memberships', `mem_${currentUid}_org_saovn_01`));
        members = own.exists() ? [memberFrom({...own.data(),id:currentUid}, ownMem.exists()?ownMem.data():{}, currentUid)] : [];
      }
    } catch (_) { members = []; }
    render();
    $('resultCount').textContent = 'Không thể tải toàn bộ danh sách với quyền hiện tại';
  }
}

function render() {
  const q = $('searchInput').value.trim().toLowerCase();
  const sf = $('statusFilter').value;
  const rf = $('roleFilter').value;
  const filtered = members.filter(m => (!q || `${m.name} ${m.email}`.toLowerCase().includes(q)) && (sf==='ALL'||m.status===sf) && (rf==='ALL'||m.role===rf));
  $('totalMembers').textContent = members.length;
  $('activeMembers').textContent = members.filter(m=>m.status==='ACTIVE').length;
  $('adminMembers').textContent = members.filter(m=>m.role==='ADMIN'||m.role==='MANAGER').length;
  $('inactiveMembers').textContent = members.filter(m=>m.status!=='ACTIVE').length;
  $('resultCount').textContent = `${filtered.length} thành viên`;
  $('emptyState').hidden = filtered.length > 0;
  $('memberList').innerHTML = filtered.map(m => `<div class="member-row">
    <div class="member-info"><div class="member-avatar">${safe(initials(m.name))}</div><div><strong>${safe(m.name)}</strong><small>${safe(m.email)}</small></div></div>
    <span class="role ${m.role}">${safe(roleLabel(m.role))}</span>
    <span class="status ${m.status}">${safe(statusLabel(m.status))}</span>
    <span class="joined">${formatDate(m.joinedAt)}</span>
  </div>`).join('');
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
  } catch { return '—'; }
}

$('searchInput').addEventListener('input', render);
$('statusFilter').addEventListener('change', render);
$('roleFilter').addEventListener('change', render);
$('refreshBtn').addEventListener('click', loadMembers);
$('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async user => {
  if (!user) { location.href = 'index.html'; return; }
  currentUid = user.uid;
  $('userName').textContent = user.displayName || user.email?.split('@')[0] || 'User';
  $('userAvatar').textContent = initials(user.displayName || user.email?.split('@')[0]);
  await loadMembers();
});
