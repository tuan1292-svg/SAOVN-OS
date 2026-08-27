import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID = uid => `mem_${uid}_org_saovn_01`;
const clean = v => String(v ?? '').trim();
const lower = v => clean(v).toLowerCase();
const asIds = value => Array.isArray(value) ? value.map(clean).filter(Boolean) : (clean(value) ? [clean(value)] : []);
const roleValues = value => Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.entries(value).filter(([,v]) => v === true).map(([k]) => k) : (clean(value) ? [value] : []));
const roleList = data => {
  const roles = data?.roles || {};
  return [
    ...roleValues(roles.system),
    ...roleValues(roles.organization),
    ...roleValues(data?.role),
    ...roleValues(data?.roles)
  ].map(v => lower(v));
};
const MANAGEMENT_POSITIONS = new Set(['MANAGER','DEPARTMENT_HEAD','DIRECTOR','CEO','CFO','CTO','COO','CHRO','CMO','VICE_PRESIDENT','VP','EXECUTIVE','FOUNDER_CHAIRMAN_CEO']);
const TEAM_LEAD_POSITIONS = new Set(['TEAM_LEAD','TEAM_LEADER']);

export async function getWorkScope() {
  const user = auth.currentUser;
  if (!user) return { type:'NONE', uid:null, departmentId:'', department:'', teamId:'', team:'', managerId:'', label:'Chưa đăng nhập' };
  let identity = {}, membership = {};
  try { const s = await getDoc(doc(db,'identities',user.uid)); if (s.exists()) identity = s.data() || {}; } catch (e) { console.warn('Work identity read skipped:', e?.code || e); }
  try { const s = await getDoc(doc(db,'memberships',MEMBERSHIP_ID(user.uid))); if (s.exists()) membership = s.data() || {}; } catch (e) { console.warn('Work membership read skipped:', e?.code || e); }
  const roles = [...roleList(membership), ...roleList(identity)];
  const position = clean(identity.position || membership.position).toUpperCase();
  const admin = roles.some(r => r.includes('system_admin') || r === 'admin' || r.includes('org_admin') || r.includes('organization_admin'));
  const manager = roles.some(r => r === 'manager' || r === 'org_manager' || r.includes('manager') || r === 'director' || r === 'executive' || r === 'ceo' || r === 'cfo' || r === 'cto' || r === 'coo' || r === 'chro' || r === 'cmo' || r === 'vice_president' || r === 'vp') || MANAGEMENT_POSITIONS.has(position);
  const teamLead = roles.some(r => r === 'team_lead' || r === 'team_leader') || TEAM_LEAD_POSITIONS.has(position);
  const departmentId = clean(membership.departmentId || identity.departmentId), department = clean(membership.department || identity.department), teamId = clean(membership.teamId || identity.teamId), team = clean(membership.team || identity.team), managerId = clean(membership.managerId || identity.managerId);
  if (admin) return { type:'ORGANIZATION', uid:user.uid, departmentId, department, teamId, team, managerId, label:'Toàn hệ thống' };
  if (manager && departmentId) return { type:'DEPARTMENT', uid:user.uid, departmentId, department, teamId, team, managerId, label:`Phạm vi phòng · ${department || departmentId}` };
  if (manager && department) return { type:'DEPARTMENT_LEGACY', uid:user.uid, departmentId, department, teamId, team, managerId, label:`Phạm vi phòng · ${department}` };
  if (teamLead && (teamId || team)) return { type:'TEAM', uid:user.uid, departmentId, department, teamId, team, managerId, label:`Phạm vi Team · ${team || teamId}` };
  return { type:'PERSONAL', uid:user.uid, departmentId, department, teamId, team, managerId, label:'Phạm vi cá nhân' };
}

export function taskInScope(task, scope) {
  if (!scope || scope.type === 'NONE') return false;
  if (scope.type === 'ORGANIZATION') return true;
  const uid = clean(scope.uid);
  const createdBy = clean(task?.createdBy || task?.createdByUid || task?.ownerId);
  const assignedIds = asIds(task?.assigneeIds || task?.assignedUserIds || task?.assignedTo);
  const legacyAssignee = clean(task?.assigneeId || task?.assignedUserId);
  const embedded = Array.isArray(task?.assignees) ? task.assignees.map(a => clean(a?.id || a?.uid || a?.userId)).filter(Boolean) : [];
  if (uid && (uid === createdBy || assignedIds.includes(uid) || embedded.includes(uid) || legacyAssignee === uid)) return true;
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];
  const taskDepartmentIds = new Set([...asIds(task?.departmentId), ...asIds(task?.departmentIds), ...asIds(task?.department), ...(Array.isArray(task?.departments) ? task.departments.flatMap(d => asIds(d?.id || d?.departmentId || d?.name || d)) : []), ...assignees.flatMap(a => asIds(a?.departmentId || a?.departmentIds))].map(lower));
  const taskDepartmentNames = new Set([clean(task?.department), ...(Array.isArray(task?.departments) ? task.departments.map(d => clean(d?.name || d?.department || d)).filter(Boolean) : []), ...assignees.flatMap(a => [clean(a?.department), clean(a?.departmentName)]).filter(Boolean)].map(lower));
  const taskTeamIds = new Set([...asIds(task?.teamId), ...asIds(task?.teamIds), ...asIds(task?.team), ...assignees.flatMap(a => asIds(a?.teamId || a?.teamIds))].map(lower));
  const taskTeamNames = new Set([clean(task?.team), clean(task?.teamName), ...assignees.flatMap(a => [clean(a?.team), clean(a?.teamName)]).filter(Boolean)].filter(Boolean).map(lower));
  if (scope.type.startsWith('DEPARTMENT')) {
    const departmentId = lower(scope.departmentId), department = lower(scope.department);
    return Boolean((departmentId && taskDepartmentIds.has(departmentId)) || (department && taskDepartmentNames.has(department)));
  }
  if (scope.type === 'TEAM') {
    const teamId = lower(scope.teamId), team = lower(scope.team);
    return Boolean((teamId && taskTeamIds.has(teamId)) || (team && taskTeamNames.has(team)));
  }
  return false;
}

export function stampTaskScope(task, scope) {
  const next = { ...task };
  if (scope?.departmentId) { next.departmentId = scope.departmentId; next.departmentIds = Array.from(new Set([...(Array.isArray(next.departmentIds) ? next.departmentIds : []), scope.departmentId])); }
  if (scope?.department) next.department = scope.department;
  if (scope?.teamId) { next.teamId = scope.teamId; next.teamIds = Array.from(new Set([...(Array.isArray(next.teamIds) ? next.teamIds : []), scope.teamId])); }
  if (scope?.team) { next.team = scope.team; next.teamName = scope.team; }
  return next;
}

window.SAOVNWorkScope = { get:getWorkScope, inScope:taskInScope, stamp:stampTaskScope };