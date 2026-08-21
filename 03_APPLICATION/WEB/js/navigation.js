// SAOVN-OS — Shared Navigation Controller
// One application navigation for every user. Module registry + capabilities are the single UI source.

const STATIC_GROUPS = [
  { section: 'CORE', ids: ['dashboard', 'work', 'departments', 'members'] },
  { section: 'WORKSPACE', ids: ['projects', 'attendance'] },
  { section: 'TRAO ĐỔI', ids: ['chat', 'notifications'] }
];

const ICONS = Object.freeze({
  dashboard: '⌂', work: '▣', departments: '▤', members: '♙', projects: '◇',
  attendance: '◷', chat: '◌', notifications: '♢'
});

const LABELS = Object.freeze({
  dashboard: 'Tổng quan', work: 'Công việc', departments: 'Phòng ban', members: 'Thành viên',
  projects: 'Dự án', attendance: 'Điểm danh', chat: 'Trò chuyện', notifications: 'Thông báo'
});

function currentKey() {
  const page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  return ({
    'dashboard.html': 'dashboard', 'work.html': 'work', 'departments.html': 'departments',
    'members.html': 'members', 'projects.html': 'projects', 'attendance.html': 'attendance',
    'chat.html': 'chat', 'notifications.html': 'notifications'
  })[page] || '';
}

function makeSection(group, modules, runtime, active) {
  const wrap = document.createElement('div');
  wrap.className = 'sidebar-section nav-group saovn-nav-section';
  wrap.dataset.navSection = group.section;

  const title = document.createElement('div');
  title.className = 'sidebar-title nav-title';
  title.innerHTML = `<span>${group.section}</span>`;
  wrap.appendChild(title);

  modules.filter(module => group.ids.includes(module.id)).forEach(module => {
    const capability = module.capabilities?.[0];
    const enabled = runtime?.moduleEnabled?.(module.id) !== false;
    const allowed = enabled && (!capability || runtime?.can?.(capability));
    if (!allowed) return;

    const href = module.routes?.[0];
    if (!href) return;
    const link = document.createElement('a');
    link.className = 'navigation-item nav-item';
    if (module.id === active) link.classList.add('active');
    link.href = href;
    link.dataset.navKey = module.id;
    link.dataset.moduleId = module.id;
    link.dataset.capability = capability || '';
    link.innerHTML = `<span class="nav-icon">${ICONS[module.id] || '•'}</span><span>${LABELS[module.id] || module.label || module.id}</span>`;
    wrap.appendChild(link);
  });

  if (wrap.querySelector('.nav-item')) return wrap;
  return null;
}

function makeAdminSection(runtime, active) {
  if (!runtime?.can?.('admin.system.manage')) return null;
  const wrap = document.createElement('div');
  wrap.className = 'sidebar-section nav-group saovn-nav-section';
  wrap.dataset.navSection = 'QUẢN TRỊ';
  wrap.dataset.adminNavigation = 'true';

  const title = document.createElement('div');
  title.className = 'sidebar-title nav-title';
  title.innerHTML = '<span>QUẢN TRỊ</span>';
  wrap.appendChild(title);

  const link = document.createElement('a');
  link.className = 'navigation-item nav-item';
  link.href = 'admin-control.html';
  link.dataset.navKey = 'admin-control';
  if (active === 'admin-control') link.classList.add('active');
  link.innerHTML = '<span class="nav-icon">⚙</span><span>Control Plane</span>';
  wrap.appendChild(link);
  return wrap;
}

async function renderNavigation() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.dataset.navigationReady === 'true') return;
  const bottom = sidebar.querySelector('.sidebar-bottom');
  if (!bottom) return;

  sidebar.dataset.navigationReady = 'true';
  try {
    const [{ listModules }, { getPermissions }] = await Promise.all([
      import('./core/module-registry.js'), import('./permissions.js')
    ]);
    const modules = listModules();
    const state = await getPermissions();
    const runtime = state.context || window.SAOVNRuntime;
    const active = currentKey();

    sidebar.querySelectorAll('.sidebar-section, .nav-group, .module-section').forEach(node => node.remove());
    for (const group of STATIC_GROUPS) {
      const section = makeSection(group, modules, runtime, active);
      if (section) sidebar.insertBefore(section, bottom);
    }
    const admin = makeAdminSection(runtime, active);
    if (admin) sidebar.insertBefore(admin, bottom);

    const rerender = event => {
      const nextRuntime = event.detail?.context || event.detail;
      if (!nextRuntime) return;
      sidebar.querySelectorAll('.sidebar-section, .nav-group, .module-section').forEach(node => node.remove());
      for (const group of STATIC_GROUPS) {
        const section = makeSection(group, modules, nextRuntime, active);
        if (section) sidebar.insertBefore(section, bottom);
      }
      const nextAdmin = makeAdminSection(nextRuntime, active);
      if (nextAdmin) sidebar.insertBefore(nextAdmin, bottom);
    };
    window.addEventListener('saovn:runtime-ready', rerender);
  } catch (error) {
    console.warn('Shared navigation unavailable:', error?.code || error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderNavigation, { once: true });
else renderNavigation();
