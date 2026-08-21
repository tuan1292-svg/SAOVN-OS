/* SAOVN-OS Core — Policy Engine
 * One capability contract for the whole Experience Plane.
 * UI uses this for rendering only; backend/data rules remain authoritative.
 */

const EMPTY = Object.freeze({});

export const SCOPE_ORDER = Object.freeze([
  'SELF', 'PROJECT', 'TEAM', 'DEPARTMENT', 'COMPANY', 'GROUP', 'GLOBAL'
]);

export function normalizeScope(scope = {}) {
  return Object.freeze({
    type: String(scope.type || 'SELF').toUpperCase(),
    organizationId: scope.organizationId || '',
    companyId: scope.companyId || '',
    departmentId: scope.departmentId || '',
    teamId: scope.teamId || '',
    projectId: scope.projectId || ''
  });
}

export function normalizePolicy(policy = {}) {
  return Object.freeze({
    version: Number(policy.version || 1),
    modules: policy.modules || EMPTY,
    roles: policy.roles || EMPTY,
    capabilities: policy.capabilities || EMPTY,
    navigation: policy.navigation || EMPTY,
    workflows: policy.workflows || EMPTY
  });
}

export function resolveCapabilities({ membership = {}, policy = {} } = {}) {
  const p = normalizePolicy(policy);
  const roleIds = Array.isArray(membership.roleIds)
    ? membership.roleIds
    : (membership.role ? [membership.role] : []);

  const result = new Set(Array.isArray(membership.capabilities) ? membership.capabilities : []);

  for (const roleId of roleIds) {
    const role = p.roles?.[roleId];
    if (!role) continue;
    for (const capability of role.capabilities || []) result.add(capability);
  }

  for (const [capability, rule] of Object.entries(p.capabilities || {})) {
    if (rule === true) result.add(capability);
    if (rule === false) result.delete(capability);
  }

  return result;
}

export function can(capabilities, capability) {
  return capabilities instanceof Set
    ? capabilities.has(capability)
    : Array.isArray(capabilities) && capabilities.includes(capability);
}

export function moduleEnabled(policy, moduleId, membership = {}) {
  const module = normalizePolicy(policy).modules?.[moduleId];
  if (module === false) return false;
  if (module?.enabled === false) return false;
  if (module?.roles?.length) {
    const roles = membership.roleIds || (membership.role ? [membership.role] : []);
    if (!roles.some(role => module.roles.includes(role))) return false;
  }
  return true;
}

export function buildRuntimeContext({ user = null, membership = {}, policy = {} } = {}) {
  const normalizedPolicy = normalizePolicy(policy);
  const scope = normalizeScope(membership.scope || membership);
  const capabilities = resolveCapabilities({ membership, policy: normalizedPolicy });

  return Object.freeze({
    user,
    membership,
    policy: normalizedPolicy,
    scope,
    capabilities,
    can: capability => can(capabilities, capability),
    moduleEnabled: moduleId => moduleEnabled(normalizedPolicy, moduleId, membership)
  });
}
