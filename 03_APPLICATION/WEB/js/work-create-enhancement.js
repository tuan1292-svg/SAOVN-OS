import { getWorkScope } from './work-scope.js';

const $ = id => document.getElementById(id);
const modal = $('taskModal');
const form = $('taskForm');
if (!modal || !form) return;

const title = $('taskTitle');
const description = $('taskDescription');
const due = $('taskDueDate');
const status = $('taskStatus');
const priority = $('taskPriority');
const picker = $('taskAssigneePicker');
const options = $('taskAssigneeOptions');
const toggle = $('taskAssigneeToggle');
const menu = $('taskAssigneeMenu');
const save = $('saveTaskBtn');

function injectStyles() {
  if ($('workCreateEnhancementStyles')) return;
  const s = document.createElement('style');
  s.id = 'workCreateEnhancementStyles';
  s.textContent = `
    .task-create-context{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;padding:11px 13px;border:1px solid rgba(69,151,255,.18);border-radius:11px;background:linear-gradient(135deg,rgba(37,135,255,.09),rgba(255,255,255,.025))}
    .task-create-context strong{display:block;color:#dce8fb;font-size:10px}.task-create-context span{display:block;color:#71829a;font-size:8px;margin-top:3px}.task-create-context b{padding:5px 8px;border-radius:7px;color:#8ec4ff;background:#2587ff18;font-size:8px;white-space:nowrap}
    .task-field-meta{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#65758d;font-size:7px}.task-field-meta .valid{color:#00e676}.task-field-meta .warn{color:#ff9f1c}
    .task-quick-deadlines{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.task-quick-deadlines button{border:1px solid var(--line);border-radius:7px;background:#ffffff05;color:#8293aa;padding:5px 7px;font-size:7px;cursor:pointer}.task-quick-deadlines button:hover{border-color:#2587ff66;color:#b9d8ff;background:#2587ff0d}
    .task-assignee-tools{display:flex;gap:5px;margin:7px 0 2px}.task-assignee-tools button{border:1px solid var(--line);border-radius:7px;background:#ffffff05;color:#7f91aa;padding:5px 7px;font-size:7px;cursor:pointer}.task-assignee-tools button:hover{color:#dbe8fb;border-color:#2587ff55}
    .task-create-checks{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}.task-create-check{padding:7px 8px;border:1px solid #fff1;border-radius:8px;background:#ffffff03;color:#687991;font-size:7px}.task-create-check.ok{color:#00e676;background:#00e67608;border-color:#00e67624}.task-create-check b{display:block;font-size:8px;color:inherit;margin-bottom:2px}.task-create-check span{color:#687991}.task-create-check.ok span{color:#70b98f}
    .task-save-note{margin-right:auto;align-self:center;color:#65758d;font-size:7px}.task-save-note.ready{color:#70b98f}
    @media(max-width:720px){.task-create-checks{grid-template-columns:1fr}.task-create-context{align-items:flex-start}.task-save-note{display:none}}
  `;
  document.head.appendChild(s);
}

function scopeInfo() {
  try {
    const scope = getWorkScope?.();
    if (!scope) return { label:'Phạm vi hiện tại', detail:'Công việc sẽ được lưu theo quyền của tài khoản' };
    return { label:scope.label || scope.type || 'Phạm vi hiện tại', detail:scope.type === 'ORGANIZATION' ? 'Toàn bộ tổ chức' : 'Công việc trong phạm vi được cấp quyền' };
  } catch { return { label:'Phạm vi hiện tại', detail:'Công việc sẽ được lưu theo quyền của tài khoản' }; }
}

function addContext() {
  if ($('taskCreateContext')) return;
  const info = scopeInfo();
  const box = document.createElement('div');
  box.id = 'taskCreateContext';
  box.className = 'task-create-context';
  box.innerHTML = `<div><strong>Phạm vi công việc</strong><span>${info.detail}</span></div><b>${info.label}</b>`;
  form.insertBefore(box, form.firstElementChild?.nextElementSibling || form.firstElementChild);
}

function metaFor(input, max) {
  if (!input) return null;
  const meta = document.createElement('div');
  meta.className = 'task-field-meta';
  meta.innerHTML = `<span></span><span>0 / ${max}</span>`;
  input.parentElement.appendChild(meta);
  const update = () => {
    const n = input.value.trim().length;
    meta.lastElementChild.textContent = `${n} / ${max}`;
    meta.lastElementChild.className = n > max * .9 ? 'warn' : n ? 'valid' : '';
  };
  input.addEventListener('input', update);
  update();
}

function addDeadlineQuickPickers() {
  if (!due || $('taskQuickDeadlines')) return;
  const wrap = document.createElement('div');
  wrap.id = 'taskQuickDeadlines'; wrap.className = 'task-quick-deadlines';
  wrap.innerHTML = `<button type="button" data-days="0">Hôm nay</button><button type="button" data-days="1">Ngày mai</button><button type="button" data-days="3">+3 ngày</button><button type="button" data-days="7">+7 ngày</button><button type="button" data-days="14">+14 ngày</button><button type="button" data-clear="1">Bỏ deadline</button>`;
  due.parentElement.appendChild(wrap);
  wrap.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.clear) { due.value=''; due.dispatchEvent(new Event('change',{bubbles:true})); return; }
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+Number(b.dataset.days));
    due.value = d.toISOString().slice(0,10); due.dispatchEvent(new Event('change',{bubbles:true}));
    refresh();
  });
}

function addAssigneeTools() {
  if (!picker || $('taskAssigneeTools')) return;
  const tools = document.createElement('div'); tools.id='taskAssigneeTools'; tools.className='task-assignee-tools';
  tools.innerHTML='<button type="button" data-action="all">Chọn tất cả</button><button type="button" data-action="clear">Bỏ chọn</button>';
  picker.parentElement.appendChild(tools);
  tools.addEventListener('click', e => {
    const b=e.target.closest('button'); if(!b || !options) return;
    const inputs=[...options.querySelectorAll('input[type="checkbox"]')];
    inputs.forEach(i=>{i.checked=b.dataset.action==='all';i.dispatchEvent(new Event('change',{bubbles:true}))});
    refresh();
  });
}

function addChecks() {
  if ($('taskCreateChecks')) return;
  const grid=document.createElement('div');grid.id='taskCreateChecks';grid.className='task-create-checks';
  grid.innerHTML='<div data-check="title" class="task-create-check"><b>① Tên việc</b><span>Đặt tên rõ ràng</span></div><div data-check="assignee" class="task-create-check"><b>② Người phụ trách</b><span>Có thể giao sau</span></div><div data-check="deadline" class="task-create-check"><b>③ Deadline</b><span>Không bắt buộc</span></div>';
  form.querySelector('.modal-actions')?.before(grid);
}

function refresh() {
  const titleOk=!!title?.value.trim(); const assigneeOk=!!options?.querySelector('input:checked'); const dueOk=!!due?.value;
  const checks={title:titleOk,assignee:assigneeOk,deadline:dueOk};
  Object.entries(checks).forEach(([k,v])=>{const el=document.querySelector(`[data-check="${k}"]`);el?.classList.toggle('ok',v);});
  if(save){save.disabled=!titleOk;save.title=titleOk?'Sẵn sàng lưu':'Nhập tên công việc trước khi lưu';}
  const note=$('taskSaveNote'); if(note){note.textContent=titleOk?'Sẵn sàng lưu':'Cần nhập tên công việc';note.classList.toggle('ready',titleOk)}
}

function addSaveNote() {
  if ($('taskSaveNote')) return;
  const n=document.createElement('span');n.id='taskSaveNote';n.className='task-save-note';
  $('cancelModal')?.before(n);refresh();
}

function openEnhancements() {
  injectStyles(); addContext(); addDeadlineQuickPickers(); addAssigneeTools(); addChecks(); addSaveNote();
  setTimeout(()=>title?.focus(),80); refresh();
}

modal.addEventListener('click', e => { if(e.target===modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => { if(e.key==='Escape' && modal.classList.contains('open')) $('closeModal')?.click(); });
[title,description,due,status,priority].filter(Boolean).forEach(el=>el.addEventListener('input',refresh));
options?.addEventListener('change',refresh);
toggle?.addEventListener('click',()=>setTimeout(refresh,0));
form.addEventListener('submit',()=>{if(title?.value.trim()){save?.classList.add('is-saving');if(save)save.textContent='Đang lưu…';}},true);
new MutationObserver(()=>{if(modal.classList.contains('open'))openEnhancements();}).observe(modal,{attributes:true,attributeFilter:['class']});

openEnhancements();
