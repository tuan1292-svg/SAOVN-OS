import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const MEMBERSHIP_ID=uid=>`mem_${uid}_org_saovn_01`;
const norm=v=>String(v||'').trim().toUpperCase();

export async function loadOrgScope(uid){
  if(!uid)return {uid:null,role:'MEMBER',identity:null,membership:null,departmentId:'',team:'',managerId:'',directReportIds:[]};
  const [identitySnap,membershipSnap]=await Promise.all([
    getDoc(doc(db,'identities',uid)),
    getDoc(doc(db,'memberships',MEMBERSHIP_ID(uid)))
  ]);
  const identity=identitySnap.exists()?{id:identitySnap.id,...identitySnap.data()}:null;
  const membership=membershipSnap.exists()?{id:membershipSnap.id,...membershipSnap.data()}:null;
  const roles=[...(Array.isArray(membership?.roles?.system)?membership.roles.system:[]),...(Array.isArray(membership?.roles?.organization)?membership.roles.organization:[])].map(norm);
  const position=norm(identity?.position||membership?.position);
  const role=roles.some(r=>r.includes('ADMIN'))?'ADMIN':roles.some(r=>r.includes('MANAGER'))?'MANAGER':'MEMBER';
  const departmentId=membership?.departmentId||identity?.departmentId||'';
  const team=membership?.team||identity?.team||'';
  const managerId=membership?.managerId||identity?.managerId||'';
  let directReportIds=[];
  try{
    const snap=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
    directReportIds=snap.docs.filter(s=>String(s.data()?.managerId||'')===uid).map(s=>s.id);
  }catch(error){console.warn('Không tải được phạm vi quản lý trực tiếp:',error)}
  const isDepartmentHead=position==='DEPARTMENT_HEAD';
  const scope=isDepartmentHead?'DEPARTMENT':directReportIds.length?'TEAM':'SELF';
  return {uid,role,position,identity,membership,departmentId,team,managerId,directReportIds,isDepartmentHead,scope};
}

export function scopeLabel(scope){
  if(scope?.role==='ADMIN')return 'Toàn hệ thống';
  if(scope?.scope==='DEPARTMENT')return 'Trưởng phòng · Phạm vi phòng ban';
  if(scope?.directReportIds?.length)return `Quản lý · ${scope.directReportIds.length} nhân sự trực tiếp`;
  return 'Thành viên · Phạm vi cá nhân';
}
