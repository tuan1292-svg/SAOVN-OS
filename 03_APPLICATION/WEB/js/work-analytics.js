import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, query, where, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const root=document.getElementById('memberAnalytics');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const positionLabels={FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO',DIRECTOR:'Giám đốc',DEPARTMENT_HEAD:'Trưởng phòng',MANAGER:'Quản lý',TEAM_LEAD:'Trưởng nhóm',SENIOR_SPECIALIST:'Chuyên viên cao cấp',SPECIALIST:'Chuyên viên',STAFF:'Nhân viên',COLLABORATOR:'Cộng tác viên',INTERN:'Thực tập sinh',OTHER:'Khác'};
const normalizeRole=value=>String(value||'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const roleList=value=>Array.isArray(value)?value.map(normalizeRole):value&&typeof value==='object'?Object.entries(value).filter(([,v])=>v===true).map(([k])=>normalizeRole(k)):[];
const hasRole=(roles,names)=>{const available=roleList(roles);return names.map(normalizeRole).some(name=>available.includes(name));};

async function run(user){
  if(!user||!root)return;
  try{
    const [identitySnap,membershipSnap]=await Promise.all([getDoc(doc(db,'identities',user.uid)),getDoc(doc(db,'memberships',`mem_${user.uid}_org_saovn_01`))]);
    const identity=identitySnap.exists()?identitySnap.data():{};
    const membership=membershipSnap.exists()?membershipSnap.data():{};
    const systemRoles=membership.roles?.system||[];
    const orgRoles=membership.roles?.organization||[];
    const isAdmin=hasRole(systemRoles,['system_admin','admin','ADMIN','SYSTEM_ADMIN'])||hasRole(orgRoles,['org_admin','organization_admin','admin','ADMIN','ORG_ADMIN','ORGANIZATION_ADMIN']);
    const isManager=hasRole(systemRoles,['manager','MANAGER','org_manager','ORG_MANAGER'])||hasRole(orgRoles,['manager','MANAGER','org_manager','ORG_MANAGER']);
    const isTeamLead=hasRole(orgRoles,['team_lead','team_leader','TEAM_LEAD','TEAM_LEADER']);
    const deptId=membership.departmentId||identity.departmentId||'';
    const dept=membership.department||identity.department||'';
    const teamId=membership.teamId||identity.teamId||'';
    const team=membership.team||identity.team||'';
    const taskMap=new Map();
    const add=s=>s.docs.forEach(d=>taskMap.set(d.id,{id:d.id,...d.data()}));
    if(isAdmin){
      try{add(await getDocs(collection(db,'workTasks')))}catch(error){console.warn('Analytics admin task query blocked:',error?.code||error)}
    }else if((isTeamLead||isManager)&&teamId){
      try{add(await getDocs(query(collection(db,'workTasks'),where('teamId','==',teamId))))}catch(error){console.warn('Analytics team query blocked:',error?.code||error)}
    }else if((isTeamLead||isManager)&&team){
      try{add(await getDocs(query(collection(db,'workTasks'),where('team','==',team))))}catch(error){console.warn('Analytics team query blocked:',error?.code||error)}
    }else if(deptId){
      try{add(await getDocs(query(collection(db,'workTasks'),where('departmentId','==',deptId))))}catch(error){console.warn('Analytics department query blocked:',error?.code||error)}
    }else if(dept){
      try{add(await getDocs(query(collection(db,'workTasks'),where('department','==',dept))))}catch(error){console.warn('Analytics department query blocked:',error?.code||error)}
    }
    if(!taskMap.size){
      const [a,b,c]=await Promise.allSettled([
        getDocs(query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid))),
        getDocs(query(collection(db,'workTasks'),where('assigneeId','==',user.uid))),
        getDocs(query(collection(db,'workTasks'),where('createdBy','==',user.uid)))
      ]);
      for(const result of [a,b,c])if(result.status==='fulfilled')add(result.value);
    }
    const tasks=[...taskMap.values()];
    let members=[];
    try{
      const ids=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
      members=ids.docs.map(s=>({id:s.id,...s.data()}));
    }catch(error){members=[{id:user.uid,...identity}];}
    if(!isAdmin && (isTeamLead||isManager) && teamId) members=members.filter(m=>String(m.teamId||'')===String(teamId));
    else if(!isAdmin && (isTeamLead||isManager) && team) members=members.filter(m=>String(m.team||'').trim().toLowerCase()===String(team).trim().toLowerCase());
    else if(!isAdmin && deptId) members=members.filter(m=>String(m.departmentId||'')===String(deptId));
    else if(!isAdmin && dept) members=members.filter(m=>String(m.department||'').trim().toLowerCase()===String(dept).trim().toLowerCase());
    if(!members.some(m=>m.id===user.uid))members.push({id:user.uid,...identity});
    const rows=members.map(member=>{
      const assigned=tasks.filter(t=>Array.isArray(t.assigneeIds)?t.assigneeIds.includes(member.id):t.assigneeId===member.id);
      const done=assigned.filter(t=>String(t.status||'').toUpperCase()==='DONE');
      const today=new Date().toISOString().slice(0,10);
      const overdue=assigned.filter(t=>t.dueDate&&String(t.dueDate).slice(0,10)<today&&String(t.status||'').toUpperCase()!=='DONE');
      const onTime=done.filter(t=>!t.dueDate||taskTime(t)<=new Date(`${String(t.dueDate).slice(0,10)}T23:59:59`).getTime()).length;
      const percent=assigned.length?Math.round(done.length/assigned.length*100):0;
      return {member,total:assigned.length,done:done.length,overdue,onTime,percent};
    }).filter(r=>r.total>0||r.member.id===user.uid).sort((a,b)=>b.percent-a.percent||b.total-a.total);
    render(rows,isAdmin||isManager||isTeamLead||deptId||dept||teamId||team);
  }catch(error){console.warn('Work analytics skipped:',error?.code||error);root.innerHTML='';}
}

onAuthStateChanged(auth,run);
function taskTime(task){const value=task.completedAt||task.updatedAt||task.createdAt;if(typeof value?.toMillis==='function')return value.toMillis();if(typeof value?.toDate==='function')return value.toDate().getTime();return new Date(value||0).getTime();}
function render(rows,grouped){root.innerHTML=`<div class="analytics-head"><div><span class="eyebrow">WORK / ANALYTICS</span><h2>Hiệu suất công việc</h2><p>Tỷ lệ được tính từ công việc đã giao và trạng thái DONE trong phạm vi bạn có quyền xem.</p></div><span class="analytics-scope">${grouped?'Theo phạm vi':'Cá nhân'}</span></div>${rows.length?`<div class="analytics-list">${rows.map(r=>{const name=r.member.fullName||r.member.displayName||r.member.name||'Thành viên';const pos=positionLabels[r.member.position]||r.member.position||'Nhân viên';return `<article class="analytics-member"><div class="analytics-person"><a href="member-profile.html?id=${encodeURIComponent(r.member.id)}">${esc(name)}</a><small>${esc(pos)}</small></div><div class="analytics-bar"><i style="width:${Math.max(0,Math.min(100,r.percent))}%"></i></div><strong>${r.percent}%</strong><span>${r.done}/${r.total} hoàn thành · ${r.overdue} quá hạn · ${r.onTime} đúng hạn</span></article>`}).join('')}</div>`:'<div class="analytics-empty">Chưa có dữ liệu công việc để thống kê.</div>'}`;}
