import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const initials = name => String(name || 'S').split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const position = value => String(value || '').trim() || 'Chưa xác định';

let currentDepartment = null;
let rendered = false;

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    const departmentSnap = await getDoc(doc(db, 'departments', id));
    if (!departmentSnap.exists()) return;
    currentDepartment = { id: departmentSnap.id, ...departmentSnap.data() };

    const members = await loadDepartmentMembers();
    renderMembers(members);
    renderTeams(members);
    rendered = true;

    // department-workspace.js can finish its own bootstrap after this module.
    // Re-apply once so a member account is never left with only its own identity.
    const list = $('memberList');
    if (list) {
      const observer = new MutationObserver(() => {
        if (!rendered) return;
        const visibleCount = list.querySelectorAll('.member-item').length;
        if (visibleCount !== members.length) {
          renderMembers(members);
          renderTeams(members);
        }
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

  // Every signed-in member may read ACTIVE identities under the current rules.
  // Querying the active directory fixes the old member-account path that only loaded self.
  try {
    const snap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Active identity directory unavailable:', error?.code || error);
  }

  // Membership data is used as a fallback/authoritative department source when
  // an identity document does not carry departmentId/department.
  try {
    const membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
    membershipSnap.docs.forEach(d => {
      const data = d.data() || {};
      const uid = data.userId || data.identityId || (d.id.startsWith('mem_') ? d.id.split('_')[1] : '');
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
      return {
        ...member,
        departmentId: member.departmentId || m.departmentId || '',
        department: member.department || m.department || '',
        teamId: member.teamId || m.teamId || '',
        team: member.team || m.team || '',
        position: member.position || m.position || '',
        roles: member.roles || m.roles || {}
      };
    })
    .filter(member => {
      const byId = String(member.departmentId || '').trim();
      if (byId) return byId === String(currentDepartment.id);
      return same(member.department, currentDepartment.name);
    })
    .sort((a, b) => memberName(a).localeCompare(memberName(b), 'vi'));
}

function memberName(member) {
  return member.fullName || member.displayName || member.name || 'Thành viên';
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
    const meta = [position(member.position), member.team || 'Chưa phân Team'].join(' · ');
    return `<div class="member-item" data-member-id="${esc(member.id)}"><div class="member-avatar">${esc(initials(name))}</div><div class="member-info"><strong>${esc(name)}</strong><small>${esc(meta)}</small></div></div>`;
  }).join('');
}

function renderTeams(members) {
  const list = $('teamList');
  const summary = $('teamSummary');
  if (!list) return;

  const groups = new Map();
  members.forEach(member => {
    const team = String(member.team || '').trim() || 'Chưa phân nhóm';
    if (!groups.has(team)) groups.set(team, []);
    groups.get(team).push(member);
  });
  const entries = [...groups.entries()].sort((a, b) => a[0] === 'Chưa phân nhóm' ? 1 : b[0] === 'Chưa phân nhóm' ? -1 : a[0].localeCompare(b[0], 'vi'));
  if (summary) summary.textContent = `${entries.length} nhóm`;

  if (!entries.length) {
    list.innerHTML = '<div class="empty-workspace"><strong>Chưa có nhóm</strong>Chưa có cơ cấu Team trong phòng này.</div>';
    return;
  }

  list.innerHTML = entries.map(([team, people]) => `<article class="team-card"><div class="team-card-head"><div><span class="team-label">${team === 'Chưa phân nhóm' ? 'CHƯA PHÂN NHÓM' : 'TEAM'}</span><h3>${esc(team)}</h3></div><strong>${people.length}</strong></div><div class="team-members">${people.map(member => { const name = memberName(member); return `<span><i>${esc(initials(name))}</i><b>${esc(name)}</b><small>${esc(position(member.position))}</small></span>`; }).join('')}</div></article>`).join('');
}
