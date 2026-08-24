import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions, can, role } from './permissions.js';
import { loadOrgScope, scopeLabel } from './org-scope.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
const initials = name => String(name || 'S').split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
const sameText = (a,b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const positionCode = value => String(value || '').trim().toUpperCase();
const position = value => String(value || '').trim() || 'Chưa xác định';
const statusLabel = { BACKLOG:'Backlog', TODO:'Todo', IN_PROGRESS:'Đang thực hiện', REVIEW:'Review', DONE:'Hoàn thành' };
let department = null, members = [], tasks = [], orgScope = null;

onAuthStateChanged(auth, async user => {
  if (!user) { location.replace('index.html'); return; }
  try {
    await getPermissions();
    if (!can('departments', 'read')) { location.replace('dashboard.html'); return; }
    const identitySnap = await getDoc(doc(db, 'identities', user.uid));
    const identity = identitySnap.exists() ? identitySnap.data() : {};
    const name = identity.fullName || identity.displayName || identity.name || user.displayName || 'Thành viên';
    orgScope = await loadOrgScope(user.uid);
    orgScope = { ...(orgScope || {}), uid:user.uid, identity };
    $('userName').textContent = name;
    $('userAvatar').textContent = initials(name);
    $('userRole').textContent = role() === 'ADMIN' ? 'Founder · Chairman · CEO' : orgScope.scope === 'DEPARTMENT' ? 'Department Head' : orgScope.scope === 'TEAM' ? 'Team Lead' : orgScope.role === 'MANAGER' ? 'Manager' : 'Workspace member';
    $('logoutBtn').onclick = () => signOut(auth);
    $('teamTaskFilter')?.addEventListener('change', renderTasks);
    renderScope();
    await loadWorkspace();
  } catch (error) {
    console.error('Department workspace bootstrap error:', error);
    setSyncError();
    showError(error?.code === 'permission-denied' ? 'Tài khoản chưa có quyền đọc phạm vi phòng làm việc.' : 'Không thể khởi tạo phòng làm việc.');
  }
});

function renderScope() {
  const title = $('scopeTitle'), description = $('scopeDescription');
  if (!title || !description || !orgScope) return;
  title.textContent = scopeLabel(orgScope);
  if (orgScope.role === 'ADMIN') description.textContent = 'Bạn có quyền quản trị toàn bộ tổ chức và các không gian được cấp quyền.';
  else if (orgScope.scope === 'DEPARTMENT') description.textContent = 'Bạn là Trưởng phòng. Phạm vi quản lý tập trung vào thành viên, Team và công việc của phòng ban.';
  else if (orgScope.scope === 'TEAM') description.textContent = 'Bạn là Trưởng nhóm. Phạm vi quản lý tập trung vào Team và công việc của nhóm.';
  else if (orgScope.role === 'MANAGER') description.textContent = 'Bạn đang quản lý trực tiếp các thành viên được giao cho mình và các công việc liên quan.';
  else description.textContent = 'Bạn đang làm việc trong phạm vi cá nhân và các công việc được giao cho mình.';
}

function setSyncError() {
  const el = $('syncState');
  if (el) el.innerHTML = '<i style="background:#ff3b3b"></i> Firebase · Lỗi';
}

async function loadDepartmentDirectory(privileged) {
  const identityMap = new Map();
  const addIdentity = snap => {
    if (!snap) return;
    if (Array.isArray(snap.docs)) snap.docs.forEach(d => identityMap.set(d.id, { id:d.id, ...d.data() }));
    else if (snap.exists?.()) identityMap.set(snap.id, { id:snap.id, ...snap.data() });
  };

  if (privileged) {
    try {
      addIdentity(await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE'))));
    } catch (error) {
      console.warn('Department identity directory query denied; falling back to memberships.', error?.code || error);
    }
  } else {
    try { addIdentity(await getDoc(doc(db, 'identities', orgScope.uid))); } catch (error) { console.warn('Own identity query failed:', error?.code || error); }
  }

  // Memberships are the authoritative bridge for existing members. This fallback
  // keeps old accounts visible even when the broad identities query is denied.
  try {
    const membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
    for (const membershipDoc of membershipSnap.docs) {
      const membership = membershipDoc.data() || {};
      const memberUid = membership.identityId || membership.userId || membership.uid || membershipDoc.id.match(/^mem_(.+)_org_/)?.[1];
      if (!memberUid) continue;
      const membershipDepartmentId = membership.departmentId || membership.deptId || '';
      const membershipDepartment = membership.department || membership.departmentName || '';
      if (membershipDepartmentId && String(membershipDepartmentId) !== String(department.id)) continue;
      if (!membershipDepartmentId && membershipDepartment && !sameText(membershipDepartment, department.name)) continue;
      if (identityMap.has(memberUid)) {
        const existing = identityMap.get(memberUid);
        identityMap.set(memberUid, { ...existing, membership });
        continue;
      }
      try {
        const identitySnap = await getDoc(doc(db, 'identities', memberUid));
        if (identitySnap.exists()) identityMap.set(memberUid, { id:memberUid, ...identitySnap.data(), membership });
        else identityMap.set(memberUid, { id:memberUid, status:'ACTIVE', membership });
      } catch (error) {
        console.warn('Could not hydrate membership identity:', memberUid, error?.code || error);
        identityMap.set(memberUid, { id:memberUid, status:'ACTIVE', membership });
      }
    }
  } catch (error) {
    console.warn('Membership directory fallback unavailable:', error?.code || error);
  }

  return [...identityMap.values()];
}

async function loadWorkspace() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.replace('departments.html'); return; }
  try {
    const departmentSnap = await getDoc(doc(db, 'departments', id));
    if (!departmentSnap.exists()) { showError('Không tìm thấy phòng ban.'); return; }
    department = { id:departmentSnap.id, ...departmentSnap.data() };
    const privileged = orgScope.role === 'ADMIN' || orgScope.scope === 'DEPARTMENT' || orgScope.scope === 'TEAM' || orgScope.role === 'MANAGER';
    const directoryDocs = await loadDepartmentDirectory(privileged);
    members = directoryDocs
      .map(member => {
        const membership = member.membership || {};
        return {
          ...member,
          status: member.status || membership.status || 'ACTIVE',
          departmentId: member.departmentId || membership.departmentId || membership.deptId,
          department: member.department || membership.department || membership.departmentName,
          teamId: member.teamId || membership.teamId,
          team: member.team || membership.team,
          position: member.position || membership.position || membership.role || 'Thành viên'
        };
      })
      .filter(member => member.status === 'ACTIVE' && identityBelongsToDepartment(member))
      .sort((a,b) => String(a.fullName || a.displayName || a.name || '').localeCompare(String(b.fullName || b.displayName || b.name || ''), 'vi'));
    renderDepartment();
    await loadTasks();
    renderTeamFilter();
    if (privileged) renderTeams();
    const sync = $('syncState');
    if (sync) sync.innerHTML = '<i></i> Firebase · Đã đồng bộ';
  } catch (error) {
    console.error('Department workspace error:', error);
    setSyncError();
    showError(error?.code === 'permission-denied' ? 'Không đủ quyền truy cập dữ liệu phòng làm việc.' : 'Không thể tải phòng làm việc.');
  }
}

function identityBelongsToDepartment(identity) {
  if (!identity || !department) return false;
  const depId = String(identity.departmentId || '').trim();
  if (depId) return depId === department.id;
  return sameText(identity.department, department.name);
}

function canOpenDepartment() {
  if (!orgScope || !department) return false;
  if (orgScope.role === 'ADMIN') return true;
  if (orgScope.departmentId && String(orgScope.departmentId) === String(department.id)) return true;
  if (orgScope.departmentId && String(orgScope.departmentId) !== String(department.id)) return false;
  if (orgScope.scope === 'DEPARTMENT' || orgScope.scope === 'TEAM' || orgScope.role === 'MANAGER') return true;
  if (identityBelongsToDepartment(orgScope.identity)) return true;
  return members.some(member => String(member.id) === String(orgScope.uid) && identityBelongsToDepartment(member));
}

function renderDepartment() {
  const name = department.name || 'Phòng làm việc';
  $('crumbName').textContent = name;
  $('departmentName').textContent = name;
  $('departmentCode').textContent = department.code || 'DEPT';
  $('departmentDescription').textContent = department.description || 'Không gian làm việc của phòng ban.';
  $('deptMark').textContent = initials(name).slice(0,2) || 'D';
  $('departmentStatus').textContent = department.active === false ? 'Ngừng hoạt động' : 'Đang hoạt động';
  $('departmentStatus').classList.toggle('inactive', department.active === false);
  $('memberCount').textContent = members.length;
  $('memberSummary').textContent = `${members.length} người`;
}

function getTeamEntries() {
  const groups = new Map();
  members.forEach(member => {
    const team = String(member.team || '').trim() || 'Chưa phân nhóm';
    if (!groups.has(team)) groups.set(team, []);
    groups.get(team).push(member);
  });
  return [...groups.entries()].sort((a,b) => a[0] === 'Chưa phân nhóm' ? 1 : b[0] === 'Chưa phân nhóm' ? -1 : a[0].localeCompare(b[0], 'vi'));
}

function renderTeamFilter() {
  const select = $('teamTaskFilter');
  if (!select) return;
  const current = select.value || 'ALL';
  const teams = getTeamEntries().map(([name]) => name).filter(name => name !== 'Chưa phân nhóm');
  select.innerHTML = '<option value="ALL">Tất cả Team</option>' + teams.map(team => `<option value="${esc(team)}">${esc(team)}</option>`).join('');
  select.value = teams.includes(current) ? current : 'ALL';
}

function renderTeams() {
  const entries = getTeamEntries();
  $('teamSummary').textContent = `${entries.length} nhóm`;
  if (!entries.length) { $('teamList').innerHTML = '<div class="empty-workspace"><strong>Chưa có nhóm</strong>Thành viên sẽ được tổ chức thành Team khi cơ cấu nhóm được thiết lập.</div>'; return; }
  $('teamList').innerHTML = entries.map(([team, people]) => {
    const leader = people.find(member => ['TEAM_LEAD','TEAM_LEADER'].includes(positionCode(member.position)));
    return `<article class="team-card"><div class="team-card-head"><div><span class="team-label">${team === 'Chưa phân nhóm' ? 'Chưa phân nhóm' : 'TEAM'}</span><h3>${esc(team)}</h3>${leader ? `<div class="team-lead"><span>TRƯỞNG NHÓM</span><strong>${esc(leader.fullName || leader.displayName || leader.name || '')}</strong></div>` : ''}</div><strong>${people.length}</strong></div><div class="team-members">${people.map(member => { const name = member.fullName || member.displayName || member.name || 'Thành viên'; return `<span class="${leader?.id === member.id ? 'is-leader' : ''}"><i>${esc(initials(name))}</i><b>${esc(name)}</b><small>${esc(position(member.position))}</small></span>`; }).join('')}</div></article>`;
  }).join('');
}

function taskBelongsToDepartment(task) {
  if (!task || !department) return false;
  if (String(task.departmentId || '').trim()) return String(task.departmentId).trim() === String(department.id);
  if (task.department && sameText(task.department, department.name)) return true;
  const ids = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  if (ids.some(id => members.some(member => member.id === id))) return true;
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  return assignees.some(a => String(a?.departmentId || '').trim() === String(department.id) || sameText(a?.department, department.name));
}

async function loadTasks() {
  tasks = [];
  if (!canOpenDepartment()) { renderTasks(); return; }
  const map = new Map();
  const add = snap => snap?.docs?.forEach(d => map.set(d.id, { id:d.id, ...d.data() }));
  const uid = orgScope.uid;
  const isAdmin = orgScope.role === 'ADMIN';
  const isDepartmentManager = orgScope.scope === 'DEPARTMENT';
  const isTeamManager = orgScope.scope === 'TEAM';
  const isManager = orgScope.role === 'MANAGER';
  try {
    if (isAdmin || isDepartmentManager) {
      add(await getDocs(query(collection(db, 'workTasks'), where('departmentId', '==', department.id))));
    } else if (isTeamManager) {
      if (orgScope.teamId) add(await getDocs(query(collection(db, 'workTasks'), where('teamId', '==', orgScope.teamId))));
      else if (orgScope.team) add(await getDocs(query(collection(db, 'workTasks'), where('team', '==', orgScope.team))));
    } else {
      const queries = [
        () => getDocs(query(collection(db, 'workTasks'), where('assigneeIds', 'array-contains', uid))),
        () => getDocs(query(collection(db, 'workTasks'), where('assigneeId', '==', uid))),
        () => getDocs(query(collection(db, 'workTasks'), where('createdBy', '==', uid)))
      ];
      for (const makeQuery of queries) {
        try { add(await makeQuery()); } catch (error) { console.warn('Department member task query skipped:', error?.code || error); }
      }
    }
    tasks = [...map.values()].filter(task => {
      if (!taskBelongsToDepartment(task)) return false;
      if (isAdmin || isDepartmentManager) return true;
      if (isTeamManager) return (orgScope.teamId && task.teamId === orgScope.teamId) || (orgScope.team && !orgScope.teamId && sameText(task.team, orgScope.team));
      return isManager || (Array.isArray(task.assigneeIds) && task.assigneeIds.includes(uid)) || task.assigneeId === uid || task.createdBy === uid;
    });
    tasks.sort((a,b) => {
      const av = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bv = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bv - av;
    });
    renderTasks();
  } catch (error) {
    console.warn('Department task query failed:', error);
    tasks = [];
    renderTasks(true);
  }
}

function renderTasks(queryFailed = false) {
  const filter = $('teamTaskFilter')?.value || 'ALL';
  const filtered = filter === 'ALL' ? tasks : tasks.filter(task => {
    const ids = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
    return members.some(member => ids.includes(member.id) && String(member.team || '').trim() === filter);
  });
  const done = filtered.filter(task => task.status === 'DONE').length;
  $('taskCount').textContent = filter === 'ALL' ? tasks.length : filtered.length;
  $('activeTaskCount').textContent = filtered.length - done;
  $('doneTaskCount').textContent = done;
  if (queryFailed) { $('taskList').innerHTML = '<div class="empty-workspace"><strong>Chưa tải được công việc</strong>Không thể truy vấn Work theo quyền dữ liệu hiện tại.</div>'; return; }
  if (!filtered.length) { $('taskList').innerHTML = `<div class="empty-workspace"><strong>${filter === 'ALL' ? 'Chưa có công việc' : 'Team này chưa có công việc'}</strong>${filter === 'ALL' ? 'Các công việc thuộc phòng này sẽ xuất hiện tại đây.' : 'Chọn Team khác hoặc quay lại Tất cả Team.'}</div>`; return; }
  $('taskList').innerHTML = filtered.slice(0,12).map(taskCard).join('');
}

function taskCard(task) {
  const done = task.status === 'DONE';
  const ids = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  const names = members.filter(member => ids.includes(member.id)).map(member => member.fullName || member.displayName || member.name).filter(Boolean);
  return `<a class="task-item" href="work.html"><div class="task-top"><strong>${esc(task.title || 'Không tên')}</strong><span class="task-status ${done ? 'done' : ''}">${esc(statusLabel[task.status] || 'Todo')}</span></div><p class="task-description">${esc(task.description || 'Chưa có mô tả')}</p><div class="task-meta"><span>${esc(names.join(', ') || 'Chưa xác định')}</span>${task.dueDate ? `<span>Deadline ${esc(task.dueDate)}</span>` : ''}</div></a>`;
}

function showError(message) {
  $('departmentName').textContent = 'Không thể mở phòng làm việc';
  $('departmentDescription').textContent = message;
  $('memberList').innerHTML = `<div class="empty-workspace"><strong>Không thể tải dữ liệu</strong>${esc(message)}</div>`;
  $('teamList').innerHTML = '';
  $('taskList').innerHTML = '';
}
