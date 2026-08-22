import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getPermissions, can } from './permissions.js';

let redirected = false;

const hide = selector => {
  document.querySelectorAll(selector).forEach(node => {
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
  });
};

const applyAccess = state => {
  const canRead = state?.permissions?.has?.('people.member.view') || can('members', 'read');
  const canCreate = state?.permissions?.has?.('people.member.create') || can('members', 'create');
  const canUpdate = state?.permissions?.has?.('people.member.update') || can('members', 'update');
  const canManageRoles = state?.permissions?.has?.('people.member.role.manage') || can('members', 'role.manage');

  if (!canRead) {
    if (!redirected) {
      redirected = true;
      window.location.replace('dashboard.html');
    }
    return;
  }

  document.querySelectorAll('#inviteMemberBtn').forEach(node => { node.hidden = !canCreate; });
  document.querySelectorAll('#saveMemberBtn').forEach(node => { node.hidden = !canUpdate; });
  document.querySelectorAll('#roleSelect').forEach(node => { node.disabled = !canManageRoles; });
  document.querySelectorAll('#permissionGrid').forEach(node => { node.hidden = !canManageRoles; });
  document.querySelectorAll('#roleSaveStatus').forEach(node => { node.hidden = !canManageRoles; });

  const roleBox = document.querySelector('#roleSelect')?.closest('.detail-box');
  if (roleBox) roleBox.hidden = !canManageRoles;

  document.querySelectorAll('[data-members-capability]').forEach(node => {
    const capability = node.dataset.membersCapability;
    node.hidden = !state?.permissions?.has?.(capability);
  });
};

const guard = async user => {
  if (redirected) return;
  if (!user) {
    redirected = true;
    window.location.replace('index.html');
    return;
  }

  const state = await getPermissions();
  applyAccess(state);
  window.dispatchEvent(new CustomEvent('saovn:members-access-ready', { detail: state }));
};

onAuthStateChanged(auth, guard);
