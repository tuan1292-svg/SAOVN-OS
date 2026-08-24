import { getWorkScope } from './work-scope.js';

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
    .task-create-context{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 15px;padding:11px 13px;border:1px solid rgba(69,151,255,.18);border-radius:11px;background:linear-gradient(135deg,rgba(37,135,255,.09),rgba(255,255,255,.025))}.task-create-context strong{display:block;color:#dce8fb;font-size:10px}.task-create-context span{display:block;color:#71829a;font-size:8px;margin-top:3px}.task-create-context b{padding:5px 8px;border-radius:7px;color:#8ec4ff;background:#2587ff18;font-size:8px;white-space:nowrap}.task-quick-deadlines{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.task-quick-deadlines button,.task-assignee-tools button{border:1px solid var(--line);border-radius:7px;background:#ffffff05;color:#8293aa;padding:5px 7px;font-size:7px;cursor:pointer}.task-quick-deadlines button:hover,.task-assignee-tools button:hover{border-color:#2587ff66;color:#c3ddff}.task-assignee-tools{display:flex;gap:5px;margin:7px 0 2px}.task-create-status{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:5px 0 14px}.task-create-status span{padding:7px 8px;border:1px solid #fff1;border-radius:8px;background:#ffffff03;color:#687991;font-size:7px}.task-create-status span.ok{color:#00e676;background:#00e67608;border-color:#00e67624}.task-create-status b{display:block;color:inherit;font-size:8px;margin-bottom:2px}.task-create-status small{font-size:7px}.task-save-hint{margin-right:auto;align-self:center;color:#65758d;font-size:7px}.task-save-hint.ok{color:#70b98f}.task-counter{display:flex;justify-content:flex-end;color:#66758c;font-size:7px;margin-top:4px}.task-counter.warn{color:#ff9f1c}@media(max-width:720px){.task-create-status{grid-template-columns:1fr}.task-create-context{align-items:flex-start}.task-save-hint{display:none}}
  `;
  document.head.appendChild(styles);

  function scopeInfo(){
    try { const s=getWorkScope?.(); return s?.type==='ORGANIZATION' ? ['Toàn tổ chức','Công việc theo phạm vi quản trị'] : [s?.label||'Phạm vi hiện tại','Công việc sẽ được đồng bộ theo phạm vi được cấp quyền']; }
    catch { return ['Phạm vi hiện tại','Công việc sẽ được đồng bộ theo quyền của tài khoản']; }
  }

  function setup(){
    if (!$('taskCreateContext')) { const [label,detail]=scopeInfo(); const box=document.createElement('div'); box.id='taskCreateContext'; box.className='task-create-context'; box.innerHTML=`<div><strong>Phạm vi công việc</strong><span>${detail}</span></div><b>${label}</b>`; form.insertBefore(box, form.firstElementChild?.nextElementSibling||form.firstElementChild); }
    if (title && !$('taskTitleCounter')) { const c=document.createElement('div');c.id='taskTitleCounter';c.className='task-counter';title.parentElement.appendChild(c);const update=()=>{c.textContent=`${title.value.length} / 120`;c.classList.toggle('warn',title.value.length>108)};title.addEventListener('input',update);update(); }
    if (description && !$('taskDescriptionCounter')) { const c=document.createElement('div');c.id='taskDescriptionCounter';c.className='task-counter';description.parentElement.appendChild(c);const update=()=>c.textContent=`${description.value.length} ký tự`;description.addEventListener('input',update);update(); }
    if (due && !$('taskQuickDeadlines')) { const wrap=document.createElement('div');wrap.id='taskQuickDeadlines';wrap.className='task-quick-deadlines';wrap.innerHTML='<button type="button" data-days="0">Hôm nay</button><button type="button" data-days="1">Ngày mai</button><button type="button" data-days="3">+3 ngày</button><button type="button" data-days="7">+7 ngày</button><button type="button" data-days="14">+14 ngày</button><button type="button" data-clear="1">Bỏ deadline</button>';due.parentElement.appendChild(wrap);wrap.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.clear)due.value='';else{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+Number(b.dataset.days));due.value=d.toISOString().slice(0,10)}due.dispatchEvent(new Event('input',{bubbles:true}));refresh();};}
    if (picker && !$('taskAssigneeTools')) { const tools=document.createElement('div');tools.id='taskAssigneeTools';tools.className='task-assignee-tools';tools.innerHTML='<button type="button" data-action="all">Chọn tất cả</button><button type="button" data-action="clear">Bỏ chọn</button>';picker.parentElement.appendChild(tools);tools.onclick=e=>{const b=e.target.closest('button');if(!b)return;[...options.querySelectorAll('input[type=checkbox]')].forEach(i=>{i.checked=b.dataset.action==='all';i.dispatchEvent(new Event('change',{bubbles:true}))});refresh();};}
    if (!$('taskCreateStatus')) { const box=document.createElement('div');box.id='taskCreateStatus';box.className='task-create-status';box.innerHTML='<span data-state="title"><b>① Tên công việc</b><small>Bắt buộc</small></span><span data-state="assignee"><b>② Người phụ trách</b><small>Có thể giao sau</small></span><span data-state="deadline"><b>③ Deadline</b><small>Không bắt buộc</small></span>';form.querySelector('.modal-actions')?.before(box);}
    if (!$('taskSaveHint')) { const n=document.createElement('span');n.id='taskSaveHint';n.className='task-save-hint';$('cancelModal')?.before(n);}
    refresh();
  }

  function refresh(){
    const titleOk=!!title?.value.trim(),assigneeOk=!!options?.querySelector('input:checked'),dueOk=!!due?.value;
    [['title',titleOk],['assignee',assigneeOk],['deadline',dueOk]].forEach(([key,ok])=>$("taskCreateStatus")?.querySelector(`[data-state="${key}"]`)?.classList.toggle('ok',ok));
    if(save){save.disabled=!titleOk;save.title=titleOk?'Sẵn sàng lưu':'Nhập tên công việc trước khi lưu';}
    const hint=$('taskSaveHint');if(hint){hint.textContent=titleOk?'Sẵn sàng lưu công việc':'Cần nhập tên công việc';hint.classList.toggle('ok',titleOk);}
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))$('closeModal')?.click();});
  [title,description,due].filter(Boolean).forEach(el=>el.addEventListener('input',refresh));
  options?.addEventListener('change',refresh);
  new MutationObserver(()=>{if(modal.classList.contains('open'))setup();}).observe(modal,{attributes:true,attributeFilter:['class']});
  setup();
})();
