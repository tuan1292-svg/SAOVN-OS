import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
const initials = name => String(name || 'S').split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const position = value => String(value || '').trim() || 'Chưa xác định';
const memberName = member => member.fullName || member.displayName || member.name || member.email || 'Thành viên';
const teamName = member => String(member.team || member.teamName || member.teamLabel || member.group || member.groupName || '').trim();
const collectRoles = data => {
  const roles = data?.roles || {};
  return [...(Array.isArray(roles.system) ? roles.system : []), ...(Array.isArray(roles.organization) ? roles.organization : [])].map(v => String(v).toLowerCase());
};
const isGlobalAdmin = member => member?.isGlobalAdmin === true || collectRoles(member?.membership || {}).some(r => ['system_admin','admin','org_admin','organization_admin'].includes(r));

let currentDepartment = null;
let rendered = false;
let directoryMembers = [];

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    const departmentSnap = await getDoc(doc(db, 'departments', id));
    if (!departmentSnap.exists()) return;
    currentDepartment = { id: departmentSnap.id, ...departmentSnap.data() };

    directoryMembers = await loadDepartmentMembers();
    renderMembers(directoryMembers);
    renderTeams(directoryMembers);
    ensureMemberModal();
    rendered = true;

    const list = $('memberList');
    if (list) {
      const observer = new MutationObserver(() => {
        if (!rendered) return;
        const visibleCount = list.querySelectorAll('.member-item').length;
        if (visibleCount !== directoryMembers.length) renderMembers(directoryMembers);
      });
      observer.observe(list, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 5000);
    }
  } catch (error) {
    console.warn('Department colleagues load skipped:', error?.code || error);
  }
});

async function loadDepartmentMembers() {
  const map = new Map();

  try {
    const snap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Active identity directory unavailable:', error?.code || error);
  }

  try {
    const membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
    membershipSnap.docs.forEach(d => {
      const data = d.data() || {};
      const uid = data.userId || data.identityId || data.uid || (d.id.startsWith('mem_') ? d.id.split('_')[1] : '');
      if (!uid) return;
      const existing = map.get(uid) || { id: uid };
      map.set(uid, { ...existing, membership: data });
    });
  } catch (error) {
    console.warn('Active membership directory unavailable:', error?.code || error);
  }

  return [...map.values()]
    .map(member => {
      const m = member.membership || {};
      const nestedTeam = typeof member.team === 'object' ? member.team : null;
      const nestedMembershipTeam = typeof m.team === 'object' ? m.team : null;
      const roles = member.roles || m.roles || {};
      return {
        ...member,
        departmentId: member.departmentId || m.departmentId || '',
        department: member.department || m.department || '',
        teamId: member.teamId || m.teamId || nestedTeam?.id || nestedMembershipTeam?.id || '',
        team: typeof member.team === 'string' ? member.team : member.teamName || member.teamLabel || nestedTeam?.name || nestedTeam?.title || m.teamName || m.teamLabel || nestedMembershipTeam?.name || nestedMembershipTeam?.title || '',
        teamName: member.teamName || member.teamLabel || m.teamName || m.teamLabel || nestedTeam?.name || nestedTeam?.title || nestedMembershipTeam?.name || nestedMembershipTeam?.title || '',
        position: member.position || m.position || member.jobTitle || '',
        roles,
        phone: member.phone || member.phoneNumber || member.mobile || member.mobileNumber || m.phone || m.phoneNumber || '',
        email: member.email || member.emailAddress || m.email || '',
        isGlobalAdmin: collectRoles({ roles }).some(r => ['system_admin','admin','org_admin','organization_admin'].includes(r))
      };
    })
    .filter(member => {
      if (member.isGlobalAdmin) return true;
      const byId = String(member.departmentId || '').trim();
      if (byId) return byId === String(currentDepartment.id);
      return same(member.department, currentDepartment.name);
    })
    .sort((a, b) => {
      if (a.isGlobalAdmin !== b.isGlobalAdmin) return a.isGlobalAdmin ? -1 : 1;
      return memberName(a).localeCompare(memberName(b), 'vi');
    });
}

function renderMembers(members) {
  const list = $('memberList');
  const count = $('memberCount');
  const summary = $('memberSummary');
  if (!list) return;

  if (count) count.textContent = members.length;
  if (summary) summary.textContent = `${members.length} người`;

  if (!members.length) {
    list.innerHTML = '<div class="empty-workspace"><strong>Chưa có đồng nghiệp</strong>Chưa tìm thấy nhân sự đang hoạt động thuộc phòng này.</div>';
    return;
  }

  list.innerHTML = members.map(member => {
    const name = memberName(member);
    const team = teamName(member);
    const meta = member.isGlobalAdmin ? 'Quản trị tổ chức · Founder · Chairman · CEO' : [position(member.position), team || 'Chưa phân Team'].join(' · ');
    return `<button type="button" class="member-item member-item-link" data-member-id="${esc(member.id)}"><div class="member-avatar">${esc(initials(name))}</div><div class="member-info"><strong>${esc(name)}</strong><small>${esc(meta)}</small></div><span class="member-item-arrow">›</span></button>`;
  }).join('');
}

function renderTeams(members) {
  const list = $('teamList');
  const summary = $('teamSummary');
  if (!list) return;

  const groups = new Map();
  members.filter(member => !member.isGlobalAdmin).forEach(member => {
    const team = teamName(member) || 'Chưa phân nhóm';
    if (!groups.has(team)) groups.set(team, []);
    groups.get(team).push(member);
  });

  const entries = [...groups.entries()].sort((a, b) => a[0] === 'Chưa phân nhóm' ? 1 : b[0] === 'Chưa phân nhóm' ? -1 : a[0].localeCompare(b[0], 'vi'));
  if (summary) summary.textContent = `${entries.length} nhóm`;

  if (!entries.length) {
    list.innerHTML = '<div class="empty-workspace"><strong>Chưa có nhóm</strong>Chưa có cơ cấu Team trong phòng này.</div>';
    return;
  }

  list.innerHTML = entries.map(([team, people]) => {
    const leader = people.find(member => ['TEAM_LEAD', 'TEAM_LEADER'].includes(String(member.position || '').toUpperCase()));
    return `<article class="team-card"><div class="team-card-head"><div><span class="team-label">${team === 'Chưa phân nhóm' ? 'CHƯA PHÂN NHÓM' : 'TEAM'}</span><h3>${esc(team)}</h3>${leader ? `<div class="team-lead"><span>TRƯỞNG NHÓM</span><strong class="member-name-link" data-member-id="${esc(leader.id)}">${esc(memberName(leader))}</strong></div>` : ''}</div><strong>${people.length} người</strong></div><div class="team-members">${people.map(member => { const name = memberName(member); return `<button type="button" class="team-member-link ${leader?.id === member.id ? 'is-leader' : ''}" data-member-id="${esc(member.id)}"><i>${esc(initials(name))}</i><b>${esc(name)}</b><small>${esc(position(member.position))}</small></button>`; }).join('')}</div></article>`;
  }).join('');
}

function ensureMemberModal() {
  if ($('memberProfileModal')) return;
  const modal = document.createElement('div');
  modal.id = 'memberProfileModal';
  modal.className = 'member-profile-modal hidden';
  modal.innerHTML = `<div class="member-profile-backdrop" data-close-member-profile></div><section class="member-profile-card" role="dialog" aria-modal="true" aria-labelledby="memberProfileName"><button type="button" class="member-profile-close" data-close-member-profile aria-label="Đóng">×</button><div class="member-profile-hero"><div class="member-profile-avatar" id="memberProfileAvatar">S</div><div><span class="member-profile-eyebrow">HỒ SƠ THÀNH VIÊN</span><h2 id="memberProfileName">Thành viên</h2><p id="memberProfilePosition">Chưa xác định</p></div></div><div class="member-profile-grid"><div><span>VAI TRÒ</span><strong id="memberProfileRole">Thành viên</strong></div><div><span>PHÒNG BAN</span><strong id="memberProfileDepartment">Chưa cập nhật</strong></div><div><span>TEAM</span><strong id="memberProfileTeam">Chưa phân nhóm</strong></div><div><span>EMAIL</span><strong id="memberProfileEmail">Chưa cập nhật</strong></div><div><span>SỐ ĐIỆN THOẠI</span><strong id="memberProfilePhone">Chưa cập nhật</strong></div><div><span>TRẠNG THÁI</span><strong id="memberProfileStatus">Đang hoạt động</strong></div></div><div class="member-profile-actions"><button type="button" class="member-profile-chat" id="memberProfileChat">💬 Nhắn tin</button><button type="button" class="member-profile-work" id="memberProfileWork">▣ Công việc</button></div></section></div>`;
  document.body.appendChild(modal);
  injectMemberModalStyles();
  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('[data-member-id]');
    if (trigger && !event.target.closest('[data-close-member-profile]')) {
      event.preventDefault();
      openMemberProfile(trigger.dataset.memberId);
      return;
    }
    if (event.target.closest?.('[data-close-member-profile]')) closeMemberProfile();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMemberProfile(); });
  $('memberProfileChat').onclick = () => {
    const uid = $('memberProfileModal').dataset.memberId;
    if (uid) location.href = `chat.html?user=${encodeURIComponent(uid)}`;
  };
  $('memberProfileWork').onclick = () => { location.href = 'work.html'; };
}

async function openMemberProfile(uid) {
  if (!uid) return;
  ensureMemberModal();
  let member = directoryMembers.find(item => item.id === uid);
  if (!member) {
    try {
      const snap = await getDoc(doc(db, 'identities', uid));
      if (snap.exists()) member = { id: uid, ...snap.data() };
    } catch (error) { console.warn('Không đọc được hồ sơ thành viên:', error?.code || error); }
  }
  if (!member) return;
  const membership = member.membership || {};
  const name = memberName(member);
  const admin = isGlobalAdmin(member);
  const department = member.department || membership.department || 'Chưa cập nhật';
  const team = teamName(member) || 'Chưa phân nhóm';
  const roleLabel = admin ? 'Founder · Chairman · CEO' : position(member.position || membership.position);
  $('memberProfileModal').dataset.memberId = uid;
  $('memberProfileAvatar').textContent = initials(name);
  $('memberProfileName').textContent = name;
  $('memberProfilePosition').textContent = admin ? 'Quản trị tổ chức' : position(member.position || membership.position);
  $('memberProfileRole').textContent = roleLabel;
  $('memberProfileDepartment').textContent = department;
  $('memberProfileTeam').textContent = team;
  $('memberProfileEmail').textContent = member.email || member.emailAddress || membership.email || 'Chưa cập nhật';
  $('memberProfilePhone').textContent = member.phone || member.phoneNumber || member.mobile || member.mobileNumber || membership.phone || membership.phoneNumber || 'Chưa cập nhật';
  $('memberProfileStatus').textContent = member.status === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động';
  $('memberProfileModal').classList.remove('hidden');
  document.body.classList.add('member-profile-open');
}

function closeMemberProfile() {
  const modal = $('memberProfileModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('member-profile-open');
}

function injectMemberModalStyles() {
  if ($('memberProfileModalStyles')) return;
  const style = document.createElement('style');
  style.id = 'memberProfileModalStyles';
  style.textContent = `
.member-profile-modal{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:22px}.member-profile-modal.hidden{display:none}.member-profile-backdrop{position:absolute;inset:0;background:rgba(2,7,18,.58);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.member-profile-card{position:relative;width:min(680px,calc(100vw - 32px));max-height:min(760px,calc(100vh - 40px));overflow:auto;border:1px solid rgba(130,170,255,.18);border-radius:26px;background:linear-gradient(145deg,rgba(11,23,43,.96),rgba(5,12,25,.94));box-shadow:0 30px 90px rgba(0,0,0,.48),0 0 60px rgba(48,118,255,.1);padding:26px;color:#eef4ff}.member-profile-close{position:absolute;right:16px;top:14px;width:34px;height:34px;border:1px solid rgba(255,255,255,.1);border-radius:50%;background:rgba(255,255,255,.04);color:#b9c6d8;font-size:22px;cursor:pointer}.member-profile-hero{display:flex;align-items:center;gap:16px;padding:4px 42px 22px 2px;border-bottom:1px solid rgba(255,255,255,.08)}.member-profile-avatar{width:62px;height:62px;display:grid;place-items:center;flex:0 0 62px;border-radius:20px;background:linear-gradient(145deg,#2878ff,#4e43b8);font-weight:900;font-size:19px;box-shadow:0 12px 30px rgba(42,115,255,.22)}.member-profile-eyebrow{font-size:8px;letter-spacing:.18em;color:#6f8db8}.member-profile-hero h2{margin:6px 0 3px;font-size:24px;line-height:1.15;overflow-wrap:anywhere}.member-profile-hero p{margin:0;color:#91a3bc;font-size:11px}.member-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}.member-profile-grid>div{min-width:0;padding:13px 14px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.025)}.member-profile-grid span{display:block;font-size:7px;letter-spacing:.12em;color:#6d7e97;margin-bottom:6px}.member-profile-grid strong{display:block;font-size:10px;color:#dce7f6;overflow-wrap:anywhere}.member-profile-actions{display:flex;gap:9px;margin-top:18px}.member-profile-actions button{flex:1;min-height:42px;border-radius:11px;padding:0 14px;font-size:10px;font-weight:800;cursor:pointer}.member-profile-chat{border:1px solid #2c8bff;background:#1673ef;color:#fff}.member-profile-work{border:1px solid rgba(83,143,224,.35);background:rgba(255,255,255,.025);color:#cfe0f5}.member-item-link,.team-member-link{font:inherit;color:inherit;text-align:left;cursor:pointer}.member-item-link{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px}.member-item-link:hover{background:rgba(255,255,255,.035)}.member-item-arrow{margin-left:auto;color:#6f91bd;font-size:20px;line-height:1}.team-member-link{border:0;background:transparent;display:flex;align-items:center;gap:8px;width:100%;padding:8px;border-radius:10px}.team-member-link:hover{background:rgba(255,255,255,.035)}.team-member-link i{font-style:normal}.team-member-link b{overflow-wrap:anywhere}.team-member-link small{margin-left:auto}.member-name-link{cursor:pointer}.member-name-link:hover,.team-member-link b:hover,.member-item-link strong:hover{color:#7db5ff}.member-profile-open{overflow:hidden}@media(max-width:620px){.member-profile-modal{padding:12px}.member-profile-card{width:100%;max-height:calc(100vh - 24px);border-radius:20px;padding:20px}.member-profile-grid{grid-template-columns:1fr}.member-profile-hero h2{font-size:20px}.member-profile-actions{flex-direction:column}.team-member-link small{display:none}}
`;
  document.head.appendChild(style);
}
