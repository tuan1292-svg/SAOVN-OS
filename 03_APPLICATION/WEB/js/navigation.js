// SAOVN-OS — Shared Navigation Controller
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
  return ({
    'dashboard.html':'dashboard', 'work.html':'work', 'departments.html':'departments',
    'members.html':'members', 'chat.html':'chat', 'notifications.html':'notifications'
  })[page] || '';
}

function makeSection(section, items, active) {
  const wrap = document.createElement('div');
  wrap.className = 'sidebar-section saovn-nav-section';
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

export function initNavigation() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.dataset.navigationReady === 'true') return;
  sidebar.dataset.navigationReady = 'true';
  const bottom = sidebar.querySelector('.sidebar-bottom');
  sidebar.querySelectorAll('.sidebar-section').forEach(node => node.remove());
  const active = currentKey();
  NAV_ITEMS.forEach(group => sidebar.insertBefore(makeSection(group.section, group.items, active), bottom));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
else initNavigation();
