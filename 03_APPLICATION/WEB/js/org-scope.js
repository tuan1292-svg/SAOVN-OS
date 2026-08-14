import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID=uid=>`mem_${uid}_org_saovn_01`;
const norm=v=>String(v||'').trim().toUpperCase();

export async function loadOrgScope(uid){
  if(!uid)return {uid:null,role:'MEMBER',identity:null,membership:null,departmentId:'',team:'',managerId:'',directReportIds:[],isDepartmentHead:false,isTeamLead:false,scope:'SELF'};

  const [identitySnap,membershipSnap]=await Promise.all([
    getDoc(doc(db,'identities',uid)),
    getDoc(doc(db,'memberships',MEMBERSHIP_ID(uid)))
  ]);

  const identity=identitySnap.exists()?{id:identitySnap.id,...identitySnap.data()}:null;
  const membership=membershipSnap.exists()?{id:membershipSnap.id,...membershipSnap.data()}:null;
  const roles=[...(Array.isArray(membership?.roles?.system)?membership.roles.system:[]),...(Array.isArray(membership?.roles?.organization)?membership.roles.organization:[])].map(norm);
  const position=norm(identity?.position||membership?.position);
  const departmentId=membership?.departmentId||identity?.departmentId||'';
  const team=membership?.team||identity?.team||'';
  const teamId=membership?.teamId||identity?.teamId||'';
  const managerId=membership?.managerId||identity?.managerId||'';

  const role=roles.some(r=>r.includes('ADMIN'))?'ADMIN':roles.some(r=>r.includes('MANAGER'))?'MANAGER':roles.some(r=>r.includes('TEAM_LEAD')||r.includes('TEAM_LEADER'))?'TEAM_LEAD':'MEMBER';

  let departmentHeadId='';
  try{
    if(departmentId){
      const departmentSnap=await getDoc(doc(db,'departments',departmentId));
      if(departmentSnap.exists()) departmentHeadId=String(departmentSnap.data()?.headId||'');
    }
  }catch(error){console.warn('Không tải được trưởng phòng:',error)}

  let directReportIds=[];
  try{
    const snap=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
    directReportIds=snap.docs.filter(s=>String(s.data()?.managerId||'')===uid).map(s=>s.id);
  }catch(error){console.warn('Không tải được phạm vi quản lý trực tiếp:',error)}

  const isDepartmentHead=departmentHeadId===uid || position==='DEPARTMENT_HEAD';
  const isTeamLead=role==='TEAM_LEAD' || position==='TEAM_LEAD' || position==='TEAM_LEADER';
  const scope=role==='ADMIN'?'SYSTEM':isDepartmentHead?'DEPARTMENT':isTeamLead?'TEAM':directReportIds.length?'MANAGEMENT':'SELF';

  return {uid,role,position,identity,membership,departmentId,team,teamId,managerId,directReportIds,departmentHeadId,isDepartmentHead,isTeamLead,scope};
}

export function scopeLabel(scope){
  if(scope?.role==='ADMIN'||scope?.scope==='SYSTEM')return 'Toàn hệ thống';
  if(scope?.scope==='DEPARTMENT')return 'Trưởng phòng · Phạm vi phòng ban';
  if(scope?.scope==='TEAM')return 'Trưởng nhóm · Phạm vi Team';
  if(scope?.scope==='MANAGEMENT')return `Quản lý · ${scope.directReportIds.length} nhân sự trực tiếp`;
  return 'Thành viên · Phạm vi cá nhân';
}
