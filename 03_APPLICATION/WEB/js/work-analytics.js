import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { collection, getDocs, query, where, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const root=document.getElementById('memberAnalytics');
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const roleObject=(value={})=>Array.isArray(value)?Object.fromEntries(value.map(v=>[String(v),true])):value||{};
const hasRole=(roles,names)=>names.some(name=>roles?.[name]===true);
const uidOf=(id,d={})=>d.identityId||d.userId||d.uid||String(id||'').match(/^mem_(.+)_org_/)?.[1]||null;

async function loadDirectory(fallbackUser,fallbackIdentity){
  const map=new Map();
  try{
    const ids=await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
    ids.docs.forEach(s=>map.set(s.id,{id:s.id,...s.data()}));
  }catch(error){if(error?.code!=='permission-denied')console.warn('Work analytics identities skipped:',error?.code||error);}
  try{
    const ms=await getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE')));
    ms.docs.forEach(s=>{
      const d=s.data()||{},uid=uidOf(s.id,d);if(!uid)return;
      const old=map.get(uid)||{id:uid};
      map.set(uid,{...old,...d,id:uid,fullName:old.fullName||old.displayName||old.name||d.fullName||d.displayName||d.name,email:old.email||d.email});
    });
  }catch(error){if(error?.code!=='permission-denied')console.warn('Work analytics memberships skipped:',error?.code||error);}
  if(!map.has(fallbackUser.uid))map.set(fallbackUser.uid,{id:fallbackUser.uid,...fallbackIdentity});
  return [...map.values()];
}

onAuthStateChanged(auth,async user=>{
  if(!user||!root)return;
  try{
    const identitySnap=await getDoc(doc(db,'identities',user.uid));
    const identity=identitySnap.exists()?identitySnap.data():{};
    const membershipSnap=await getDoc(doc(db,'memberships',`mem_${user.uid}_org_saovn_01`));
    const membership=membershipSnap.exists()?membershipSnap.data():{};
    const systemRoles=roleObject(membership.roles?.system);
    const orgRoles=roleObject(membership.roles?.organization);
    const isAdmin=hasRole(systemRoles,['system_admin','admin','ADMIN','SYSTEM_ADMIN'])||hasRole(orgRoles,['org_admin','organization_admin','admin','ADMIN','ORG_ADMIN','ORGANIZATION_ADMIN']);
    const isManager=hasRole(orgRoles,['manager','org_manager','MANAGER','ORG_MANAGER'])||['MANAGER','DIRECTOR'].includes(String(identity.position||'').toUpperCase());
    const isTeamLead=hasRole(orgRoles,['team_lead','team_leader','TEAM_LEAD','TEAM_LEADER'])||['TEAM_LEAD','TEAM_LEADER'].includes(String(identity.position||'').toUpperCase());
    const deptId=membership.departmentId||identity.departmentId||'';
    const dept=membership.department||identity.department||'';
    const teamId=membership.teamId||identity.teamId||'';
    const team=membership.team||identity.team||'';
    const taskMap=new Map();
    const add=s=>s.docs.forEach(d=>taskMap.set(d.id,{id:d.id,...d.data()}));
    if(isAdmin){add(await getDocs(collection(db,'workTasks')));}
    else if(isTeamLead&&teamId){add(await getDocs(query(collection(db,'workTasks'),where('teamId','==',teamId))));}
    else if(isTeamLead&&team){add(await getDocs(query(collection(db,'workTasks'),where('team','==',team))));}
    else if(isManager&&deptId){add(await getDocs(query(collection(db,'workTasks'),where('departmentId','==',deptId))));}
    else if(isManager&&dept){add(await getDocs(query(collection(db,'workTasks'),where('department','==',dept))));}
    else{
      const [a,b]=await Promise.allSettled([getDocs(query(collection(db,'workTasks'),where('assigneeIds','array-contains',user.uid))),getDocs(query(collection(db,'workTasks'),where('createdBy','==',user.uid)))]);
      if(a.status==='fulfilled')add(a.value);if(b.status==='fulfilled')add(b.value);
    }
    const tasks=[...taskMap.values()];
    let members=await loadDirectory(user,identity);
    if(!isAdmin&&isTeamLead&&teamId)members=members.filter(m=>String(m.teamId||'')===String(teamId));
    else if(!isAdmin&&isTeamLead&&team)members=members.filter(m=>String(m.team||'').trim().toLowerCase()===String(team).trim().toLowerCase());
    else if(!isAdmin&&isManager&&deptId)members=members.filter(m=>String(m.departmentId||'')===String(deptId));
    else if(!isAdmin&&isManager&&dept)members=members.filter(m=>String(m.department||'').trim().toLowerCase()===String(dept).trim().toLowerCase());
    else members=members.filter(m=>m.id===user.uid);
    if(!members.some(m=>m.id===user.uid))members.push({id:user.uid,...identity});
    const rows=members.map(member=>{
      const assigned=tasks.filter(t=>Array.isArray(t.assigneeIds)?t.assigneeIds.includes(member.id):t.assigneeId===member.id);
      const done=assigned.filter(t=>t.status==='DONE');
      const today=new Date().toISOString().slice(0,10);
      const overdue=assigned.filter(t=>t.dueDate&&t.dueDate<today&&t.status!=='DONE');
      const onTime=done.filter(t=>!t.dueDate||taskTime(t)<=new Date(`${t.dueDate}T23:59:59`).getTime()).length;
      const percent=assigned.length?Math.round(done.length/assigned.length*100):0;
      return {member,total:assigned.length,done:done.length,overdue,onTime,percent};
    }).filter(r=>r.total>0||r.member.id===user.uid).sort((a,b)=>b.percent-a.percent||b.total-a.total);
    render(rows,isAdmin||isTeamLead||(isManager&&Boolean(deptId||dept)));
  }catch(error){if(error?.code!=='permission-denied')console.warn('Work analytics skipped:',error?.code||error);root.innerHTML='';}
});
function taskTime(task){const value=task.completedAt||task.updatedAt||task.createdAt;if(typeof value?.toMillis==='function')return value.toMillis();if(typeof value?.toDate==='function')return value.toDate().getTime();return new Date(value||0).getTime();}
function render(rows,grouped){root.innerHTML=`<div class="analytics-head"><div><span class="eyebrow">WORK / ANALYTICS</span><h2>Hiệu suất công việc</h2><p>Tỷ lệ được tính từ công việc đã giao và trạng thái DONE trong phạm vi bạn có quyền xem.</p></div><span class="analytics-scope">${grouped?'Theo phạm vi':'Cá nhân'}</span></div>${rows.length?`<div class="analytics-list">${rows.map(r=>{const name=r.member.fullName||r.member.displayName||r.member.name||'Thành viên';return `<article class="analytics-member"><a class="analytics-person" href="#" data-member-profile="${esc(r.member.id)}"><span>${esc(name)}</span></a><div class="analytics-bar"><i style="width:${Math.max(0,Math.min(100,r.percent))}%"></i></div><strong>${r.percent}%</strong><span>${r.done}/${r.total} hoàn thành · ${r.overdue} quá hạn · ${r.onTime} đúng hạn</span></article>`}).join('')}</div>`:'<div class="analytics-empty">Chưa có dữ liệu công việc để thống kê.</div>'}`;}
