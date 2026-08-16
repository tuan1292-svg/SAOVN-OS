// SAOVN-OS — Shared Navigation Controller
// Single source of truth for the left navigation across all application pages.

const NAV_ITEMS = [
  { section: 'CORE', items: [
    ['dashboard.html', '⌂', 'Tổng quan', 'dashboard'],
    ['work.html', '▣', 'Công việc', 'work'],
    ['departments.html', '▤', 'Phòng ban', 'departments'],
    ['members.html', '♙', 'Thành viên', 'members']
  ]},
  { section: 'TRAO ĐỔI', items: [
    ['chat.html', '◌', 'Trò chuyện', 'chat'],
    ['notifications.html', '♢', 'Thông báo', 'notifications']
  ]},
  { section: 'MODULES', items: [
    ['work.html', '▱', 'Work', 'work-module']
  ]},
  { section: 'QUẢN TRỊ', items: [
    ['members.html', '♙', 'Quản lý thành viên', 'admin-members'],
    ['departments.html', '▤', 'Quản lý phòng ban', 'admin-departments'],
    ['#modules', '♙', 'Vai trò', 'admin-roles'],
    ['#modules', '▣', 'Phân quyền', 'admin-permissions'],
    ['#modules', '⚙', 'Cài đặt', 'admin-settings']
  ]}
];

function currentKey() {
  const page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  return ({
    'dashboard.html': 'dashboard',
    'work.html': 'work',
    'departments.html': 'departments',
    'members.html': 'members',
    'chat.html': 'chat',
    'notifications.html': 'notifications'
  })[page] || '';
}

function makeSection(section, items, active) {
  const wrap = document.createElement('div');
  // Both class families are intentional: older pages use nav-group/nav-item,
  // newer pages use sidebar-section/navigation-item.
  wrap.className = 'sidebar-section nav-group saovn-nav-section';
  wrap.dataset.navSection = section;
  if (section === 'QUẢN TRỊ') {
    wrap.hidden = true;
    wrap.dataset.adminNavigation = 'true';
  }

  const title = document.createElement('div');
  title.className = 'sidebar-title nav-title';
  title.innerHTML = `<span>${section}</span>`;
  wrap.appendChild(title);

  items.forEach(([href, icon, label, key]) => {
    const link = document.createElement('a');
    link.className = 'navigation-item nav-item';
    if (key === active || (active === 'work' && key === 'work-module')) link.classList.add('active');
    link.href = href;
    link.dataset.navKey = key;
    link.innerHTML = `<span class="nav-icon">${icon}</span><span>${label}</span>`;
    wrap.appendChild(link);
  });
  return wrap;
}

function renderNavigation() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.dataset.navigationReady === 'true') return;

  const bottom = sidebar.querySelector('.sidebar-bottom');
  if (!bottom) return;

  sidebar.dataset.navigationReady = 'true';
  // Remove every page-specific navigation implementation, regardless of its
  // old class name. Brand/workspace/user controls remain untouched.
  sidebar.querySelectorAll('.sidebar-section, .nav-group, .module-section').forEach(node => node.remove());

  const active = currentKey();
  NAV_ITEMS.forEach(group => sidebar.insertBefore(makeSection(group.section, group.items, active), bottom));

  // permissions.js owns the authoritative role. It will reveal/hide the admin
  // group when its async permission state becomes ready.
  window.addEventListener('saovn:permissions-ready', event => {
    const isAdmin = event.detail?.role === 'ADMIN';
    const admin = sidebar.querySelector('[data-admin-navigation="true"]');
    if (admin) admin.hidden = !isAdmin;
  });

  // Load permissions lazily so pages that do not otherwise import permissions.js
  // still receive the same role-aware navigation.
  import('./permissions.js')
    .then(({ getPermissions }) => getPermissions())
    .then(state => {
      const admin = sidebar.querySelector('[data-admin-navigation="true"]');
      if (admin) admin.hidden = state?.role !== 'ADMIN';
    })
    .catch(error => console.warn('Shared navigation permission sync unavailable:', error));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavigation, { once: true });
} else {
  renderNavigation();
}
