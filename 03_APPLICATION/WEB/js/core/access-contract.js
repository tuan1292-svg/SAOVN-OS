/* SAOVN-OS Core — Canonical Access Contract
 * Shared vocabulary for Experience Plane and Control Plane.
 * This is not a security boundary; Firebase Rules/backend remain authoritative.
 */

export const ACCESS = Object.freeze({
  DASHBOARD: Object.freeze({ VIEW: 'dashboard.view' }),
  WORK: Object.freeze({
    VIEW: 'work.task.view', CREATE: 'work.task.create', UPDATE: 'work.task.update',
    DELETE: 'work.task.delete', ASSIGN: 'work.task.assign', COMMENT: 'work.comment.create',
    CHECKLIST: 'work.checklist.update'
  }),
  ORGANIZATION: Object.freeze({
    DEPARTMENT_VIEW: 'organization.department.view', DEPARTMENT_MANAGE: 'organization.department.manage'
  }),
  PEOPLE: Object.freeze({
    VIEW: 'people.member.view', CREATE: 'people.member.create', UPDATE: 'people.member.update',
    ROLE_MANAGE: 'people.member.role.manage', DELETE: 'people.member.delete'
  }),
  PROJECT: Object.freeze({ VIEW: 'project.view', CREATE: 'project.create', UPDATE: 'project.update', DELETE: 'project.delete' }),
  ATTENDANCE: Object.freeze({ VIEW: 'attendance.view', MANAGE: 'attendance.manage' }),
  CHAT: Object.freeze({ VIEW: 'chat.view' }),
  NOTIFICATIONS: Object.freeze({ VIEW: 'notifications.view' }),
  ADMIN: Object.freeze({ ROLE_MANAGE: 'admin.role.manage', SYSTEM_MANAGE: 'admin.system.manage' })
});

export const ACCESS_LIST = Object.freeze(Object.values(ACCESS).flatMap(group => Object.values(group)));
export const ACCESS_SCOPE = Object.freeze(['SELF', 'PROJECT', 'TEAM', 'DEPARTMENT', 'COMPANY', 'GROUP', 'GLOBAL']);

export function isKnownCapability(value) { return ACCESS_LIST.includes(value); }
export function hasAccess(runtime, capability) { return Boolean(runtime?.can?.(capability) || runtime?.capabilities?.has?.(capability)); }
export function assertAccess(runtime, capability, message = `Missing capability: ${capability}`) {
  if (!isKnownCapability(capability)) throw new Error(`Unknown SAOVN capability: ${capability}`);
  if (!hasAccess(runtime, capability)) throw new Error(message);
  return true;
}

export function visibleForScope(runtime, scope = {}) {
  const current = runtime?.scope || {};
  const requested = String(scope.type || 'SELF').toUpperCase();
  if (!ACCESS_SCOPE.includes(requested)) return false;
  if (requested === 'SELF') return true;
  if (requested === 'GLOBAL' || requested === 'GROUP') return hasAccess(runtime, ACCESS.ADMIN.SYSTEM_MANAGE);
  if (requested === 'COMPANY') return Boolean(current.organizationId || current.companyId);
  if (requested === 'DEPARTMENT') return Boolean(current.departmentId && (!scope.departmentId || scope.departmentId === current.departmentId));
  if (requested === 'TEAM') return Boolean(current.teamId && (!scope.teamId || scope.teamId === current.teamId));
  if (requested === 'PROJECT') return Boolean(current.projectId && (!scope.projectId || scope.projectId === current.projectId));
  return false;
}

export function capabilityList(runtime) {
  return runtime?.capabilities instanceof Set ? [...runtime.capabilities] : [];
}

window.SAOVNAccessContract = Object.freeze({ ACCESS, ACCESS_LIST, ACCESS_SCOPE, isKnownCapability, hasAccess, assertAccess, visibleForScope, capabilityList });
