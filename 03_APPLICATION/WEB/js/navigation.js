// SAOVN-OS — Shared Navigation Controller
// Keeps the core/communication/admin menu consistent across every WEB page.

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
    ['work.html', '▣', 'Work', 'work-module']
  ]}
];

function currentKey() {
  const page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  if (page === 'dashboard.html' || page === '') return 'dashboard';
  if (page === 'work.html') return 'work';
  if (page === 'departments.html') return 'departments';
  if (page === 'members.html') return 'members';
  if (page === 'chat.html') return 'chat';
  if (page === 'notifications.html') return 'notifications';
  return '';
}

function makeSection(section, items, active) {
  const wrap = document.createElement('div');
  wrap.className = 'sidebar-section saovn-nav-section';
  wrap.dataset.navSection = section;

  const title = document.createElement('div');
  title.className = 'sidebar-title';
  title.innerHTML = `<span>${section}</span>`;
  wrap.appendChild(title);

  items.forEach(([href, icon, label, key]) => {
    const link = document.createElement('a');
    link.className = 'navigation-item';
    if (key === active || (active === 'work' && key === 'work-module')) link.classList.add('active');
    link.href = href;
    link.dataset.navKey = key;
    link.innerHTML = `<span class="nav-icon">${icon}</span><span>${label}</span>`;
    wrap.appendChild(link);
  });
  return wrap;
}

export function initNavigation(options = {}) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Only replace navigation blocks. Keep brand, workspace and user controls untouched.
  sidebar.querySelectorAll('.saovn-nav-section, .sidebar-section').forEach(node => node.remove());

  const bottom = sidebar.querySelector('.sidebar-bottom');
  const active = options.active || currentKey();
  NAV_ITEMS.forEach(group => sidebar.insertBefore(makeSection(group.section, group.items, active), bottom));

  if (options.admin === true || document.body.dataset.admin === 'true') {
    const admin = document.createElement('div');
    admin.className = 'sidebar-section saovn-nav-section';
    admin.innerHTML = `
      <div class="sidebar-title"><span>QUẢN TRỊ</span></div>
      <a class="navigation-item" href="members.html"><span class="nav-icon">♙</span><span>Quản lý thành viên</span></a>
      <a class="navigation-item" href="departments.html"><span class="nav-icon">▤</span><span>Quản lý phòng ban</span></a>`;
    sidebar.insertBefore(admin, bottom);
  }
}
