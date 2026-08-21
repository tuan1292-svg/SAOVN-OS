/* SAOVN-OS Experience Plane
 * One shared shell for every authenticated user.
 * The shell renders runtime state; it never grants authority.
 */

const MODULE_ROUTES = new Map([
  ['dashboard.html', 'dashboard'],
  ['work.html', 'work'],
  ['departments.html', 'departments'],
  ['members.html', 'members'],
  ['projects.html', 'projects'],
  ['attendance.html', 'attendance'],
  ['chat.html', 'chat'],
  ['notifications.html', 'notifications']
]);

function routeName() {
  return String(location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
}

function applyRuntimeState(state = {}) {
  const context = state.context || window.SAOVNRuntime || {};
  const role = String(state.role || context.role || 'MEMBER').toUpperCase();
  document.documentElement.dataset.saovnRole = role;
  document.documentElement.dataset.saovnAuthenticated = String(Boolean(state.uid || context.uid));

  const moduleId = MODULE_ROUTES.get(routeName());
  if (moduleId) document.documentElement.dataset.saovnModule = moduleId;

  document.querySelectorAll('[data-runtime-capability]').forEach(node => {
    const capability = node.dataset.runtimeCapability;
    const allowed = typeof window.SAOVNPermissions?.hasPermission === 'function'
      ? window.SAOVNPermissions.hasPermission(capability)
      : false;
    node.hidden = !allowed;
    node.setAttribute('aria-hidden', String(!allowed));
  });

  document.dispatchEvent(new CustomEvent('saovn:shell-state', {
    detail: { role, moduleId, authenticated: Boolean(state.uid || context.uid) }
  }));
}

function boot() {
  applyRuntimeState(window.SAOVNPermissions?.state?.() || {});
  window.addEventListener('saovn:permissions-ready', event => applyRuntimeState(event.detail || {}));
  window.addEventListener('saovn:runtime-ready', () => applyRuntimeState(window.SAOVNPermissions?.state?.() || {}));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();

window.SAOVNExperienceShell = Object.freeze({ applyRuntimeState });
