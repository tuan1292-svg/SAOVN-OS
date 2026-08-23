import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getPermissions, can, role } from './permissions.js';
import { loadOrgScope, scopeLabel } from './org-scope.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
const initials = name => String(name || 'S').split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
const sameText = (a,b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const positionCode = value => String(value || '').trim().toUpperCase();
const position = value => String(value || '').trim() || 'Chưa xác định';
const statusLabel = { BACKLOG:'Backlog', TODO:'Todo', IN_PROGRESS:'Đang thực hiện', REVIEW:'Review', DONE:'Hoàn thành' };
let department = null, members = [], tasks = [], orgScope = null;

onAuthStateChanged(auth, async user => {
  if (!user) { location.replace('index.html'); return; }
  try {
    await getPermissions();
    // Use the canonical permission alias. The old departments.view key is not
    // a capability in the policy and incorrectly redirected valid users.
    if (!can('departments', 'read')) { location.replace('dashboard.html'); return; }
    const identitySnap = await getDoc(doc(db, 'identities', user.uid));
    const identity = identitySnap.exists() ? identitySnap.data() : {};
    const name = identity.fullName || identity.displayName || identity.name || user.displayName || 'Thành viên';
    orgScope = await loadOrgScope(user.uid);
    orgScope = { ...(orgScope || {}), uid:user.uid, identity };
    $('userName').textContent = name;
    $('userAvatar').textContent = initials(name);
    $('userRole').textContent = role() === 'ADMIN' ? 'Founder · Chairman · CEO' : orgScope.scope === 'DEPARTMENT' ? 'Department Head' : orgScope.scope === 'TEAM' ? 'Team Lead' : orgScope.role === 'MANAGER' ? 'Manager' : 'Workspace member';
    $('logoutBtn').onclick = () => signOut(auth);
    $('teamTaskFilter')?.addEventListener('change', renderTasks);
    renderScope();
    await loadWorkspace();
  } catch (error) {
    console.error('Department workspace bootstrap error:', error);
    setSyncError();
    showError(error?.code === 'permission-denied' ? 'Tài khoản chưa có quyền đọc phạm vi phòng làm việc.' : 'Không thể khởi tạo phòng làm việc.');
  }
});

function renderScope() {
  const title = $('scopeTitle'), description = $('scopeDescription');
  if (!title || !description || !orgScope) return;
  title.textContent = scopeLabel(orgScope);
  if (orgScope.role === 'ADMIN') description.textContent = 'Bạn có quyền quản trị toàn bộ tổ chức và các không gian được cấp quyền.';
  else if (orgScope.scope === 'DEPARTMENT') description.textContent = 'Bạn là Trưởng phòng. Phạm vi quản lý tập trung vào thành viên, Team và công việc của phòng ban.';
  else if (orgScope.scope === 'TEAM') description.textContent = 'Bạn là Trưởng nhóm. Phạm vi quản lý tập trung vào Team và công việc của nhóm.';
  else if (orgScope.role === 'MANAGER') description.textContent = 'Bạn đang quản lý trực tiếp các thành viên được giao cho mình và các công việc liên quan.';
  else description.textContent = 'Bạn đang làm việc trong phạm vi cá nhân và các công việc được giao cho mình.';
}

function setSyncError() {
  const el = $('syncState');
  if (el) el.innerHTML = '<i style="background:#ff3b3b"></i> Firebase · Lỗi';
}

async function loadWorkspace() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.replace('departments.html'); return; }
  try {
    const departmentSnap = await getDoc(doc(db, 'departments', id));
    if (!departmentSnap.exists()) { showError('Không tìm thấy phòng ban.'); return; }
    department = { id:departmentSnap.id, ...departmentSnap.data() };
    const privileged = orgScope.role === 'ADMIN' || orgScope.scope === 'DEPARTMENT' || orgScope.scope === 'TEAM' || orgScope.role === 'MANAGER';
    let identityDocs = [];
    if (privileged) {
      try {
        const snap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
        identityDocs = snap.docs;
      } catch (error) {
        console.warn('Department directory query denied; using own identity.', error);
        const own = await getDoc(doc(db, 'identities', orgScope.uid));
        if (own.exists()) identityDocs = [own];
      }
    } else {
      const own = await getDoc(doc(db, 'identities', orgScope.uid));
      if (own.exists()) identityDocs = [own];
    }
    members = identityDocs.map(d => ({ id:d.id, ...d.data() })).filter(member => member.status === 'ACTIVE' && identityBelongsToDepartment(member)).sort((a,b) => String(a.fullName || a.displayName || a.name || '').localeCompare(String(b.fullName || b.displayName || b.name || ''), 'vi'));
    renderDepartment();
    await loadTasks();
    renderTeamFilter();
    if (privileged) renderTeams();
    const sync = $('syncState');
    if (sync) sync.innerHTML = '<i></i> Firebase · Đã đồng bộ';
  } catch (error) {
    console.error('Department workspace error:', error);
    setSyncError();
    showError(error?.code === 'permission-denied' ? 'Không đủ quyền truy cập dữ liệu phòng làm việc.' : 'Không thể tải phòng làm việc.');
  }
}

function identityBelongsToDepartment(identity) {
  if (!identity || !department) return false;
  const depId = String(identity.departmentId || '').trim();
  if (depId) return depId === department.id;
  return sameText(identity.department, department.name);
}

function canOpenDepartment() {
  if (!orgScope || !department) return false;
  if (orgScope.role === 'ADMIN') return true;
  if (orgScope.departmentId && String(orgScope.departmentId) !== String(department.id)) return false;
  if (orgScope.scope === 'DEPARTMENT' || orgScope.scope === 'TEAM' || orgScope.role === 'MANAGER') return true;
  return identityBelongsToDepartment(orgScope.identity);
}

function renderDepartment() {
  const name = department.name || 'Phòng làm việc';
  $('crumbName').textContent = name;
  $('departmentName').textContent = name;
  $('departmentCode').textContent = department.code || 'DEPT';
  $('departmentDescription').textContent = department.description || 'Không gian làm việc của phòng ban.';
  $('deptMark').textContent = initials(name).slice(0,2) || 'D';
  $('departmentStatus').textContent = department.active === false ? 'Ngừng hoạt động' : 'Đang hoạt động';
  $('departmentStatus').classList.toggle('inactive', department.active === false);
  $('memberCount').textContent = members.length;
  $('memberSummary').textContent = `${members.length} người`;
}