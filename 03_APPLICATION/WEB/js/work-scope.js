import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID=uid=>`mem_${uid}_org_saovn_01`;
const clean=v=>String(v??'').trim();
const lower=v=>clean(v).toLowerCase();
const roleList=data=>{const roles=data?.roles||{};return [...(Array.isArray(roles.system)?roles.system:[]),...(Array.isArray(roles.organization)?roles.organization:[]),...(Array.isArray(data?.role)?data.role:[data?.role].filter(Boolean))].map(v=>lower(v));};
const MANAGEMENT_POSITIONS=new Set(['MANAGER','DEPARTMENT_HEAD','DIRECTOR','CEO','CFO','CTO','COO','CHRO','CMO','VICE_PRESIDENT','VP','EXECUTIVE','FOUNDER_CHAIRMAN_CEO']);
const TEAM_LEAD_POSITIONS=new Set(['TEAM_LEAD','TEAM_LEADER']);

export async function getWorkScope(){
 const user=auth.currentUser;
 if(!user)return{type:'NONE',uid:null,departmentId:'',department:'',teamId:'',team:'',managerId:'',label:'Chưa đăng nhập'};
 let identity={},membership={};
 try{const s=await getDoc(doc(db,'identities',user.uid));if(s.exists())identity=s.data()||{};}catch(e){console.warn('Work identity read skipped:',e?.code||e)}
 try{const s=await getDoc(doc(db,'memberships',MEMBERSHIP_ID(user.uid)));if(s.exists())membership=s.data()||{};}catch(e){console.warn('Work membership read skipped:',e?.code||e)}
 const roles=roleList(membership),position=clean(identity.position||membership.position).toUpperCase();
 const admin=roles.some(r=>r.includes('system_admin')||r==='admin'||r.includes('org_admin')||r.includes('organization_admin'));
 const manager=roles.some(r=>r==='manager'||r==='org_manager'||r.includes('manager')||r==='director'||r==='executive'||r==='ceo'||r==='cfo'||r==='cto'||r==='coo'||r==='chro'||r==='cmo'||r==='vice_president'||r==='vp')||MANAGEMENT_POSITIONS.has(position);
 const teamLead=roles.some(r=>r==='team_lead'||r==='team_leader')||TEAM_LEAD_POSITIONS.has(position);
 const departmentId=clean(membership.departmentId||identity.departmentId),department=clean(membership.department||identity.department),teamId=clean(membership.teamId||identity.teamId),team=clean(membership.team||identity.team),managerId=clean(membership.managerId||identity.managerId);
 if(admin)return{type:'ORGANIZATION',uid:user.uid,departmentId,department,teamId,team,managerId,label:'Toàn hệ thống'};
 if(manager&&departmentId)return{type:'DEPARTMENT',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi phòng · ${department||departmentId}`};
 if(manager&&department)return{type:'DEPARTMENT_LEGACY',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi phòng · ${department}`};
 if(teamLead&&(teamId||team))return{type:'TEAM',uid:user.uid,departmentId,department,teamId,team,managerId,label:`Phạm vi Team · ${team||teamId}`};
 return{type:'PERSONAL',uid:user.uid,departmentId,department,teamId,team,managerId,label:'Phạm vi cá nhân'};
}

export function taskInScope(task,scope){
 if(!scope||scope.type==='NONE')return false;if(scope.type==='ORGANIZATION')return true;
 const uid=clean(scope.uid),createdBy=clean(task?.createdBy),assignedIds=Array.isArray(task?.assigneeIds)?task.assigneeIds.map(clean):[],legacyAssignee=clean(task?.assigneeId),embedded=Array.isArray(task?.assignees)?task.assignees.map(a=>clean(a?.id)).filter(Boolean):[];
 if(uid===createdBy||assignedIds.includes(uid)||embedded.includes(uid)||legacyAssignee===uid)return true;
 const taskDepartmentId=clean(task?.departmentId),taskDepartment=clean(task?.department),taskTeamId=clean(task?.teamId),taskTeam=clean(task?.team);
 if(scope.type.startsWith('DEPARTMENT'))return(scope.departmentId&&taskDepartmentId&&scope.departmentId===taskDepartmentId)||(scope.department&&taskDepartment&&lower(scope.department)===lower(taskDepartment));
 if(scope.type==='TEAM')return(scope.teamId&&taskTeamId&&scope.teamId===taskTeamId)||(scope.team&&taskTeam&&lower(scope.team)===lower(taskTeam));
 return false;
}
export function stampTaskScope(task,scope){const next={...task};if(scope?.departmentId)next.departmentId=scope.departmentId;if(scope?.department)next.department=scope.department;if(scope?.teamId)next.teamId=scope.teamId;if(scope?.team)next.team=scope.team;return next;}
window.SAOVNWorkScope={get:getWorkScope,inScope:taskInScope,stamp:stampTaskScope};