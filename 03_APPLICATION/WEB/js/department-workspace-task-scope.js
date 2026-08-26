import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const status = { BACKLOG:'Backlog', TODO:'Todo', IN_PROGRESS:'Đang thực hiện', REVIEW:'Review', DONE:'Hoàn thành' };
const priority = { LOW:'Thấp', MEDIUM:'Trung bình', HIGH:'Cao', URGENT:'Khẩn cấp' };
let unsubscribeTasks = null;
let cachedTasks = [];
let cachedPeople = new Map();
let activeDepartmentId = '';
let activeDepartmentName = '';

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    await waitForDepartment();
    bindTeamFilter();
    await startRealtimeDepartmentTasks();
  } catch (error) {
    console.warn('Department task realtime sync skipped:', error?.code || error);
  }
});

async function waitForDepartment() {
  for (let i = 0; i < 60; i++) {
    if (new URLSearchParams(location.search).get('id') && $('departmentName')?.textContent && $('departmentName').textContent !== 'Phòng làm việc') return;
    await new Promise(r => setTimeout(r, 100));
  }
}

function bindTeamFilter() {
  const filter = $('teamTaskFilter');
  if (!filter || filter.dataset.taskScopeBound === '1') return;
  filter.dataset.taskScopeBound = '1';
  filter.addEventListener('change', () => render(cachedTasks));
}

async function startRealtimeDepartmentTasks() {
  activeDepartmentId = String(new URLSearchParams(location.search).get('id') || '').trim();
  activeDepartmentName = ($('departmentName')?.textContent || '').trim();
  if (!activeDepartmentId || !activeDepartmentName || activeDepartmentName === 'Phòng làm việc') return;
  cachedPeople = await loadPeople();
  if (unsubscribeTasks) unsubscribeTasks();
  unsubscribeTasks = onSnapshot(collection(db, 'workTasks'), snapshot => {
    cachedTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(task => belongsToDepartment(task, activeDepartmentId, activeDepartmentName, cachedPeople));
    render(cachedTasks);
  }, error => {
    console.warn('Department work realtime error:', error?.code || error);
    renderError(error);
  });
}

function normalizeIdentityId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('mem_')) return raw.slice(4).split('_org_')[0];
  return raw;
}

async function loadPeople() {
  const people = new Map();
  try {
    const identitySnap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    identitySnap.docs.forEach(d => addPerson(people, d.id, d.data()));
  } catch (error) {
    console.warn('Department identities unavailable:', error?.code || error);
  }
  try {
    const membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
    membershipSnap.docs.forEach(d => {
      const x = d.data() || {};
      const uid = normalizeIdentityId(x.identityId || x.userId || x.uid || d.id);
      if (!uid) return;
      const current = people.get(uid) || { id: uid };
      people.set(uid, { ...current, departmentId: current.departmentId || String(x.departmentId || '').trim(), department: current.department || String(x.department || '').trim().toLowerCase(), teamId: current.teamId || String(x.teamId || '').trim(), team: current.team || String(x.team || '').trim() });
    });
  } catch (error) {
    console.warn('Department memberships unavailable:', error?.code || error);
  }
  return people;
}

function addPerson(map, id, data) {
  const x = data || {};
  const uid = normalizeIdentityId(id || x.identityId || x.uid || x.userId);
  if (!uid) return;
  map.set(uid, { id: uid, departmentId: String(x.departmentId || '').trim(), department: String(x.department || '').trim().toLowerCase(), teamId: String(x.teamId || '').trim(), team: String(x.team || '').trim() });
}

function belongsToDepartment(task, departmentId, departmentName, people) {
  const id = String(departmentId).trim();
  const name = String(departmentName).trim().toLowerCase();
  if (String(task.departmentId || '').trim() === id) return true;
  if (String(task.department || '').trim().toLowerCase() === name) return true;
  if (Array.isArray(task.departmentIds) && task.departmentIds.map(String).includes(id)) return true;
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  if (assignees.some(a => String(a?.departmentId || '').trim() === id || String(a?.department || '').trim().toLowerCase() === name)) return true;
  const ids = [];
  if (Array.isArray(task.assigneeIds)) ids.push(...task.assigneeIds);
  if (task.assigneeId) ids.push(task.assigneeId);
  if (task.assignee?.uid) ids.push(task.assignee.uid);
  if (task.createdBy) ids.push(task.createdBy);
  if (task.createdByUid) ids.push(task.createdByUid);
  return ids.some(uid => {
    const p = people.get(normalizeIdentityId(uid));
    return p && (p.departmentId === id || p.department === name);
  });
}

function render(tasks) {
  const list = $('taskList');
  if (!list) return;
  const filter = $('teamTaskFilter')?.value || 'ALL';
  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => taskBelongsToTeam(t, filter));
  const done = filtered.filter(t => t.status === 'DONE').length;
  if ($('taskCount')) $('taskCount').textContent = String(filtered.length);
  if ($('activeTaskCount')) $('activeTaskCount').textContent = String(filtered.length - done);
  if ($('doneTaskCount')) $('doneTaskCount').textContent = String(done);
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-workspace"><strong>${filter === 'ALL' ? 'Chưa có công việc của phòng' : 'Team này chưa có công việc'}</strong><span>Công việc mới sẽ xuất hiện tự động khi thuộc phòng này hoặc được giao cho thành viên của phòng.</span></div>`;
    return;
  }
  list.innerHTML = filtered.sort((a,b) => time(b) - time(a)).slice(0, 12).map(taskCard).join('');
}

function taskBelongsToTeam(task, filter) {
  const wanted = String(filter || '').trim();
  if (!wanted || wanted === 'ALL') return true;
  if (Array.isArray(task.teamIds) && task.teamIds.map(String).includes(wanted)) return true;
  if (String(task.teamId || '').trim() === wanted || String(task.team || '').trim() === wanted || String(task.teamName || '').trim() === wanted) return true;
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  if (assignees.some(a => (Array.isArray(a?.teamIds) && a.teamIds.map(String).includes(wanted)) || String(a?.teamId || '').trim() === wanted || String(a?.team || '').trim() === wanted || String(a?.teamName || '').trim() === wanted)) return true;
  const ids = [];
  if (Array.isArray(task.assigneeIds)) ids.push(...task.assigneeIds);
  if (task.assigneeId) ids.push(task.assigneeId);
  return ids.some(uid => cachedPeople.get(normalizeIdentityId(uid))?.teamId === wanted || cachedPeople.get(normalizeIdentityId(uid))?.team === wanted);
}

function renderError(error) {
  const list = $('taskList');
  if (!list) return;
  list.innerHTML = `<div class="empty-workspace"><strong>Không thể đồng bộ công việc</strong><span>${esc(error?.code || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.')}</span></div>`;
}

function time(t) {
  return t.updatedAt?.toMillis?.() || t.createdAt?.toMillis?.() || new Date(t.updatedAt || t.createdAt || 0).getTime() || 0;
}

function formatPeople(t) {
  const names = Array.isArray(t.assignees) ? t.assignees.map(a => a?.name || a?.displayName).filter(Boolean) : [];
  if (names.length <= 2) return names.join(', ') || 'Chưa xác định';
  return `${names.slice(0,2).join(', ')} +${names.length - 2}`;
}

function isOverdue(t) {
  if (!t.dueDate || t.status === 'DONE') return false;
  const d = new Date(`${t.dueDate}T23:59:59`);
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now();
}

function taskCard(t) {
  const done = t.status === 'DONE';
  const overdue = isOverdue(t);
  const taskUrl = `work.html?task=${encodeURIComponent(t.id)}`;
  return `<a class="task-item${overdue ? ' overdue' : ''}" href="${taskUrl}" data-detail="${esc(t.id)}"><div class="task-top"><strong>${esc(t.title || 'Không tên')}</strong><div class="task-badges"><span class="task-priority priority-${esc(String(t.priority || 'MEDIUM').toLowerCase())}">${esc(priority[t.priority] || 'Trung bình')}</span><span class="task-status ${done ? 'done' : ''}">${esc(status[t.status] || 'Todo')}</span></div></div><p class="task-description">${esc(t.description || 'Chưa có mô tả')}</p><div class="task-meta"><span>👤 ${esc(formatPeople(t))}</span>${t.teamName || t.team ? `<span>Team: ${esc(t.teamName || t.team)}</span>` : ''}${t.dueDate ? `<span class="${overdue ? 'deadline-overdue' : ''}">${overdue ? '⚠ Trễ hạn' : 'Deadline'} ${esc(t.dueDate)}</span>` : ''}</div></a>`;
}
