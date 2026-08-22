/* SAOVN-OS Core — People Context
 * Read-model adapter for People/Members UI.
 * It normalizes identity + membership without granting permissions.
 */

const clean = value => value === undefined || value === null || value === '' ? null : String(value);
const normalizeStatus = value => {
  const status = String(value || 'ACTIVE').toUpperCase();
  return ['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED'].includes(status) ? status : 'ACTIVE';
};
const normalizePosition = value => String(value || 'STAFF').toUpperCase();
const normalizeRoles = membership => {
  const roles = membership?.roles || {};
  const values = [
    ...(Array.isArray(roles.system) ? roles.system : []),
    ...(Array.isArray(roles.organization) ? roles.organization : []),
    ...(Array.isArray(membership?.role) ? membership.role : [membership?.role].filter(Boolean))
  ];
  return [...new Set(values.map(value => String(value).trim().toUpperCase()).filter(Boolean))];
};

export function toPerson(identity = {}, membership = {}) {
  const id = clean(identity.id || identity.uid || membership.identityId || membership.userId);
  const roles = normalizeRoles(membership);
  return Object.freeze({
    id,
    identityId: id,
    membershipId: clean(membership.id || membership.membershipId),
    displayName: clean(identity.displayName || identity.name || identity.fullName || identity.email || id),
    email: clean(identity.email || identity.emailAddress),
    phone: clean(identity.phone || identity.phoneNumber || identity.mobile),
    position: normalizePosition(identity.position || identity.jobTitle || membership.position),
    title: clean(identity.title || identity.jobTitle || membership.title || membership.position),
    organizationId: clean(membership.organizationId || membership.companyId),
    departmentId: clean(membership.departmentId),
    departmentName: clean(membership.department || identity.department),
    teamId: clean(membership.teamId),
    teamName: clean(membership.team || identity.team),
    managerId: clean(membership.managerId || identity.managerId),
    roles,
    status: normalizeStatus(membership.status || identity.status),
    joinedAt: membership.joinedAt || membership.createdAt || identity.createdAt || null
  });
}

export function buildPeopleIndex(identities = [], memberships = []) {
  const membershipByIdentity = new Map();
  for (const membership of memberships || []) {
    const id = clean(membership.identityId || membership.userId || membership.uid);
    if (id) membershipByIdentity.set(id, membership);
  }
  return (identities || []).map(identity => {
    const id = clean(identity.id || identity.uid);
    return toPerson(identity, membershipByIdentity.get(id) || {});
  }).filter(person => person.id);
}

window.SAOVNPeopleContext = Object.freeze({ toPerson, buildPeopleIndex });
