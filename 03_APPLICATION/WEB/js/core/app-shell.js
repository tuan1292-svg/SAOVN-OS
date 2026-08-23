/* SAOVN-OS Experience Plane — Shared Application Shell */
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions } from '../permissions.js';
import { listModules } from './module-registry.js';

const identityCache = new Map();
let started = false;

function text(selector, value) {
  document.querySelectorAll(selector).forEach(node => { node.textContent = value || ''; });
}

function roleLabel(role) {
  return ({ ADMIN: 'Quản trị hệ thống', MANAGER: 'Quản lý phạm vi', MEMBER: 'Thành viên' })[role] || 'Thành viên';
}

function applyCapabilityVisibility(state) {
  const canManageSystem = state.role === 'ADMIN' || state.permissions.has('admin.system.manage');
  document.querySelectorAll('[data-admin-only]').forEach(node => {
    node.hidden = !canManageSystem;
    node.setAttribute('aria-hidden', String(!canManageSystem));
  });
}

function cleanLegacyExperienceNavigation(isAdmin) {
  document.querySelectorAll('.sidebar-section.module-section').forEach(section => section.remove());

  document.querySelectorAll('.sidebar-section').forEach(section => {
    const title = section.querySelector('.sidebar-title')?.textContent?.trim().toUpperCase() || '';
    if (!title.startsWith('QUẢN TRỊ') && !title.includes('ADMIN')) return;

    section.hidden = !isAdmin;
    section.setAttribute('aria-hidden', String(!isAdmin));

    if (!isAdmin) return;

    const nav = section.querySelector('nav') || section;
    [...nav.querySelectorAll('a')].forEach(link => {
      if (!link.dataset.controlPlaneEntry) link.remove();
    });

    if (!nav.querySelector('[data-control-plane-entry]')) {
      const link = document.createElement('a');
      link.href = 'admin-control.html';
      link.className = 'navigation-item';
      link.dataset.controlPlaneEntry = 'true';
      link.innerHTML = '<span class="nav-icon">⚙</span><span>Control Plane</span>';
      nav.appendChild(link);
    }
  });
}

function applyControlPlaneVisibility(state) {
  const isAdmin = state.role === 'ADMIN' || state.permissions.has('admin.system.manage');
  document.querySelectorAll('[data-control-plane]').forEach(node => {
    node.hidden = !isAdmin;
    node.setAttribute('aria-hidden', String(!isAdmin));
  });
  applyCapabilityVisibility(state);
  cleanLegacyExperienceNavigation(isAdmin);
  document.documentElement.dataset.saovnControlPlane = isAdmin ? 'admin' : 'hidden';
}

async function loadIdentity(uid, fallbackUser, membership = {}) {
  const cacheKey = `${uid}:${membership?.id || membership?.membershipId || ''}`;
  if (identityCache.has(cacheKey)) return identityCache.get(cacheKey);
  try {
    const snap = await getDoc(doc(db, 'identities', uid));
    const data = snap.exists() ? snap.data() : {};
    const identity = {
      name: data.fullName || data.displayName || fallbackUser.displayName || fallbackUser.email?.split('@')[0] || 'Thành viên',
      email: data.email || fallbackUser.email || '',
      title: membership.title || membership.jobTitle || data.title || data.jobTitle || '',
      avatarUrl: data.photoURL || fallbackUser.photoURL || ''
    };
    identityCache.set(cacheKey, identity);
    return identity;
  } catch (error) {
    return { name: fallbackUser.displayName || fallbackUser.email?.split('@')[0] || 'Thành viên', email: fallbackUser.email || '', title: membership.title || membership.jobTitle || '', avatarUrl: fallbackUser.photoURL || '' };
  }
}

function applyIdentity(identity, role) {
  text('#userIdentity, [data-identity-name]', identity.name);
  text('#topbarIdentity', identity.name);
  text('[data-identity-email]', identity.email);
  text('[data-runtime-role]', identity.title || roleLabel(role));
  text('[data-runtime-position]', identity.title || '');
  document.querySelectorAll('.user-avatar, .avatar').forEach(node => {
    if (identity.avatarUrl) {
      node.textContent = '';
      node.style.backgroundImage = `url(\"${identity.avatarUrl.replaceAll('"', '')}\")`;
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center';
    } else node.textContent = identity.name.trim().charAt(0).toUpperCase() || 'S';
  });
  document.documentElement.dataset.saovnRole = role;
  document.documentElement.dataset.saovnIdentityReady = 'true';
}

function installRouteGuard(state) {
  const route = (location.pathname.split('/').pop() || '').toLowerCase();
  const context = state.context;
  if (!context) return;
  if (route === 'admin-control.html' && !state.permissions.has('admin.system.manage')) {
    location.replace('dashboard.html');
    return;
  }
  const module = listModules().find(item => item.routes?.some(path => String(path).split('/').pop()?.toLowerCase() === route));
  if (!module) return;
  const enabled = context.moduleEnabled(module.id);
  const allowed = enabled && module.capabilities.some(capability => context.can(capability));
  if (!allowed) location.replace('dashboard.html');
}

async function start(user) {
  if (!user) {
    document.documentElement.dataset.saovnAuth = 'anonymous';
    if (!['index.html', 'activate.html', ''].includes((location.pathname.split('/').pop() || '').toLowerCase())) location.replace('index.html');
    return;
  }
  document.documentElement.dataset.saovnAuth = 'authenticated';
  const state = await getPermissions();
  const identity = await loadIdentity(user.uid, user, state.context?.membership || {});
  applyIdentity(identity, state.role);
  applyControlPlaneVisibility(state);
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
