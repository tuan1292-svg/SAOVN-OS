import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const status = { BACKLOG:'Backlog', TODO:'Todo', IN_PROGRESS:'Đang thực hiện', REVIEW:'Review', DONE:'Hoàn thành' };
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
      people.set(uid, {
        ...current,
        departmentId: current.departmentId || String(x.departmentId || '').trim(),
        department: current.department || String(x.department || '').trim().toLowerCase(),
        teamId: current.teamId || String(x.teamId || '').trim(),
        team: current.team || String(x.team || '').trim()
      });
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
    list.innerHTML = `<div class="empty-workspace"><strong>${filter === 'ALL' ? 'Chưa có công việc của phòng' : 'Team này chưa có công việc'}</strong>Công việc mới sẽ xuất hiện tự động khi thuộc phòng này hoặc được giao cho thành viên của phòng.</div>`;
    return;
  }
  list.innerHTML = filtered.sort((a,b) => time(b) - time(a)).slice(0, 12).map(taskCard).join('');
}

function taskBelongsToTeam(task, filter) {
  const wanted = String(filter || '').trim();
  if (!wanted || wanted === 'ALL') return true;
  if (String(task.teamId || '').trim() === wanted || String(task.team || '').trim() === wanted || String(task.teamName || '').trim() === wanted) return true;
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  if (assignees.some(a => String(a?.teamId || '').trim() === wanted || String(a?.team || '').trim() === wanted || String(a?.teamName || '').trim() === wanted)) return true;
  return false;
}

function renderError(error) {
  const list = $('taskList');
  if (!list) return;
  list.innerHTML = `<div class="empty-workspace"><strong>Không thể đồng bộ công việc</strong>${esc(error?.code || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.')}</div>`;
}

function time(t) {
  return t.updatedAt?.toMillis?.() || t.createdAt?.toMillis?.() || new Date(t.updatedAt || t.createdAt || 0).getTime() || 0;
}

function taskCard(t) {
  const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : [];
  const names = Array.isArray(t.assignees) ? t.assignees.map(a => a?.name || a?.displayName).filter(Boolean) : ids;
  const done = t.status === 'DONE';
  return `<a class="task-item" href="work.html"><div class="task-top"><strong>${esc(t.title || 'Không tên')}</strong><span class="task-status ${done ? 'done' : ''}">${esc(status[t.status] || 'Todo')}</span></div><p class="task-description">${esc(t.description || 'Chưa có mô tả')}</p><div class="task-meta"><span>${esc(names.join(', ') || 'Chưa xác định')}</span>${t.dueDate ? `<span>Deadline ${esc(t.dueDate)}</span>` : ''}</div></a>`;
}
