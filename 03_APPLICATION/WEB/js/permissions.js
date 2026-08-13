import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;

const roleFromMembership = data => {
  const roles = data?.roles || {};
  const all = [
    ...(Array.isArray(roles.system) ? roles.system : []),
    ...(Array.isArray(roles.organization) ? roles.organization : []),
    ...(Array.isArray(data?.role) ? data.role : [data?.role].filter(Boolean))
  ].map(v => String(v).toLowerCase());
  if (all.some(v => v.includes('system_admin') || v === 'admin' || v === 'administrator' || v.includes('org_admin'))) return 'ADMIN';
  if (all.some(v => v.includes('manager'))) return 'MANAGER';
  return 'MEMBER';
};

// Core navigation policy.
// ADMIN -> Dashboard + Work + Members + Administration
// MANAGER -> Dashboard + Work
// MEMBER -> Dashboard + Work
// UI visibility is not the security boundary; Firestore Rules remain authoritative.
const matrix = {
  ADMIN: { dashboard: 'read', work: 'manage', members: 'manage', projects: 'manage', roles: 'manage', system: 'manage' },
  MANAGER: { dashboard: 'read', work: 'manage', members: 'none', projects: 'manage', roles: 'none', system: 'none' },
  MEMBER: { dashboard: 'read', work: 'contribute', members: 'none', projects: 'assigned', roles: 'none', system: 'none' }
};

let state = { ready: false, uid: null, role: 'MEMBER', permissions: matrix.MEMBER };
let readyPromise;

function applyNavigation() {
  const isAdmin = state.role === 'ADMIN';
  const canMembers = can('members', 'read');

  document.querySelectorAll('a[href="members.html"]').forEach(link => {
    link.hidden = !canMembers;
    link.setAttribute('aria-hidden', String(!canMembers));
    if (!canMembers) link.setAttribute('tabindex', '-1');
  });

  document.querySelectorAll('.sidebar-section, .nav-group').forEach(group => {
    const title = group.querySelector('.sidebar-title, .nav-title');
    if (!title) return;
    const label = title.textContent.trim().toUpperCase();
    if (label.includes('QUẢN TRỊ') || label.includes('ADMIN')) group.hidden = !isAdmin;
  });

  if (location.pathname.toLowerCase().endsWith('/members.html') && !canMembers) {
    window.location.replace('dashboard.html');
  }
}

async function load() {
  if (!auth.currentUser) return state;
  state.uid = auth.currentUser.uid;
  try {
    const snap = await getDoc(doc(db, 'memberships', MEMBERSHIP_ID(state.uid)));
    state.role = snap.exists() ? roleFromMembership(snap.data()) : 'MEMBER';
  } catch (error) {
    console.warn('Permission profile unavailable; defaulting to MEMBER.', error);
    state.role = 'MEMBER';
  }
  state.permissions = matrix[state.role] || matrix.MEMBER;
  state.ready = true;
  applyNavigation();
  window.dispatchEvent(new CustomEvent('saovn:permissions-ready', { detail: state }));
  return state;
}

readyPromise = new Promise(resolve => {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      state = { ...state, ready: true, uid: null };
      resolve(state);
      return;
    }
    resolve(await load());
  });
});

export async function getPermissions() { await readyPromise; return state; }
export function can(area, action = 'read') {
  const level = state.permissions?.[area] || 'none';
  if (level === 'manage') return true;
  if (area === 'work' && level === 'contribute') return ['read', 'create', 'update', 'comment', 'checklist'].includes(action);
  if (level === 'read') return action === 'read';
  if (level === 'assigned') return action === 'read';
  return false;
}
export const role = () => state.role;
export const permissionState = () => state;

window.SAOVNPermissions = { get: getPermissions, can, role, state: permissionState };
