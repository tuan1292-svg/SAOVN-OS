import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID=uid=>`mem_${uid}_org_saovn_01`;

const clean=v=>String(v??'').trim();
const lower=v=>clean(v).toLowerCase();
const roleList=data=>{
  const roles=data?.roles||{};
  return [
    ...(Array.isArray(roles.system)?roles.system:[]),
    ...(Array.isArray(roles.organization)?roles.organization:[]),
    ...(Array.isArray(data?.role)?data.role:[data?.role].filter(Boolean))
  ].map(v=>lower(v));
};

export async function getWorkScope(){
  const user=auth.currentUser;
  if(!user) return {type:'NONE',uid:null,departmentId:'',department:'',teamId:'',team:'',managerId:'',label:'Chưa đăng nhập'};

  const [identitySnap,membershipSnap]=await Promise.all([
    getDoc(doc(db,'identities',user.uid)),
    getDoc(doc(db,'memberships',MEMBERSHIP_ID(user.uid)))
  ]);

  const identity=identitySnap.exists()?identitySnap.data():{};
  const membership=membershipSnap.exists()?membershipSnap.data():{};
  const roles=roleList(membership);

  const admin=roles.some(r=>r.includes('system_admin')||r==='admin'||r.includes('org_admin')||r==='organization_admin');
  const manager=roles.some(r=>r==='manager'||r==='org_manager'||r.includes('manager')) || ['MANAGER','DEPARTMENT_HEAD','DIRECTOR'].includes(clean(identity.position).toUpperCase());

  const departmentId=clean(membership.departmentId||identity.departmentId);
  const department=clean(membership.department||identity.department);
  const teamId=clean(membership.teamId||identity.teamId);
  const team=clean(membership.team||identity.team);
  const managerId=clean(membership.managerId||identity.managerId);

  if(admin) return {type:'ORGANIZATION',uid:user.uid,departmentId,department,teamId,team,managerId,label:'Toàn hệ thống'};
  if(manager && departmentId) return {type:'DEPARTMENT',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi phòng · ${department||departmentId}`};
  if(manager && department) return {type:'DEPARTMENT_LEGACY',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi phòng · ${department}`};
  if(teamId||team) return {type:'TEAM',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi Team · ${team||teamId}`};
  return {type:'PERSONAL',uid:user.uid,departmentId,department,teamId,team,managerId,label:'Phạm vi cá nhân'};
}

export function taskInScope(task,scope){
  if(!scope||scope.type==='NONE') return false;
  if(scope.type==='ORGANIZATION') return true;

  const createdBy=clean(task?.createdBy);
  const assignedIds=Array.isArray(task?.assigneeIds)?task.assigneeIds.map(clean):[];
  const legacyAssignee=clean(task?.assigneeId);

  if(scope.uid===createdBy || assignedIds.includes(scope.uid) || legacyAssignee===scope.uid) return true;

  const taskDepartmentId=clean(task?.departmentId);
  const taskDepartment=clean(task?.department);
  const taskTeamId=clean(task?.teamId);
  const taskTeam=clean(task?.team);

  if(scope.type.startsWith('DEPARTMENT')){
    if(scope.departmentId && taskDepartmentId && scope.departmentId===taskDepartmentId) return true;
    if(scope.department && taskDepartment && lower(scope.department)===lower(taskDepartment)) return true;
    return false;
  }

  if(scope.type==='TEAM'){
    if(scope.teamId && taskTeamId && scope.teamId===taskTeamId) return true;
    if(scope.team && taskTeam && lower(scope.team)===lower(taskTeam)) return true;
  }

  return false;
}

export function stampTaskScope(task,scope){
  if(!scope||scope.type==='NONE') return task;
  const next={...task};
  if(scope.departmentId) next.departmentId=scope.departmentId;
  if(scope.department) next.department=scope.department;
  if(scope.teamId) next.teamId=scope.teamId;
  if(scope.team) next.team=scope.team;
  return next;
}

window.SAOVNWorkScope={get:getWorkScope,inScope:taskInScope,stamp:stampTaskScope};
