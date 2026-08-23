import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;
const norm = value => String(value || '').trim().toUpperCase();

/**
 * Organization scope is DATA SCOPE, not authorization.
 * Job title / reporting structure may describe scope, but never grants
 * ADMIN or MANAGER capabilities. Authorization is resolved by permissions.js.
 */
export async function loadOrgScope(uid) {
  if (!uid) return {
    uid: null, role: 'MEMBER', identity: null, membership: null,
    departmentId: '', team: '', teamId: '', managerId: '', directReportIds: [],
    departmentHeadId: '', isDepartmentHead: false, isTeamLead: false, scope: 'SELF'
  };

  const [identitySnap, membershipSnap] = await Promise.all([
    getDoc(doc(db, 'identities', uid)),
    getDoc(doc(db, 'memberships', MEMBERSHIP_ID(uid)))
  ]);

  const identity = identitySnap.exists() ? { id: identitySnap.id, ...identitySnap.data() } : null;
  const membership = membershipSnap.exists() ? { id: membershipSnap.id, ...membershipSnap.data() } : null;
  const systemRoles = Array.isArray(membership?.roles?.system) ? membership.roles.system : [];
  const organizationRoles = Array.isArray(membership?.roles?.organization) ? membership.roles.organization : [];
  const roles = [...systemRoles, ...organizationRoles].map(norm);

  const departmentId = membership?.departmentId || identity?.departmentId || '';
  const team = membership?.team || identity?.team || '';
  const teamId = membership?.teamId || identity?.teamId || '';
  const managerId = membership?.managerId || identity?.managerId || '';

  // Role here is a canonical authorization hint only. Never infer MANAGER
  // from position/job title; permissions.js remains the authority.
  const role = roles.some(r => r === 'ADMIN') ? 'ADMIN' :
    roles.some(r => r === 'MANAGER') ? 'MANAGER' : 'MEMBER';

  let departmentHeadId = '';
  try {
    if (departmentId) {
      const departmentSnap = await getDoc(doc(db, 'departments', departmentId));
      if (departmentSnap.exists()) departmentHeadId = String(departmentSnap.data()?.headId || '');
    }
  } catch (error) {
    console.warn('Không tải được trưởng phòng:', error);
  }

  let directReportIds = [];
  try {
    const snap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    directReportIds = snap.docs
      .filter(snapDoc => String(snapDoc.data()?.managerId || '') === uid)
      .map(snapDoc => snapDoc.id);
  } catch (error) {
    console.warn('Không tải được phạm vi quản lý trực tiếp:', error);
  }

  // These flags describe organizational relationships only. They do NOT
  // elevate permissions. A department head/team lead can still be MEMBER.
  const isDepartmentHead = departmentHeadId === uid;
  const isTeamLead = false; // team-lead status must come from explicit policy/capability

  let scope = 'SELF';
  if (role === 'ADMIN') scope = 'SYSTEM';
  else if (isDepartmentHead) scope = 'DEPARTMENT';
  else if (directReportIds.length) scope = 'MANAGEMENT';

  return {
    uid, role, identity, membership, departmentId, team, teamId, managerId,
    directReportIds, departmentHeadId, isDepartmentHead, isTeamLead, scope
  };
}

export function scopeLabel(scope) {
  if (scope?.scope === 'SYSTEM') return 'Toàn hệ thống';
  if (scope?.scope === 'DEPARTMENT') return 'Phạm vi phòng ban';
  if (scope?.scope === 'MANAGEMENT') return `Phạm vi quản lý · ${scope.directReportIds?.length || 0} nhân sự trực tiếp`;
  return 'Phạm vi cá nhân';
}
