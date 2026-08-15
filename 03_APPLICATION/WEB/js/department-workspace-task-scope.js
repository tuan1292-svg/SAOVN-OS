import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getWorkScope } from './work-scope.js';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const status = { BACKLOG:'Backlog', TODO:'Todo', IN_PROGRESS:'Đang thực hiện', REVIEW:'Review', DONE:'Hoàn thành' };

onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    const scope = await getWorkScope();
    if (scope.type !== 'ORGANIZATION') return;
    await waitForDepartment();
    await renderAdminDepartmentTasks();
  } catch (error) {
    console.warn('Department task scope fix skipped:', error?.code || error);
  }
});

async function waitForDepartment() {
  for (let i = 0; i < 40; i++) {
    if (location.search && $('departmentName')?.textContent && $('departmentName').textContent !== 'Phòng làm việc') return;
    await new Promise(r => setTimeout(r, 100));
  }
}

async function renderAdminDepartmentTasks() {
  const departmentId = new URLSearchParams(location.search).get('id');
  const departmentName = ($('departmentName')?.textContent || '').trim();
  if (!departmentId || !departmentName || departmentName === 'Phòng làm việc') return;

  const [taskSnap, identitySnap] = await Promise.all([
    getDocs(query(collection(db, 'workTasks'))),
    getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')))
  ]);

  const people = new Map();
  identitySnap.docs.forEach(d => {
    const x = d.data() || {};
    people.set(d.id, {
      departmentId: String(x.departmentId || '').trim(),
      department: String(x.department || '').trim().toLowerCase()
    });
  });

  const tasks = taskSnap.docs.map(d => ({ id:d.id, ...d.data() })).filter(task => belongsToDepartment(task, departmentId, departmentName, people));
  render(tasks);
}

function belongsToDepartment(task, departmentId, departmentName, people) {
  const id = String(departmentId).trim();
  const name = String(departmentName).trim().toLowerCase();
  if (String(task.departmentId || '').trim() === id) return true;
  if (String(task.department || '').trim().toLowerCase() === name) return true;
  if (Array.isArray(task.departmentIds) && task.departmentIds.map(String).includes(id)) return true;

  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  if (assignees.some(a => String(a?.departmentId || '').trim() === id || String(a?.department || '').trim().toLowerCase() === name)) return true;

  const ids = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  if (ids.some(uid => {
    const p = people.get(String(uid));
    return p && (p.departmentId === id || p.department === name);
  })) return true;

  return false;
}

function render(tasks) {
  const list = $('taskList');
  if (!list) return;
  const filter = $('teamTaskFilter')?.value || 'ALL';
  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => {
    const assignees = Array.isArray(t.assignees) ? t.assignees : [];
    return assignees.some(a => String(a?.team || '').trim() === filter);
  });
  const done = filtered.filter(t => t.status === 'DONE').length;
  if ($('taskCount')) $('taskCount').textContent = String(filtered.length);
  if ($('activeTaskCount')) $('activeTaskCount').textContent = String(filtered.length - done);
  if ($('doneTaskCount')) $('doneTaskCount').textContent = String(done);
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-workspace"><strong>Chưa có công việc của phòng</strong>Công việc chỉ hiển thị khi thuộc phòng này hoặc được giao cho thành viên của phòng.</div>`;
    return;
  }
  list.innerHTML = filtered.sort((a,b) => time(b) - time(a)).slice(0, 12).map(taskCard).join('');
}

function time(t) {
  return t.updatedAt?.toMillis?.() || t.createdAt?.toMillis?.() || new Date(t.updatedAt || t.createdAt || 0).getTime() || 0;
}
function taskCard(t) {
  const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : [];
  const names = Array.isArray(t.assignees) ? t.assignees.map(a => a?.name).filter(Boolean) : ids;
  const done = t.status === 'DONE';
  return `<a class="task-item" href="work.html"><div class="task-top"><strong>${esc(t.title || 'Không tên')}</strong><span class="task-status ${done ? 'done' : ''}">${esc(status[t.status] || 'Todo')}</span></div><p class="task-description">${esc(t.description || 'Chưa có mô tả')}</p><div class="task-meta"><span>${esc(names.join(', ') || 'Chưa xác định')}</span>${t.dueDate ? `<span>Deadline ${esc(t.dueDate)}</span>` : ''}</div></a>`;
}
