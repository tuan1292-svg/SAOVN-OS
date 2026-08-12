import { db, auth } from './firebase-config.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const ROLE_PERMISSIONS = {
  MEMBER: ['dashboard.view', 'work.view', 'work.create', 'work.edit', 'work.comment', 'work.checklist'],
  MANAGER: ['dashboard.view', 'work.view', 'work.create', 'work.edit', 'work.delete', 'work.assign', 'work.comment', 'work.checklist', 'members.view', 'projects.view', 'projects.create', 'projects.edit'],
  ADMIN: ['dashboard.view', 'work.view', 'work.create', 'work.edit', 'work.delete', 'work.assign', 'work.comment', 'work.checklist', 'members.view', 'members.manage', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'roles.manage', 'system.manage']
};

const LABELS = {
  'dashboard.view': 'Xem Dashboard', 'work.view': 'Xem công việc', 'work.create': 'Tạo công việc',
  'work.edit': 'Sửa công việc', 'work.delete': 'Xóa công việc', 'work.assign': 'Giao việc',
  'work.comment': 'Trao đổi', 'work.checklist': 'Checklist', 'members.view': 'Xem thành viên',
  'members.manage': 'Quản lý thành viên', 'projects.view': 'Xem dự án', 'projects.create': 'Tạo dự án',
  'projects.edit': 'Sửa dự án', 'projects.delete': 'Xóa dự án', 'roles.manage': 'Quản lý vai trò', 'system.manage': 'Quản trị hệ thống'
};

export function permissionsForRole(role) {
  const key = String(role || 'MEMBER').toUpperCase();
  return ROLE_PERMISSIONS[key] || ROLE_PERMISSIONS.MEMBER;
}

export function renderPermissionGrid(container, role) {
  if (!container) return;
  const allowed = new Set(permissionsForRole(role));
  container.innerHTML = Object.entries(LABELS).map(([key, label]) => `
    <div class="permission-row ${allowed.has(key) ? 'allowed' : 'denied'}">
      <span>${label}</span><b>${allowed.has(key) ? '✓' : '—'}</b>
    </div>`).join('');
}

export async function saveMemberRole(membershipDocId, role) {
  if (!auth.currentUser || !membershipDocId) throw new Error('Bạn chưa đăng nhập hoặc thiếu Membership ID.');
  const normalized = String(role || 'MEMBER').toUpperCase();
  const roleValue = normalized === 'ADMIN' ? 'org_admin' : normalized === 'MANAGER' ? 'manager' : 'org_member';
  await updateDoc(doc(db, 'memberships', membershipDocId), {
    'roles.organization': [roleValue],
    updatedAt: new Date().toISOString()
  });
}
