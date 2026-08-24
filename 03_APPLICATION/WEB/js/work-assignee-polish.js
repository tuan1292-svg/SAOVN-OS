(() => {
  const byId = id => document.getElementById(id);
  const picker = byId('taskAssigneePicker');
  const options = byId('taskAssigneeOptions');
  if (!picker || !options) return;

  const style = document.createElement('style');
  style.textContent = `
    .assignee-option-card{position:relative!important;min-height:52px!important;padding:9px 10px!important;border-radius:11px!important;box-sizing:border-box!important}
    .assignee-option-card .assignee-option-copy{display:flex;flex-direction:column;min-width:0}
    .assignee-option-card .assignee-option-meta{white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
    .assignee-option-card.is-selected{box-shadow:inset 0 0 0 1px rgba(37,135,255,.12),0 4px 14px rgba(0,0,0,.08)}
    .assignee-option-card:has(input:focus-visible){outline:2px solid rgba(37,135,255,.42);outline-offset:1px}
    .assignee-option-card .assignee-option-check{position:relative;z-index:2;flex:0 0 auto}
    .assignee-scope-filters{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:7px 0 2px}
    .assignee-scope-filters select{width:100%;min-width:0;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.035);color:#91a2b9;padding:7px 8px;outline:0;font-size:8px}
    .assignee-scope-filters select:focus{border-color:rgba(37,135,255,.45);color:#d7e7fb}
    .assignee-filter-note{margin:4px 0 6px;color:#66778f;font-size:7px}
    .assignee-option-filtered{display:none!important}
    @media(max-width:520px){.assignee-scope-filters{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const initials = text => String(text || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase() || '?';
  const clean = value => String(value || '').replace(/\s+/g,' ').trim();

  function enhance() {
    options.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const row = input.closest('label,[role="option"],.assignee-option-card') || input.parentElement;
      if (!row) return;

      const strong = row.querySelector('strong,.assignee-option-name');
      const small = row.querySelector('small,.assignee-option-meta');
      const name = clean(input.dataset.name || strong?.textContent || '');
      const meta = clean(input.dataset.team || input.dataset.department || small?.textContent || '');
      if (name) input.dataset.name = name;
      if (meta) {
        input.dataset.assigneeMeta = meta;
        input.dataset.team = input.dataset.team || meta;
        input.dataset.department = input.dataset.department || meta;
      }

      row.classList.add('assignee-option-card');
      if (strong && !strong.classList.contains('assignee-option-name')) strong.classList.add('assignee-option-name');
      if (small && !small.classList.contains('assignee-option-meta')) small.classList.add('assignee-option-meta');
      let avatar = row.querySelector('.assignee-option-avatar');
      if (!avatar) {
        avatar = document.createElement('span');
        avatar.className = 'assignee-option-avatar';
        avatar.textContent = initials(name || 'Thành viên');
        row.insertBefore(avatar, row.querySelector('.assignee-option-copy') || input.nextSibling);
      } else if (name) avatar.textContent = initials(name);

      const sync = () => row.classList.toggle('is-selected', input.checked);
      sync();
      if (!input.dataset.assigneeSyncBound) {
        input.dataset.assigneeSyncBound = '1';
        input.addEventListener('change', sync);
      }
    });
    ensureFilters();
    applyFilters();
  }

  function optionMeta(input) {
    const row = input.closest('label,[role="option"],.assignee-option-card') || input.parentElement;
    return clean(input.dataset.assigneeMeta || row?.querySelector('.assignee-option-meta')?.textContent || '');
  }

  function valuesFor(kind) {
    const values = new Set();
    options.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const meta = optionMeta(input);
      const parts = meta.split('·').map(clean).filter(Boolean);
      if (kind === 'department' && parts.length >= 2) values.add(parts[parts.length - 2]);
      if (kind === 'team' && parts.length >= 3) values.add(parts[parts.length - 1]);
    });
    return [...values].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
  }

  function ensureFilters() {
    let box = byId('assigneeScopeFilters');
    if (!box) {
      const head = picker.querySelector('.assignee-menu-head');
      if (!head) return;
      box = document.createElement('div');
      box.id = 'assigneeScopeFilters';
      box.className = 'assignee-scope-filters';
      box.innerHTML = '<select id="assigneeDepartmentFilter" aria-label="Lọc theo phòng ban"><option value="ALL">Tất cả phòng ban</option></select><select id="assigneeTeamFilter" aria-label="Lọc theo Team"><option value="ALL">Tất cả Team</option></select>';
      const note = document.createElement('div');
      note.id = 'assigneeFilterNote';
      note.className = 'assignee-filter-note';
      note.textContent = 'Bộ lọc chỉ thu hẹp danh sách hiển thị, không bỏ người đã chọn.';
      head.append(box, note);
      box.querySelectorAll('select').forEach(select => select.addEventListener('change', applyFilters));
    }
    const department = byId('assigneeDepartmentFilter');
    const team = byId('assigneeTeamFilter');
    if (department) fillSelect(department, valuesFor('department'));
    if (team) fillSelect(team, valuesFor('team'));
  }

  function fillSelect(select, values) {
    const current = select.value || 'ALL';
    select.replaceChildren(new Option(select.id.includes('Department') ? 'Tất cả phòng ban' : 'Tất cả Team','ALL'));
    values.forEach(value => select.appendChild(new Option(value,value)));
    select.value = values.includes(current) ? current : 'ALL';
  }

  function applyFilters() {
    const department = byId('assigneeDepartmentFilter')?.value || 'ALL';
    const team = byId('assigneeTeamFilter')?.value || 'ALL';
    options.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const row = input.closest('label,[role="option"],.assignee-option-card') || input.parentElement;
      const meta = optionMeta(input);
      const parts = meta.split('·').map(clean).filter(Boolean);
      const dep = parts.length >= 2 ? parts[parts.length - 2] : '';
      const tm = parts.length >= 3 ? parts[parts.length - 1] : '';
      const matchDepartment = department === 'ALL' || dep === department;
      const matchTeam = team === 'ALL' || tm === team;
      row?.classList.toggle('assignee-option-filtered', !(matchDepartment && matchTeam));
    });
  }

  const observer = new MutationObserver(enhance);
  observer.observe(options, {childList:true, subtree:true});
  enhance();
})();