import { db, auth } from './firebase-config.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from './permissions.js';

const LABELS = {
  [PERMISSIONS.DASHBOARD_VIEW]: 'Xem Dashboard', [PERMISSIONS.WORK_VIEW]: 'Xem công việc',
  [PERMISSIONS.WORK_CREATE]: 'Tạo công việc', [PERMISSIONS.WORK_EDIT]: 'Sửa công việc',
  [PERMISSIONS.WORK_DELETE]: 'Xóa công việc', [PERMISSIONS.WORK_ASSIGN]: 'Giao việc',
  [PERMISSIONS.WORK_COMMENT]: 'Trao đổi', [PERMISSIONS.WORK_CHECKLIST]: 'Checklist',
  [PERMISSIONS.MEMBERS_VIEW]: 'Xem thành viên', [PERMISSIONS.MEMBERS_CREATE]: 'Thêm thành viên',
  [PERMISSIONS.MEMBERS_UPDATE]: 'Sửa thành viên', [PERMISSIONS.MEMBERS_ROLE_MANAGE]: 'Quản lý vai trò thành viên',
  [PERMISSIONS.MEMBERS_DELETE]: 'Xóa thành viên', [PERMISSIONS.PROJECTS_VIEW]: 'Xem dự án',
  [PERMISSIONS.PROJECTS_CREATE]: 'Tạo dự án', [PERMISSIONS.PROJECTS_EDIT]: 'Sửa dự án',
  [PERMISSIONS.PROJECTS_DELETE]: 'Xóa dự án', [PERMISSIONS.ROLES_MANAGE]: 'Quản lý vai trò hệ thống',
  [PERMISSIONS.SYSTEM_MANAGE]: 'Quản trị hệ thống'
};

export function permissionsForRole(role) {
  return [...(ROLE_PERMISSIONS[String(role || 'MEMBER').toUpperCase()] || ROLE_PERMISSIONS.MEMBER)];
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
