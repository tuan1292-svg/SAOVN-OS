import { getWorkScope } from './work-scope.js';
import './work-assignee-polish.js';

(() => {
  const $ = id => document.getElementById(id);
  const modal = $('taskModal');
  const form = $('taskForm');
  if (!modal || !form) return;

  const title = $('taskTitle');
  const description = $('taskDescription');
  const due = $('taskDueDate');
  const options = $('taskAssigneeOptions');
  const picker = $('taskAssigneePicker');
  const save = $('saveTaskBtn');

  const styles = document.createElement('style');
  styles.textContent = `
    .task-create-context{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 15px;padding:11px 13px;border:1px solid rgba(69,151,255,.18);border-radius:11px;background:linear-gradient(135deg,rgba(37,135,255,.09),rgba(255,255,255,.025))}.task-create-context strong{display:block;color:#dce8fb;font-size:10px}.task-create-context span{display:block;color:#71829a;font-size:8px;margin-top:3px}.task-create-context b{padding:5px 8px;border-radius:7px;color:#8ec4ff;background:#2587ff18;font-size:8px;white-space:nowrap}.task-quick-deadlines{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.task-quick-deadlines button,.task-assignee-tools button{border:1px solid var(--line);border-radius:7px;background:#ffffff05;color:#8293aa;padding:5px 7px;font-size:7px;cursor:pointer}.task-quick-deadlines button:hover,.task-assignee-tools button:hover{border-color:#2587ff66;color:#c3ddff}.task-assignee-tools{display:flex;gap:5px;margin:7px 0 2px}.task-create-status{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:5px 0 14px}.task-create-status span{padding:7px 8px;border:1px solid #fff1;border-radius:8px;background:#ffffff03;color:#687991;font-size:7px}.task-create-status span.ok{color:#00e676;background:#00e67608;border-color:#00e67624}.task-create-status b{display:block;color:inherit;font-size:8px;margin-bottom:2px}.task-create-status small{font-size:7px}.task-save-hint{margin-right:auto;align-self:center;color:#65758d;font-size:7px}.task-save-hint.ok{color:#70b98f}.task-counter{display:flex;justify-content:flex-end;color:#66758c;font-size:7px;margin-top:4px}.task-counter.warn{color:#ff9f1c}
    .assignee-picker{position:relative}.assignee-toggle{width:100%;min-height:44px;display:flex;align-items:center;gap:8px;text-align:left}.assignee-toggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.assignee-toggle b{margin-left:auto;white-space:nowrap}.assignee-menu{z-index:80}.assignee-menu-head{position:sticky;top:0;z-index:3;background:rgba(15,22,34,.97);backdrop-filter:blur(12px)}.assignee-search{display:flex;align-items:center;gap:7px;margin:8px 0;padding:8px 10px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.035)}.assignee-search span{opacity:.55}.assignee-search input{width:100%;border:0!important;background:transparent!important;outline:0;color:#dce8f8;font-size:11px;padding:0!important}.assignee-search input::placeholder{color:#64758d}.assignee-selected{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0 3px}.assignee-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:5px 7px;border:1px solid rgba(37,135,255,.24);border-radius:999px;background:rgba(37,135,255,.08);color:#c9def8;font-size:8px}.assignee-chip .assignee-chip-avatar{width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:rgba(37,135,255,.18);color:#9bcaff;font-size:7px;font-weight:700}.assignee-chip button{border:0;background:transparent;color:#7890aa;cursor:pointer;padding:0 2px}.assignee-chip button:hover{color:#fff}.assignee-empty{padding:14px 8px;text-align:center;color:#687991;font-size:9px}.assignee-option-hidden{display:none!important}.assignee-option-card{display:flex!important;align-items:center;gap:9px;width:100%;padding:8px;border:1px solid transparent;border-radius:9px;cursor:pointer;transition:.15s ease}.assignee-option-card:hover{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.07)}.assignee-option-card.is-selected{background:rgba(37,135,255,.075);border-color:rgba(37,135,255,.18)}.assignee-option-avatar{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,rgba(37,135,255,.3),rgba(114,82,255,.24));color:#d9e9ff;font-size:9px;font-weight:700}.assignee-option-copy{min-width:0;flex:1}.assignee-option-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d8e5f5;font-size:10px;font-weight:600}.assignee-option-meta{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;color:#6f8098;font-size:8px}.assignee-option-check{width:17px;height:17px;accent-color:#2587ff}.task-assignee-tools .count{margin-left:auto;align-self:center;color:#64758d;font-size:7px}
    @media(max-width:720px){.task-create-status{grid-template-columns:1fr}.task-create-context{align-items:flex-start}.task-save-hint{display:none}.assignee-menu{max-height:65vh}}
  `;
  document.head.appendChild(styles);

  function scopeInfo(){
    try { const s=getWorkScope?.(); return s?.type==='ORGANIZATION' ? ['Toàn tổ chức','Công việc theo phạm vi quản trị'] : [s?.label||'Phạm vi hiện tại','Công việc sẽ được đồng bộ theo phạm vi được cấp quyền']; }
    catch { return ['Phạm vi hiện tại','Công việc sẽ được đồng bộ theo quyền của tài khoản']; }
  }

  const initials = text => String(text || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase() || '?';

  function optionText(input){
    const row = input?.closest('label,[role="option"],.assignee-option-card') || input?.parentElement;
    return String(row?.textContent || input?.dataset?.name || input?.value || 'Thành viên').replace(/\s+/g,' ').trim();
  }

  function decorateOptions(){
    if (!options) return;
    [...options.querySelectorAll('input[type="checkbox"]')].forEach(input => {
      const row = input.closest('label,[role="option"]') || input.parentElement;
      if (!row || row.dataset.assigneeEnhanced === '1') return;
      row.dataset.assigneeEnhanced = '1';
      row.classList.add('assignee-option-card');
      const raw = optionText(input);
      const name = input.dataset.name || input.getAttribute('aria-label') || raw;
      const meta = input.dataset.team || input.dataset.department || '';
      const avatar = document.createElement('span'); avatar.className='assignee-option-avatar'; avatar.textContent=initials(name);
      const copy = document.createElement('span'); copy.className='assignee-option-copy';
      const nameEl=document.createElement('span'); nameEl.className='assignee-option-name'; nameEl.textContent=name;
      const metaEl=document.createElement('span'); metaEl.className='assignee-option-meta'; metaEl.textContent=meta || 'Thành viên trong phạm vi được cấp quyền';
      copy.append(nameEl,metaEl);
      input.classList.add('assignee-option-check');
      row.replaceChildren(input,avatar,copy);
      input.addEventListener('change', refresh);
    });
  }

  function setupPicker(){
    if (!picker || !options) return;
    if (!$('taskAssigneeSearch')) {
      const search=document.createElement('div'); search.id='taskAssigneeSearch'; search.className='assignee-search';
      search.innerHTML='<span>⌕</span><input id="taskAssigneeSearchInput" type="search" autocomplete="off" placeholder="Tìm theo tên thành viên...">';
      const head=picker.querySelector('.assignee-menu-head'); head?.appendChild(search);
      search.querySelector('input').addEventListener('input', filterOptions);
    }
    if (!$('taskAssigneeSelected')) {
      const selected=document.createElement('div'); selected.id='taskAssigneeSelected'; selected.className='assignee-selected';
      picker.querySelector('.assignee-menu-head')?.appendChild(selected);
    }
    decorateOptions();
    renderSelected();
  }

  function filterOptions(){
    const q=String($('taskAssigneeSearchInput')?.value||'').trim().toLowerCase();
    let visible=0;
    [...options.querySelectorAll('input[type="checkbox"]')].forEach(input=>{
      const row=input.closest('label,[role="option"],.assignee-option-card')||input.parentElement;
      const text=String(row?.textContent||'').toLowerCase();
      const match=!q||text.includes(q);
      row?.classList.toggle('assignee-option-hidden',!match);
      if(match) visible++;
    });
    let empty=$('assigneeSearchEmpty');
    if(!visible){if(!empty){empty=document.createElement('div');empty.id='assigneeSearchEmpty';empty.className='assignee-empty';empty.textContent='Không tìm thấy thành viên phù hợp';options.appendChild(empty);}}
    else empty?.remove();
  }

  function renderSelected(){
    const box=$('taskAssigneeSelected'); if(!box||!options) return;
    box.replaceChildren();
    const checked=[...options.querySelectorAll('input[type="checkbox"]:checked')];
    checked.slice(0,6).forEach(input=>{
      const chip=document.createElement('span');chip.className='assignee-chip';
      const name=input.dataset.name||optionText(input);const av=document.createElement('span');av.className='assignee-chip-avatar';av.textContent=initials(name);
      const text=document.createElement('span');text.textContent=name;
      const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label',`Bỏ ${name}`);remove.textContent='×';remove.onclick=()=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));};
      chip.append(av,text,remove);box.appendChild(chip);
    });
    if(checked.length>6){const more=document.createElement('span');more.className='assignee-chip';more.textContent=`+${checked.length-6} người khác`;box.appendChild(more);}
  }

  function setup(){
    if (!$('taskCreateContext')) { const [label,detail]=scopeInfo(); const box=document.createElement('div'); box.id='taskCreateContext'; box.className='task-create-context'; box.innerHTML=`<div><strong>Phạm vi công việc</strong><span>${detail}</span></div><b>${label}</b>`; form.insertBefore(box, form.firstElementChild?.nextElementSibling||form.firstElementChild); }
    if (title && !$('taskTitleCounter')) { const c=document.createElement('div');c.id='taskTitleCounter';c.className='task-counter';title.parentElement.appendChild(c);const update=()=>{c.textContent=`${title.value.length} / 120`;c.classList.toggle('warn',title.value.length>108)};title.addEventListener('input',update);update(); }
    if (description && !$('taskDescriptionCounter')) { const c=document.createElement('div');c.id='taskDescriptionCounter';c.className='task-counter';const update=()=>c.textContent=`${description.value.length} ký tự`;description.parentElement.appendChild(c);description.addEventListener('input',update);update(); }
    if (due && !$('taskQuickDeadlines')) { const wrap=document.createElement('div');wrap.id='taskQuickDeadlines';wrap.className='task-quick-deadlines';wrap.innerHTML='<button type="button" data-days="0">Hôm nay</button><button type="button" data-days="1">Ngày mai</button><button type="button" data-days="3">+3 ngày</button><button type="button" data-days="7">+7 ngày</button><button type="button" data-days="14">+14 ngày</button><button type="button" data-clear="1">Bỏ deadline</button>';due.parentElement.appendChild(wrap);wrap.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.clear)due.value='';else{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+Number(b.dataset.days));due.value=d.toISOString().slice(0,10)}due.dispatchEvent(new Event('input',{bubbles:true}));refresh();};}
    if (picker && !$('taskAssigneeTools')) { const tools=document.createElement('div');tools.id='taskAssigneeTools';tools.className='task-assignee-tools';tools.innerHTML='<button type="button" data-action="all">Chọn tất cả</button><button type="button" data-action="clear">Bỏ chọn</button><span class="count" id="taskAssigneeToolCount"></span>';picker.parentElement.appendChild(tools);tools.onclick=e=>{const b=e.target.closest('button');if(!b)return;[...options.querySelectorAll('input[type=checkbox]')].forEach(i=>{i.checked=b.dataset.action==='all';i.dispatchEvent(new Event('change',{bubbles:true}))});refresh();};}
    if (!$('taskCreateStatus')) { const box=document.createElement('div');box.id='taskCreateStatus';box.className='task-create-status';box.innerHTML='<span data-state="title"><b>① Tên công việc</b><small>Bắt buộc</small></span><span data-state="assignee"><b>② Người phụ trách</b><small>Có thể giao sau</small></span><span data-state="deadline"><b>③ Deadline</b><small>Không bắt buộc</small></span>';form.querySelector('.modal-actions')?.before(box);}
    if (!$('taskSaveHint')) { const n=document.createElement('span');n.id='taskSaveHint';n.className='task-save-hint';$('cancelModal')?.before(n);}
    setupPicker();
    refresh();
  }

  function refresh(){
    setupPicker();
    const titleOk=!!title?.value.trim(),assigneeOk=!!options?.querySelector('input:checked'),dueOk=!!due?.value;
    [['title',titleOk],['assignee',assigneeOk],['deadline',dueOk]].forEach(([key,ok])=>$("taskCreateStatus")?.querySelector(`[data-state="${key}"]`)?.classList.toggle('ok',ok));
    if(save){save.disabled=!titleOk;save.title=titleOk?'Sẵn sàng lưu':'Nhập tên công việc trước khi lưu';}
    const hint=$('taskSaveHint');if(hint){hint.textContent=titleOk?'Sẵn sàng lưu công việc':'Cần nhập tên công việc';hint.classList.toggle('ok',titleOk);}
    const count=options?.querySelectorAll('input[type="checkbox"]:checked').length||0;
    if($('assigneeCount')) $('assigneeCount').textContent=count?`${count} người`:'Chưa giao';
    if($('taskAssigneeToolCount')) $('taskAssigneeToolCount').textContent=count?`${count} đã chọn`:'';
    renderSelected();
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))$('closeModal')?.click();});
  [title,description,due].filter(Boolean).forEach(el=>el.addEventListener('input',refresh));
  options?.addEventListener('change',refresh);
  new MutationObserver(()=>{if(modal.classList.contains('open'))setup();}).observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  setup();
})();
