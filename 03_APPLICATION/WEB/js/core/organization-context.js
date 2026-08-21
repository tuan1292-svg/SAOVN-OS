/* SAOVN-OS Core — Organization Context
 * Normalizes company/department/team membership into one read-only context.
 * It does not grant permissions; Policy/Rules remain authoritative.
 */

function clean(value) {
  return value === undefined || value === null || value === '' ? null : String(value);
}

function normalizeMembership(raw = {}) {
  return Object.freeze({
    id: clean(raw.id || raw.membershipId),
    userId: clean(raw.userId || raw.uid),
    organizationId: clean(raw.organizationId || raw.companyId),
    departmentId: clean(raw.departmentId),
    teamId: clean(raw.teamId),
    role: clean(raw.role)?.toUpperCase() || null,
    title: clean(raw.title || raw.jobTitle),
    status: clean(raw.status)?.toUpperCase() || 'ACTIVE'
  });
}

export function createOrganizationContext({ identity = {}, membership = {}, memberships = [] } = {}) {
  const normalized = normalizeMembership(membership);
  const allMemberships = (Array.isArray(memberships) ? memberships : [membership])
    .filter(Boolean).map(normalizeMembership);

  const context = {
    organizationId: normalized.organizationId,
    departmentId: normalized.departmentId,
    teamId: normalized.teamId,
    userId: clean(identity.uid || identity.userId || normalized.userId),
    role: normalized.role,
    title: normalized.title,
    membership: normalized,
    memberships: Object.freeze(allMemberships),
    scope: Object.freeze({
      self: clean(identity.uid || identity.userId || normalized.userId),
      organizationId: normalized.organizationId,
      companyId: normalized.organizationId,
      departmentId: normalized.departmentId,
      teamId: normalized.teamId
    })
  };

  return Object.freeze(context);
}

export function scopeMatches(context, type, target = {}) {
  const scope = context?.scope || {};
  const requested = String(type || 'SELF').toUpperCase();
  if (requested === 'SELF') return !target.userId || target.userId === scope.self;
  if (requested === 'PROJECT') return Boolean(target.projectId);
  if (requested === 'TEAM') return Boolean(scope.teamId && (!target.teamId || target.teamId === scope.teamId));
  if (requested === 'DEPARTMENT') return Boolean(scope.departmentId && (!target.departmentId || target.departmentId === scope.departmentId));
  if (requested === 'COMPANY') return Boolean(scope.organizationId && (!target.organizationId || target.organizationId === scope.organizationId));
  return false;
}

window.SAOVNOrganizationContext = Object.freeze({ createOrganizationContext, scopeMatches });
