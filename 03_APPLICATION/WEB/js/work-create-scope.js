import { getWorkScope } from './work-scope.js';

(() => {
  const $ = id => document.getElementById(id);
  const picker = $('taskAssigneePicker');
  const options = $('taskAssigneeOptions');
  if (!picker || !options) return;

  const style = document.createElement('style');
  style.textContent = `
    .task-assignee-scope{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0 4px}.task-assignee-scope label{display:block;margin:0!important}.task-assignee-scope select{width:100%;min-width:0}.task-assignee-scope-note{margin:4px 0 7px;color:#687991;font-size:7px;line-height:1.4}.assignee-option-card.scope-hidden{display:none!important}@media(max-width:720px){.task-assignee-scope{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const clean = v => String(v ?? '').trim();
  const lower = v => clean(v).toLowerCase();
  const ids = v => Array.isArray(v) ? v.map(clean).filter(Boolean) : clean(v) ? [clean(v)] : [];
  const metaFromRow = row => {
    const text = String(row?.textContent || '').replace(/\s+/g, ' ').trim();
    const parts = text.split('·').map(clean).filter(Boolean);
    return { department: lower(row?.dataset?.department || parts.at(-2) || ''), team: lower(row?.dataset?.team || parts.at(-1) || '') };
  };

  function ensureScopeControls(){
    if ($('taskAssigneeScope')) return;
    const wrap = document.createElement('div');
    wrap.id = 'taskAssigneeScope';
    wrap.className = 'task-assignee-scope';
    wrap.innerHTML = `<label>Phòng ban<select id="taskAssigneeDepartment"><option value="ALL">Tất cả phòng ban</option></select></label><label>Team<select id="taskAssigneeTeam"><option value="ALL">Tất cả Team</option></select></label>`;
    const head = picker.querySelector('.assignee-menu-head');
    head?.appendChild(wrap);
    const note = document.createElement('div');
    note.id='taskAssigneeScopeNote'; note.className='task-assignee-scope-note';
    note.textContent='Bộ lọc chỉ thu hẹp danh sách hiển thị; người đã chọn vẫn được giữ nguyên.';
    head?.appendChild(note);
    $('taskAssigneeDepartment')?.addEventListener('change', () => { rebuildTeams(); filter(); });
    $('taskAssigneeTeam')?.addEventListener('change', filter);
  }

  function rows(){ return [...options.querySelectorAll('input[type="checkbox"]')].map(input => ({ input, row: input.closest('label,[role="option"],.assignee-option-card') || input.parentElement })).filter(x => x.row); }

  function rebuildTeams(){
    const dep = lower($('taskAssigneeDepartment')?.value || 'ALL');
    const select = $('taskAssigneeTeam'); if(!select) return;
    const current = select.value;
    const teams = new Map();
    rows().forEach(({row}) => { const m=metaFromRow(row); if((dep==='all'||!dep||m.department===dep) && m.team) teams.set(m.team, m.team); });
    select.replaceChildren(new Option('Tất cả Team','ALL'));
    [...teams.values()].sort((a,b)=>a.localeCompare(b,'vi')).forEach(v=>select.appendChild(new Option(v.replace(/\b\w/g,c=>c.toUpperCase()),v)));
    if([...select.options].some(o=>o.value===current)) select.value=current;
  }

  function rebuildDepartments(){
    const select=$('taskAssigneeDepartment'); if(!select) return;
    const current=select.value, deps=new Map();
    rows().forEach(({row})=>{const m=metaFromRow(row);if(m.department)deps.set(m.department,m.department);});
    select.replaceChildren(new Option('Tất cả phòng ban','ALL'));
    [...deps.values()].sort((a,b)=>a.localeCompare(b,'vi')).forEach(v=>select.appendChild(new Option(v.replace(/\b\w/g,c=>c.toUpperCase()),v)));
    if([...select.options].some(o=>o.value===current))select.value=current;
  }

  function filter(){
    const dep=lower($('taskAssigneeDepartment')?.value||'ALL'), team=lower($('taskAssigneeTeam')?.value||'ALL');
    rows().forEach(({input,row})=>{const m=metaFromRow(row);const ok=(dep==='all'||!dep||m.department===dep)&&(team==='all'||!team||m.team===team);row.classList.toggle('scope-hidden',!ok);});
  }

  async function applyUserScope(){
    try{
      const scope=await getWorkScope();
      const dep=$('taskAssigneeDepartment'), team=$('taskAssigneeTeam');
      if(scope?.type?.startsWith('DEPARTMENT') && scope.department){
        const wanted=lower(scope.department);
        if([...dep.options].some(o=>lower(o.value)===wanted))dep.value=wanted;
        rebuildTeams();
        if(scope.team){const wantedTeam=lower(scope.team);if([...team.options].some(o=>lower(o.value)===wantedTeam))team.value=wantedTeam;}
        filter();
      }else if(scope?.type==='TEAM' && scope.team){
        const wanted=lower(scope.team); if([...team.options].some(o=>lower(o.value)===wanted))team.value=wanted;
        filter();
      }
    }catch(e){console.warn('Assignee scope filter skipped:',e);}
  }

  function refresh(){ ensureScopeControls(); rebuildDepartments(); rebuildTeams(); filter(); applyUserScope(); }
  new MutationObserver(refresh).observe(options,{childList:true,subtree:true});
  refresh();
})();
