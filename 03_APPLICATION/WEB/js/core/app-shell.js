/* SAOVN-OS Experience Plane — Shared Application Shell
 * One shell for every authenticated person. Role/capability changes the
 * available experience; it never creates a separate application.
 */

import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions } from '../permissions.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;
const identityCache = new Map();
let started = false;

function text(selector, value) {
  document.querySelectorAll(selector).forEach(node => { node.textContent = value || ''; });
}

function roleLabel(role) {
  return ({
    ADMIN: 'Quản trị hệ thống',
    MANAGER: 'Quản lý',
    MEMBER: 'Thành viên'
  })[role] || 'Thành viên';
}

async function loadIdentity(uid, fallbackUser) {
  if (identityCache.has(uid)) return identityCache.get(uid);
  try {
    const snap = await getDoc(doc(db, 'identities', uid));
    const data = snap.exists() ? snap.data() : {};
    const identity = {
      name: data.fullName || data.displayName || fallbackUser.displayName || fallbackUser.email?.split('@')[0] || 'Thành viên',
      email: data.email || fallbackUser.email || '',
      avatarUrl: data.photoURL || fallbackUser.photoURL || ''
    };
    identityCache.set(uid, identity);
    return identity;
  } catch (error) {
    return {
      name: fallbackUser.displayName || fallbackUser.email?.split('@')[0] || 'Thành viên',
      email: fallbackUser.email || '',
      avatarUrl: fallbackUser.photoURL || ''
    };
  }
}

function applyIdentity(identity, role) {
  text('#userIdentity, [data-identity-name]', identity.name);
  text('#topbarIdentity', identity.name);
  text('[data-identity-email]', identity.email);
  text('[data-runtime-role]', roleLabel(role));

  document.querySelectorAll('.user-avatar, .avatar').forEach(node => {
    if (identity.avatarUrl) {
      node.textContent = '';
      node.style.backgroundImage = `url("${identity.avatarUrl.replaceAll('"', '')}")`;
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center';
    } else {
      node.textContent = identity.name.trim().charAt(0).toUpperCase() || 'S';
    }
  });

  document.documentElement.dataset.saovnRole = role;
  document.documentElement.dataset.saovnIdentityReady = 'true';
}

function installRouteGuard(state) {
  const route = location.pathname.split('/').pop()?.toLowerCase() || '';
  const context = state.context;
  if (!context) return;
  if (route === 'admin-control.html' && !state.permissions.has('admin.system.manage')) {
    location.replace('dashboard.html');
    return;
  }
  if (route === 'members.html' && !state.permissions.has('people.member.view')) {
    location.replace('dashboard.html');
  }
}

async function start(user) {
  if (!user) {
    document.documentElement.dataset.saovnAuth = 'anonymous';
    if (!['index.html', 'activate.html', ''].includes(location.pathname.split('/').pop()?.toLowerCase() || '')) {
      location.replace('index.html');
    }
    return;
  }

  document.documentElement.dataset.saovnAuth = 'authenticated';
  const [state, identity] = await Promise.all([
    getPermissions(),
    loadIdentity(user.uid, user)
  ]);
  applyIdentity(identity, state.role);
  installRouteGuard(state);
  window.dispatchEvent(new CustomEvent('saovn:shell-ready', { detail: { identity, state } }));
}

export function initAppShell() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, user => start(user).catch(error => {
    console.error('[SAOVN][SHELL] startup failed', error);
    document.documentElement.dataset.saovnShellError = 'true';
  }));
}

if (typeof window !== 'undefined') initAppShell();
