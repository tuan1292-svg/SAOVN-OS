import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;
const norm = value => String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
const roleValues = value => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.entries(value).filter(([,enabled]) => enabled === true).map(([key]) => key);
  return value ? [value] : [];
};

/** Organization scope is DATA SCOPE, never authorization. */
export async function loadOrgScope(uid) {
  if (!uid) return { uid:null, role:'MEMBER', identity:null, membership:null, departmentId:'', team:'', teamId:'', managerId:'', directReportIds:[], departmentHeadId:'', isDepartmentHead:false, isTeamLead:false, scope:'SELF' };

  const [identitySnap, membershipSnap] = await Promise.all([
    getDoc(doc(db, 'identities', uid)),
    getDoc(doc(db, 'memberships', MEMBERSHIP_ID(uid)))
  ]);
  const identity = identitySnap.exists() ? { id:identitySnap.id, ...identitySnap.data() } : null;
  const membership = membershipSnap.exists() ? { id:membershipSnap.id, ...membershipSnap.data() } : null;
  const roleData = membership?.roles || {};
  const roles = [...roleValues(roleData.system), ...roleValues(roleData.organization), ...roleValues(membership?.role), ...roleValues(membership?.systemRole), ...roleValues(membership?.organizationRole)].map(norm);

  const departmentId = membership?.departmentId || identity?.departmentId || '';
  const team = membership?.team || identity?.team || '';
  const teamId = membership?.teamId || identity?.teamId || '';
  const managerId = membership?.managerId || identity?.managerId || '';
  const role = roles.some(r => ['ADMIN','SYSTEM_ADMIN','ORG_ADMIN','OWNER'].includes(r)) ? 'ADMIN' : roles.some(r => ['MANAGER','DEPARTMENT_MANAGER'].includes(r)) ? 'MANAGER' : 'MEMBER';

  let departmentHeadId = '';
  try {
    if (departmentId) {
      const departmentSnap = await getDoc(doc(db, 'departments', departmentId));
      if (departmentSnap.exists()) departmentHeadId = String(departmentSnap.data()?.headId || departmentSnap.data()?.managerId || '');
    }
  } catch (error) { console.warn('Không tải được trưởng phòng:', error); }

  let directReportIds = [];
  try {
    const snap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    directReportIds = snap.docs.filter(s => String(s.data()?.managerId || '') === uid).map(s => s.id);
  } catch (error) { console.warn('Không tải được phạm vi quản lý trực tiếp:', error); }

  // Organization roles describe reporting/scope only. They never grant auth capabilities.
  const isDepartmentHead = departmentHeadId === uid || roles.includes('DEPARTMENT_HEAD');
  const isTeamLead = roles.includes('TEAM_LEAD') || roles.includes('TEAM_LEADER');
  let scope = 'SELF';
  if (role === 'ADMIN') scope = 'SYSTEM';
  else if (isDepartmentHead) scope = 'DEPARTMENT';
  else if (isTeamLead && (teamId || team)) scope = 'TEAM';
  else if (directReportIds.length) scope = 'MANAGEMENT';

  return { uid, role, identity, membership, departmentId, team, teamId, managerId, directReportIds, departmentHeadId, isDepartmentHead, isTeamLead, scope };
}

export function scopeLabel(scope) {
  if (scope?.scope === 'SYSTEM') return 'Toàn hệ thống';
  if (scope?.scope === 'DEPARTMENT') return 'Phạm vi phòng ban';
  if (scope?.scope === 'TEAM') return 'Phạm vi Team';
  if (scope?.scope === 'MANAGEMENT') return `Phạm vi quản lý · ${scope.directReportIds?.length || 0} nhân sự trực tiếp`;
  return 'Phạm vi cá nhân';
}
