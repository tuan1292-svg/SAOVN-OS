/* SAOVN-OS Core — Module Registry
 * One registry for the shared Experience Plane.
 * Modules declare contracts; Admin/Policy controls whether they are enabled.
 */

const registry = new Map();

function validateManifest(manifest) {
  if (!manifest?.id) throw new Error('Module manifest requires id');
  if (!Array.isArray(manifest.dependencies)) manifest.dependencies = [];
  if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
  if (!Array.isArray(manifest.routes)) manifest.routes = [];
  if (!Array.isArray(manifest.navigation)) manifest.navigation = [];
  if (!Array.isArray(manifest.events)) manifest.events = [];
  return Object.freeze({ ...manifest });
}

export function registerModule(manifest) {
  const normalized = validateManifest({ ...manifest });
  if (registry.has(normalized.id)) throw new Error(`Module already registered: ${normalized.id}`);
  registry.set(normalized.id, normalized);
  return normalized;
}

export function getModule(id) { return registry.get(id) || null; }
export function listModules() { return [...registry.values()]; }
export function hasModule(id) { return registry.has(id); }
export function enabledModules(runtime) { return listModules().filter(module => runtime?.moduleEnabled?.(module.id) !== false); }
export function moduleHealth() { return listModules().map(module => ({ id: module.id, version: module.version || '0.0.0', status: 'registered' })); }

const CORE_MODULES = [
  {
    id: 'dashboard', version: '1.0.0', label: 'Tổng quan',
    capabilities: ['dashboard.view'], routes: ['dashboard.html'], navigation: ['core'], events: ['runtime.ready']
  },
  {
    id: 'work', version: '1.0.0', label: 'Công việc',
    capabilities: ['work.task.view', 'work.task.create', 'work.task.update', 'work.task.assign', 'work.comment.create', 'work.checklist.update'],
    routes: ['work.html'], navigation: ['core'], events: ['work.changed']
  },
  {
    id: 'departments', version: '1.0.0', label: 'Phòng ban',
    capabilities: ['organization.department.view'], routes: ['departments.html'], navigation: ['core'], events: ['organization.changed']
  },
  {
    id: 'members', version: '1.0.0', label: 'Thành viên',
    capabilities: ['people.member.view', 'people.member.create', 'people.member.update', 'people.member.role.manage'],
    routes: ['members.html'], navigation: ['people'], events: ['identity.changed', 'membership.changed']
  },
  {
    id: 'projects', version: '1.0.0', label: 'Dự án',
    capabilities: ['project.view', 'project.create', 'project.update'], routes: ['projects.html'], navigation: ['work'], events: ['project.changed']
  },
  {
    id: 'attendance', version: '1.0.0', label: 'Điểm danh',
    capabilities: ['attendance.view', 'attendance.manage'], routes: ['attendance.html'], navigation: ['people'], events: ['attendance.changed']
  },
  {
    id: 'chat', version: '1.0.0', label: 'Trò chuyện',
    capabilities: ['chat.view'], routes: ['chat.html'], navigation: ['communication'], events: ['message.created', 'message.read']
  },
  {
    id: 'notifications', version: '1.0.0', label: 'Thông báo',
    capabilities: ['notifications.view'], routes: ['notifications.html'], navigation: ['communication'], events: ['notification.created', 'notification.read']
  }
];

for (const manifest of CORE_MODULES) {
  try { registerModule(manifest); } catch (error) { console.warn('[SAOVN][MODULE] registry:', error?.message || error); }
}

window.SAOVNModuleRegistry = { registerModule, getModule, listModules, hasModule, enabledModules, moduleHealth };
