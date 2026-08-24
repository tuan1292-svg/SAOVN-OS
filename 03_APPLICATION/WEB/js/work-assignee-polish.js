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
  `;
  document.head.appendChild(style);

  const initials = text => String(text || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase() || '?';

  function enhance() {
    options.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const row = input.closest('label,[role="option"],.assignee-option-card') || input.parentElement;
      if (!row) return;

      const strong = row.querySelector('strong,.assignee-option-name');
      const small = row.querySelector('small,.assignee-option-meta');
      const name = String(input.dataset.name || strong?.textContent || '').trim();
      const meta = String(input.dataset.team || input.dataset.department || small?.textContent || '').replace(/\s+/g,' ').trim();
      if (name) input.dataset.name = name;
      if (meta) {
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
      input.addEventListener('change', sync);
    });
  }

  const observer = new MutationObserver(enhance);
  observer.observe(options, {childList:true, subtree:true});
  enhance();
})();
