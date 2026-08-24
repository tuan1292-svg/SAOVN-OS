import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from './firebase-config.js';

(() => {
  const byId = id => document.getElementById(id);
  const picker = byId('taskAssigneePicker');
  const options = byId('taskAssigneeOptions');
  if (!picker || !options) return;

  const style = document.createElement('style');
  style.textContent = `
    .assignee-option-card{position:relative!important;min-height:58px!important;padding:9px 10px!important;border-radius:11px!important;box-sizing:border-box}
    .assignee-option-card .assignee-option-copy{display:flex;flex-direction:column;min-width:0;flex:1}
    .assignee-option-card .assignee-option-meta{white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
    .assignee-option-card.is-selected{background:rgba(37,135,255,.075);box-shadow:inset 0 0 0 1px rgba(37,135,255,.18),0 4px 14px rgba(0,0,0,.08)}
    .assignee-option-card:has(input:focus-visible){outline:2px solid rgba(37,135,255,.42);outline-offset:1px}
    .assignee-option-card .assignee-option-check{position:relative;z-index:2;flex:0 0 auto}
    .assignee-scope-filters{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0 2px}
    .assignee-scope-filters select{width:100%;min-width:0;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.035);color:#91a2b9;padding:7px 8px;outline:0;font-size:8px}
    .assignee-scope-filters select:focus{border-color:rgba(37,135,255,.45);color:#d7e7fb}
    .assignee-filter-note{margin:4px 0 6px;color:#66778f;font-size:7px}
    .assignee-option-filtered{display:none!important}
    .assignee-option-avatar{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,rgba(37,135,255,.3),rgba(114,82,255,.24));color:#d9e9ff;font-size:9px;font-weight:700}
    @media(max-width:520px){.assignee-scope-filters{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
  const lower = value => clean(value).toLowerCase();
  const initials = text => clean(text).split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase() || '?';
  let directory = new Map();
  let hydrating = false;

  async function loadDirectoryMeta(){
    if(hydrating || directory.size) return;
    hydrating = true;
    try{
      const identitySnap = await getDocs(query(collection(db,'identities'),where('status','==','ACTIVE')));
      let membershipSnap = null;
      try{ membershipSnap = await getDocs(query(collection(db,'memberships'),where('status','==','ACTIVE'))); }catch(e){ console.warn('Assignee metadata: memberships unavailable',e); }
      const memberships = new Map();
      membershipSnap?.forEach(s => {
        const d=s.data();
        const uid=d.identityId||d.userId||d.uid||s.id.match(/^mem_(.+)_org_/)?.[1];
        if(uid) memberships.set(uid,d);
      });
      identitySnap.forEach(s => {
        const x=s.data(), m=memberships.get(s.id)||{};
        directory.set(s.id,{
          id:s.id,
          name:x.fullName||x.displayName||x.name||x.email||s.id,
          departmentId:m.departmentId||x.departmentId||'',
          department:m.department||x.department||'',
          teamId:m.teamId||x.teamId||'',
          team:m.team||x.team||''
        });
      });
    }catch(e){ console.warn('Assignee metadata load skipped',e); }
    finally{ hydrating=false; enhance(); }
  }

  function enhance(){
    options.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const row=input.closest('label,[role="option"],.assignee-option-card')||input.parentElement;
      if(!row)return;
      const member=directory.get(input.value);
      const strong=row.querySelector('strong,.assignee-option-name');
      const small=row.querySelector('small,.assignee-option-meta');
      const name=clean(member?.name||input.dataset.name||strong?.textContent||input.value);
      if(name)input.dataset.name=name;
      if(member){
        input.dataset.departmentId=member.departmentId||'';
        input.dataset.teamId=member.teamId||'';
        input.dataset.departmentName=member.department||'';
        input.dataset.teamName=member.team||'';
        input.dataset.assigneeMeta=[member.department,member.team].filter(Boolean).join(' · ');
      }
      const meta=clean(input.dataset.assigneeMeta||small?.textContent||'Thành viên trong phạm vi được cấp quyền');
      row.classList.add('assignee-option-card');
      if(strong)strong.classList.add('assignee-option-name');
      if(small){small.classList.add('assignee-option-meta');small.textContent=meta;}
      let avatar=row.querySelector('.assignee-option-avatar');
      if(!avatar){avatar=document.createElement('span');avatar.className='assignee-option-avatar';row.insertBefore(avatar,row.querySelector('.assignee-option-copy')||input.nextSibling);}
      avatar.textContent=initials(name);
      row.classList.toggle('is-selected',input.checked);
      if(!input.dataset.assigneeSyncBound){
        input.dataset.assigneeSyncBound='1';
        input.addEventListener('change',()=>{row.classList.toggle('is-selected',input.checked);});
      }
    });
    ensureFilters();
    applyFilters();
  }

  function members(){return [...options.querySelectorAll('input[type="checkbox"]')];}
  function values(kind){
    const set=new Map();
    members().forEach(input=>{
      const m=directory.get(input.value);
      const id=kind==='department'?input.dataset.departmentId:input.dataset.teamId;
      const name=kind==='department'?input.dataset.departmentName:input.dataset.teamName;
      if(id||name)set.set(id||lower(name),name||id);
    });
    return [...set.values()].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
  }

  function ensureFilters(){
    let box=byId('assigneeScopeFilters');
    if(!box){
      const head=picker.querySelector('.assignee-menu-head');
      if(!head)return;
      box=document.createElement('div');box.id='assigneeScopeFilters';box.className='assignee-scope-filters';
      box.innerHTML='<select id="assigneeDepartmentFilter" aria-label="Lọc theo phòng ban"><option value="ALL">Tất cả phòng ban</option></select><select id="assigneeTeamFilter" aria-label="Lọc theo Team"><option value="ALL">Tất cả Team</option></select>';
      const note=document.createElement('div');note.id='assigneeFilterNote';note.className='assignee-filter-note';note.textContent='Bộ lọc chỉ thu hẹp danh sách hiển thị, không bỏ người đã chọn.';
      head.append(box,note);
      byId('assigneeDepartmentFilter').addEventListener('change',()=>{fillTeam();applyFilters();});
      byId('assigneeTeamFilter').addEventListener('change',applyFilters);
    }
    fillDepartment();fillTeam();
  }

  function fillDepartment(){const select=byId('assigneeDepartmentFilter');if(!select)return;const current=select.value||'ALL';const vals=values('department');select.replaceChildren(new Option('Tất cả phòng ban','ALL'));vals.forEach(v=>select.appendChild(new Option(v,v)));select.value=vals.includes(current)?current:'ALL';}
  function fillTeam(){const select=byId('assigneeTeamFilter');if(!select)return;const dep=byId('assigneeDepartmentFilter')?.value||'ALL';const set=new Map();members().forEach(input=>{const d=input.dataset.departmentName||'';const tid=input.dataset.teamId||'';const tn=input.dataset.teamName||'';if((dep==='ALL'||d===dep)&&(tid||tn))set.set(tid||lower(tn),tn||tid);});const current=select.value||'ALL';select.replaceChildren(new Option('Tất cả Team','ALL'));[...set.values()].sort((a,b)=>a.localeCompare(b,'vi')).forEach(v=>select.appendChild(new Option(v,v)));select.value=[...set.values()].includes(current)?current:'ALL';}

  function applyFilters(){
    const dep=byId('assigneeDepartmentFilter')?.value||'ALL';
    const team=byId('assigneeTeamFilter')?.value||'ALL';
    members().forEach(input=>{
      const row=input.closest('label,[role="option"],.assignee-option-card')||input.parentElement;
      const d=input.dataset.departmentName||'';
      const t=input.dataset.teamName||'';
      row?.classList.toggle('assignee-option-filtered',!(dep==='ALL'||d===dep) || !(team==='ALL'||t===team));
    });
  }

  const observer=new MutationObserver(()=>{enhance();loadDirectoryMeta();});
  observer.observe(options,{childList:true,subtree:true});
  enhance();
  loadDirectoryMeta();
})();