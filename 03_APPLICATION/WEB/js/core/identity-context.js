/* SAOVN-OS Core — Identity Context
 * Normalizes the identity/membership boundary consumed by the Experience Plane.
 * It never grants access or invents a security scope.
 */

export function normalizeIdentity(user = {}, member = {}) {
  const displayName = String(member.displayName || member.fullName || member.name || user.displayName || '').trim();
  const title = String(member.title || member.position || member.jobTitle || '').trim();
  const uid = String(user.uid || member.uid || member.userId || '').trim();
  return Object.freeze({
    uid,
    displayName: displayName || 'Chưa xác định',
    title,
    email: String(member.email || user.email || '').trim(),
    photoURL: member.photoURL || user.photoURL || ''
  });
}

export function normalizeMembership(member = {}) {
  const roleIds = [...new Set((Array.isArray(member.roleIds) ? member.roleIds : [member.role || member.systemRole].filter(Boolean))
    .map(value => String(value).trim().toUpperCase()).filter(Boolean))];

  return Object.freeze({
    id: member.id || '',
    organizationId: member.organizationId || member.orgId || '',
    companyId: member.companyId || '',
    departmentId: member.departmentId || '',
    teamId: member.teamId || '',
    projectId: member.projectId || '',
    roleIds,
    status: String(member.status || 'active').toLowerCase(),
    managerId: member.managerId || member.directManagerId || '',
    teamLead: Boolean(member.teamLead || member.isTeamLead),
    departmentHead: Boolean(member.departmentHead || member.isDepartmentHead)
  });
}

export function buildIdentityContext({ user = {}, member = {} } = {}) {
  const identity = normalizeIdentity(user, member);
  const membership = normalizeMembership(member);
  return Object.freeze({
    identity,
    membership,
    scope: Object.freeze({
      organizationId: membership.organizationId,
      companyId: membership.companyId,
      departmentId: membership.departmentId,
      teamId: membership.teamId,
      projectId: membership.projectId
    })
  });
}

window.SAOVNIdentityContext = { normalizeIdentity, normalizeMembership, buildIdentityContext };
