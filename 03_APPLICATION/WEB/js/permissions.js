import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;

// Single source of truth for application permissions.
// Firestore Rules remain the authoritative security boundary.
export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',
  WORK_VIEW: 'work.view', WORK_CREATE: 'work.create', WORK_EDIT: 'work.edit', WORK_DELETE: 'work.delete', WORK_ASSIGN: 'work.assign', WORK_COMMENT: 'work.comment', WORK_CHECKLIST: 'work.checklist',
  DEPARTMENTS_VIEW: 'departments.view', DEPARTMENTS_MANAGE: 'departments.manage',
  MEMBERS_VIEW: 'members.view', MEMBERS_CREATE: 'members.create', MEMBERS_UPDATE: 'members.update', MEMBERS_ROLE_MANAGE: 'members.role.manage', MEMBERS_DELETE: 'members.delete',
  PROJECTS_VIEW: 'projects.view', PROJECTS_CREATE: 'projects.create', PROJECTS_EDIT: 'projects.edit', PROJECTS_DELETE: 'projects.delete',
  ROLES_MANAGE: 'roles.manage', SYSTEM_MANAGE: 'system.manage'
});

export const ROLE_PERMISSIONS = Object.freeze({
  // The member directory is a shared organizational directory, so normal
  // members can view it without receiving member-management permissions.
  MEMBER: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.WORK_VIEW, PERMISSIONS.WORK_CREATE, PERMISSIONS.WORK_EDIT, PERMISSIONS.WORK_COMMENT, PERMISSIONS.WORK_CHECKLIST, PERMISSIONS.DEPARTMENTS_VIEW, PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.PROJECTS_VIEW],
  MANAGER: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.WORK_VIEW, PERMISSIONS.WORK_CREATE, PERMISSIONS.WORK_EDIT, PERMISSIONS.WORK_DELETE, PERMISSIONS.WORK_ASSIGN, PERMISSIONS.WORK_COMMENT, PERMISSIONS.WORK_CHECKLIST, PERMISSIONS.DEPARTMENTS_VIEW, PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_CREATE, PERMISSIONS.PROJECTS_EDIT],
  ADMIN: Object.values(PERMISSIONS)
});

const roleFromMembership = data => {
  const roles = data?.roles || {};
  const all = [...(Array.isArray(roles.system) ? roles.system : []), ...(Array.isArray(roles.organization) ? roles.organization : []), ...(Array.isArray(data?.role) ? data.role : [data?.role].filter(Boolean))].map(v => String(v).toLowerCase());
  if (all.some(v => v.includes('system_admin') || v === 'admin' || v === 'administrator' || v.includes('org_admin'))) return 'ADMIN';
  if (all.some(v => v.includes('manager'))) return 'MANAGER';
  return 'MEMBER';
};

let state = { ready: false, uid: null, role: 'MEMBER', permissions: new Set(ROLE_PERMISSIONS.MEMBER) };
let readyPromise;
function setRole(role) { state.role = role; state.permissions = new Set(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MEMBER); }
export function hasPermission(permission) { return state.permissions.has(permission); }
export function can(area, action = 'read') {
  const aliases = {
    'members.read': PERMISSIONS.MEMBERS_VIEW, 'members.manage': PERMISSIONS.MEMBERS_UPDATE,
    'members.create': PERMISSIONS.MEMBERS_CREATE, 'members.update': PERMISSIONS.MEMBERS_UPDATE,
    'members.delete': PERMISSIONS.MEMBERS_DELETE, 'members.role.manage': PERMISSIONS.MEMBERS_ROLE_MANAGE,
    'departments.read': PERMISSIONS.DEPARTMENTS_VIEW, 'departments.manage': PERMISSIONS.DEPARTMENTS_MANAGE,
    'dashboard.read': PERMISSIONS.DASHBOARD_VIEW
  };
  const key = `${area}.${action}`;
  return hasPermission(key) || Boolean(aliases[key] && hasPermission(aliases[key]));
}

function applyNavigation() {
  const isAdmin = state.role === 'ADMIN';
  const canMembers = hasPermission(PERMISSIONS.MEMBERS_VIEW);

  document.querySelectorAll('a[href="members.html"]').forEach(link => {
    const isAdminManagement = link.dataset.navKey === 'admin-members';
    link.hidden = isAdminManagement ? !isAdmin : !canMembers;
    link.setAttribute('aria-hidden', String(link.hidden));
    if (link.hidden) link.setAttribute('tabindex', '-1');
    else link.removeAttribute('tabindex');
  });

  document.querySelectorAll('.sidebar-section, .nav-group').forEach(group => {
    const title = group.querySelector('.sidebar-title, .nav-title');
    if (!title) return;
    const label = title.textContent.trim().toUpperCase();
    if (label.includes('QUẢN TRỊ') || label.includes('ADMIN')) group.hidden = !isAdmin;
  });

  if (location.pathname.toLowerCase().endsWith('/members.html') && !canMembers) window.location.replace('dashboard.html');
}

async function load() {
  if (!auth.currentUser) return state;
  state.uid = auth.currentUser.uid;
  try {
    const snap = await getDoc(doc(db, 'memberships', MEMBERSHIP_ID(state.uid)));
    setRole(snap.exists() ? roleFromMembership(snap.data()) : 'MEMBER');
  } catch (error) { console.warn('Permission profile unavailable; defaulting to MEMBER.', error); setRole('MEMBER'); }
  state.ready = true; applyNavigation();
  window.dispatchEvent(new CustomEvent('saovn:permissions-ready', { detail: state }));
  return state;
}

readyPromise = new Promise(resolve => onAuthStateChanged(auth, async user => {
  if (!user) { state = { ready: true, uid: null, role: 'MEMBER', permissions: new Set(ROLE_PERMISSIONS.MEMBER) }; applyNavigation(); resolve(state); return; }
  resolve(await load());
}));

export async function getPermissions() { await readyPromise; return state; }
export const role = () => state.role;
export const permissionState = () => state;
export const permissionsForRole = roleName => [...(ROLE_PERMISSIONS[String(roleName || 'MEMBER').toUpperCase()] || ROLE_PERMISSIONS.MEMBER)];
window.SAOVNPermissions = { get: getPermissions, can, hasPermission, role, state: permissionState, permissionsForRole };