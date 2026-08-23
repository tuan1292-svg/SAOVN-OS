/* SAOVN-OS Core — Policy Engine
 * One capability contract for the whole Experience Plane.
 * UI uses this for rendering only; backend/data rules remain authoritative.
 */

import { ACCESS, ACCESS_LIST, ACCESS_SCOPE } from './access-contract.js';
import { createOrganizationContext } from './organization-context.js';

const EMPTY = Object.freeze({});
const KNOWN_CAPABILITIES = new Set(ACCESS_LIST);

export const SCOPE_ORDER = Object.freeze([...ACCESS_SCOPE]);

export function normalizeScope(scope = {}) {
  const type = String(scope.type || 'SELF').toUpperCase();
  return Object.freeze({
    type: SCOPE_ORDER.includes(type) ? type : 'SELF',
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

export function normalizeRoleId(roleId) {
  return String(roleId || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function normalizeCapability(capability) {
  return String(capability || '').trim();
}

function addKnownCapability(result, capability) {
  const normalized = normalizeCapability(capability);
  if (KNOWN_CAPABILITIES.has(normalized)) result.add(normalized);
}

export function resolveCapabilities({ membership = {}, policy = {} } = {}) {
  const p = normalizePolicy(policy);
  const rawRoleIds = Array.isArray(membership.roleIds)
    ? membership.roleIds
    : (membership.role ? [membership.role] : []);
  const roleIds = [...new Set(rawRoleIds.map(normalizeRoleId).filter(Boolean))];

  const result = new Set();

  // Explicit membership capabilities are accepted only when they belong to
  // the canonical access contract. Unknown strings never become permissions.
  for (const capability of membership.capabilities || []) addKnownCapability(result, capability);

  // Roles grant capabilities; roles are authorization roles, not job titles.
  for (const roleId of roleIds) {
    const role = p.roles?.[roleId] || p.roles?.[String(roleId).toLowerCase()];
    if (!role) continue;
    for (const capability of role.capabilities || []) addKnownCapability(result, capability);
  }

  // Runtime policy rules are the final layer. Explicit false always revokes
  // a capability previously granted by membership or role.
  for (const [capability, rule] of Object.entries(p.capabilities || {})) {
    const normalized = normalizeCapability(capability);
    if (!KNOWN_CAPABILITIES.has(normalized)) continue;
    if (rule === true) result.add(normalized);
    if (rule === false) result.delete(normalized);
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
    const roles = (membership.roleIds || (membership.role ? [membership.role] : [])).map(normalizeRoleId);
    const allowedRoles = module.roles.map(normalizeRoleId);
    if (!roles.some(role => allowedRoles.includes(role))) return false;
  }
  return true;
}

export function buildRuntimeContext({ user = null, membership = {}, policy = {} } = {}) {
  const normalizedPolicy = normalizePolicy(policy);
  const scope = normalizeScope(membership.scope || membership);
  const capabilities = resolveCapabilities({ membership, policy: normalizedPolicy });
  const organization = createOrganizationContext({ identity: user || {}, membership });

  return Object.freeze({
    user,
    membership,
    organization,
    policy: normalizedPolicy,
    scope,
    capabilities,
    access: ACCESS,
    can: capability => can(capabilities, capability),
    moduleEnabled: moduleId => moduleEnabled(normalizedPolicy, moduleId, membership)
  });
}
