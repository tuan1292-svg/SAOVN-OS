import './permissions.js';
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getPermissions, PERMISSIONS } from './permissions.js';
import { listModules } from './core/module-registry.js';

const policyRef = doc(db, 'systemConfig', 'runtime');
const statusEl = document.getElementById('status');
const modulesEl = document.getElementById('modules');
const rolesEl = document.getElementById('roles');
const saveBtn = document.getElementById('save');
const reloadBtn = document.getElementById('reload');

const FALLBACK_MODULES = {
  dashboard: { enabled: true }, work: { enabled: true }, departments: { enabled: true }, members: { enabled: true },
  chat: { enabled: true }, notifications: { enabled: true }, projects: { enabled: true }
};

const FALLBACK_ROLES = {
  MEMBER: ['dashboard.view','work.task.view','work.task.create','work.task.update','work.comment.create','work.checklist.update','organization.department.view','people.member.view','project.view','chat.view','notifications.view'],
  MANAGER: ['dashboard.view','work.task.view','work.task.create','work.task.update','work.task.delete','work.task.assign','work.comment.create','work.checklist.update','organization.department.view','people.member.view','project.view','project.create','project.update','chat.view','notifications.view'],
  ADMIN: Object.values(PERMISSIONS).concat(['chat.view','notifications.view'])
};

const CAPABILITY_LABELS = {
  'dashboard.view':'Xem tổng quan','work.task.view':'Xem công việc','work.task.create':'Tạo công việc','work.task.update':'Cập nhật công việc','work.task.delete':'Xóa công việc','work.task.assign':'Giao công việc','work.comment.create':'Bình luận','work.checklist.update':'Checklist','organization.department.view':'Xem phòng ban','organization.department.manage':'Quản lý phòng ban','people.member.view':'Xem thành viên','people.member.create':'Tạo thành viên','people.member.update':'Sửa thành viên','people.member.role.manage':'Quản lý vai trò','people.member.delete':'Xóa thành viên','project.view':'Xem dự án','project.create':'Tạo dự án','project.update':'Sửa dự án','project.delete':'Xóa dự án','admin.role.manage':'Quản lý role','admin.system.manage':'Điều hành hệ thống','chat.view':'Trò chuyện','notifications.view':'Thông báo'
};

let policy = null;

function setStatus(text) { statusEl.textContent = text; }
function moduleEnabled(id) { return policy?.modules?.[id]?.enabled !== false; }
function roleCapabilities(role) { return new Set(policy?.roles?.[role]?.capabilities || FALLBACK_ROLES[role] || []); }

function renderModules() {
  modulesEl.innerHTML = listModules().map(module => `
    <div class="row"><div><strong>${module.label || module.id}</strong><small>${module.id} · ${module.version || '0.0.0'}</small></div>
      <button class="switch ${moduleEnabled(module.id) ? 'on' : ''}" type="button" data-module="${module.id}" aria-label="${moduleEnabled(module.id) ? 'Tắt' : 'Bật'} ${module.label || module.id}"></button>
    </div>`).join('');
  modulesEl.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.module;
    policy.modules ||= {};
    policy.modules[id] = { ...(policy.modules[id] || {}), enabled: !moduleEnabled(id) };
    renderModules();
  }));
}

function renderRoles() {
  const capabilities = Object.keys(PERMISSIONS).map(key => PERMISSIONS[key]).concat(['chat.view','notifications.view']);
  rolesEl.innerHTML = ['MEMBER','MANAGER','ADMIN'].map(role => {
    const selected = roleCapabilities(role);
    return `<article class="role-card"><h3>${role}</h3>${[...new Set(capabilities)].map(capability => {
      const checked = selected.has(capability);
      const locked = role === 'ADMIN' && capability === PERMISSIONS.SYSTEM_MANAGE;
      return `<label class="perm"><input type="checkbox" data-role="${role}" data-capability="${capability}" ${checked ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${CAPABILITY_LABELS[capability] || capability}</span><code>${capability}</code></label>`;
    }).join('')}</article>`;
  }).join('');
  rolesEl.querySelectorAll('input[data-role]').forEach(input => input.addEventListener('change', () => {
    const role = input.dataset.role;
    const capability = input.dataset.capability;
    policy.roles ||= {};
    policy.roles[role] ||= { capabilities: [...roleCapabilities(role)] };
    const set = roleCapabilities(role);
    input.checked ? set.add(capability) : set.delete(capability);
    if (role === 'ADMIN') set.add(PERMISSIONS.SYSTEM_MANAGE);
    policy.roles[role].capabilities = [...set];
  }));
}

async function load() {
  setStatus('Đang tải policy…');
  const permissions = await getPermissions();
  if (!permissions.hasPermission?.(PERMISSIONS.SYSTEM_MANAGE) && !permissions.permissions?.has(PERMISSIONS.SYSTEM_MANAGE)) {
    window.location.replace('dashboard.html');
    return;
  }
  const snap = await getDoc(policyRef);
  const data = snap.exists() ? snap.data() : {};
  policy = { version: 1, modules: structuredClone(FALLBACK_MODULES), roles: structuredClone(FALLBACK_ROLES), ...data };
  policy.modules = { ...FALLBACK_MODULES, ...(data.modules || {}) };
  policy.roles = { ...FALLBACK_ROLES, ...(data.roles || {}) };
  policy.roles.ADMIN = { capabilities: [...new Set([...(policy.roles.ADMIN?.capabilities || []), PERMISSIONS.SYSTEM_MANAGE])] };
  renderModules();
  renderRoles();
  setStatus(snap.exists() ? `Policy v${policy.version || 1}` : 'Đang dùng baseline');
}

saveBtn.addEventListener('click', async () => {
  try {
    saveBtn.disabled = true;
    setStatus('Đang lưu…');
    const payload = {
      version: Number(policy.version || 1),
      modules: policy.modules,
      roles: Object.fromEntries(Object.entries(policy.roles || {}).map(([role, value]) => [role, { capabilities: [...new Set(value?.capabilities || [])] }])),
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid || null
    };
    payload.roles.ADMIN.capabilities = [...new Set([...(payload.roles.ADMIN?.capabilities || []), PERMISSIONS.SYSTEM_MANAGE])];
    await setDoc(policyRef, payload, { merge: true });
    policy = { ...policy, ...payload };
    setStatus(`Đã lưu policy v${policy.version}`);
  } catch (error) {
    console.error('[SAOVN][CONTROL_PLANE]', error);
    setStatus(error?.code === 'permission-denied' ? 'Firebase từ chối quyền ghi policy' : 'Lưu policy thất bại');
  } finally { saveBtn.disabled = false; }
});

reloadBtn.addEventListener('click', () => load().catch(error => { console.error(error); setStatus('Không tải được policy'); }));
onAuthStateChanged(auth, user => { if (!user) window.location.replace('index.html'); });
load().catch(error => { console.error('[SAOVN][CONTROL_PLANE]', error); setStatus('Không tải được Control Plane'); });
