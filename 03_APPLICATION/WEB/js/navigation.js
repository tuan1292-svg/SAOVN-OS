// SAOVN-OS — Shared Navigation Controller
// One application navigation for every user. Visibility is capability-driven.

const NAV_ITEMS = [
  { section: 'CORE', items: [
    ['dashboard.html', '⌂', 'Tổng quan', 'dashboard', 'dashboard.view'],
    ['work.html', '▣', 'Công việc', 'work', 'work.task.view'],
    ['departments.html', '▤', 'Phòng ban', 'departments', 'organization.department.view'],
    ['members.html', '♙', 'Thành viên', 'members', 'people.member.view']
  ]},
  { section: 'TRAO ĐỔI', items: [
    ['chat.html', '◌', 'Trò chuyện', 'chat', null],
    ['notifications.html', '♢', 'Thông báo', 'notifications', null]
  ]},
  { section: 'MODULES', items: [
    ['work.html', '▱', 'Work', 'work-module', 'work.task.view'],
    ['#projects', '◇', 'Dự án', 'projects', 'project.view']
  ]},
  { section: 'QUẢN TRỊ', adminOnly: true, items: [
    ['members.html', '♙', 'Quản lý thành viên', 'admin-members', 'people.member.update'],
    ['departments.html', '▤', 'Quản lý phòng ban', 'admin-departments', 'organization.department.manage'],
    ['#roles', '♙', 'Vai trò', 'admin-roles', 'admin.role.manage'],
    ['#permissions', '▣', 'Phân quyền', 'admin-system', 'admin.system.manage'],
    ['#settings', '⚙', 'Cài đặt', 'admin-settings', 'admin.system.manage']
  ]}
];

function currentKey() {
  const page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  return ({
    'dashboard.html': 'dashboard', 'work.html': 'work', 'departments.html': 'departments',
    'members.html': 'members', 'chat.html': 'chat', 'notifications.html': 'notifications'
  })[page] || '';
}

function makeSection(group, active) {
  const wrap = document.createElement('div');
  wrap.className = 'sidebar-section nav-group saovn-nav-section';
  wrap.dataset.navSection = group.section;
  if (group.adminOnly) { wrap.hidden = true; wrap.dataset.adminNavigation = 'true'; }

  const title = document.createElement('div');
  title.className = 'sidebar-title nav-title';
  title.innerHTML = `<span>${group.section}</span>`;
  wrap.appendChild(title);

  group.items.forEach(([href, icon, label, key, capability]) => {
    const link = document.createElement('a');
    link.className = 'navigation-item nav-item';
    if (key === active || (active === 'work' && key === 'work-module')) link.classList.add('active');
    link.href = href;
    link.dataset.navKey = key;
    if (capability) link.dataset.capability = capability;
    link.innerHTML = `<span class="nav-icon">${icon}</span><span>${label}</span>`;
    wrap.appendChild(link);
  });
  return wrap;
}

async function renderNavigation() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.dataset.navigationReady === 'true') return;
  const bottom = sidebar.querySelector('.sidebar-bottom');
  if (!bottom) return;

  sidebar.dataset.navigationReady = 'true';
  sidebar.querySelectorAll('.sidebar-section, .nav-group, .module-section').forEach(node => node.remove());
  const active = currentKey();
  NAV_ITEMS.forEach(group => sidebar.insertBefore(makeSection(group, active), bottom));

  const apply = event => {
    const permissions = event.detail?.permissions;
    if (!(permissions instanceof Set)) return;
    sidebar.querySelectorAll('[data-capability]').forEach(node => {
      const allowed = permissions.has(node.dataset.capability);
      node.hidden = !allowed;
      node.setAttribute('aria-hidden', String(!allowed));
      if (allowed) node.removeAttribute('tabindex'); else node.setAttribute('tabindex', '-1');
    });
    sidebar.querySelectorAll('[data-admin-navigation="true"]').forEach(node => {
      node.hidden = ![...permissions].some(p => p.startsWith('admin.'));
    });
  };

  window.addEventListener('saovn:permissions-ready', apply);
  try {
    const { getPermissions } = await import('./permissions.js');
    apply({ detail: await getPermissions() });
  } catch (error) {
    console.warn('Shared navigation permission sync unavailable:', error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderNavigation, { once: true });
else renderNavigation();
