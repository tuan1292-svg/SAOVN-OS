import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
let currentUser = null;
let currentIsAdmin = false;

const roleValues = {
  ADMIN: 'org_admin',
  MANAGER: 'manager',
  MEMBER: 'org_member'
};

function collectRoles(data) {
  const roles = data?.roles || {};
  return [
    ...(Array.isArray(roles.system) ? roles.system : []),
    ...(Array.isArray(roles.organization) ? roles.organization : [])
  ].map(value => String(value).toLowerCase());
}

function isAdminMembership(data) {
  const roles = collectRoles(data);
  return roles.some(role => ['system_admin', 'admin', 'org_admin', 'organization_admin'].includes(role));
}

function status(text, type = '') {
  const el = $('roleSaveStatus');
  if (!el) return;
  el.textContent = text;
  el.className = `role-save-status ${type}`.trim();
}

async function loadCurrentAdmin() {
  if (!currentUser) return;
  const snap = await getDoc(doc(db, 'memberships', `mem_${currentUser.uid}_org_saovn_01`));
  currentIsAdmin = snap.exists() && isAdminMembership(snap.data());
  const userRole = $('userRole');
  if (currentIsAdmin && userRole) userRole.textContent = 'Founder · Chairman · CEO';
  if (currentIsAdmin) {
    const option = $('positionSelect')?.querySelector('option[value="FOUNDER_CHAIRMAN_CEO"]');
    if (option) option.textContent = 'Founder · Chairman · CEO';
  }
}

async function saveOrganizationFields() {
  if (!currentIsAdmin) {
    status('Chỉ Admin mới được điều chỉnh vị trí và phòng ban.', 'error');
    return;
  }

  const identityId = $('detailId')?.textContent?.trim();
  if (!identityId || identityId === '—') {
    status('Không xác định được thành viên.', 'error');
    return;
  }

  const position = $('positionSelect')?.value || 'STAFF';
  const department = $('departmentInput')?.value?.trim() || '';
  const role = $('roleSelect')?.value || 'MEMBER';
  const button = $('saveMemberBtn');
  if (button) {
    button.disabled = true;
    button.textContent = 'Đang lưu...';
  }
  status('Đang cập nhật...', 'pending');

  try {
    const membershipRef = doc(db, 'memberships', `mem_${identityId}_org_saovn_01`);
    const identityRef = doc(db, 'identities', identityId);
    const membershipSnap = await getDoc(membershipRef);
    if (!membershipSnap.exists()) throw new Error('Không tìm thấy Membership của thành viên.');

    const membership = membershipSnap.data();
    const nextRoles = {
      ...(membership.roles || {}),
      organization: [roleValues[role] || 'org_member']
    };

    await setDoc(identityRef, {
      position,
      department,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    }, { merge: true });

    await setDoc(membershipRef, {
      position,
      department,
      roles: nextRoles,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    }, { merge: true });

    const positionLabel = $('positionSelect')?.selectedOptions?.[0]?.textContent || position;
    const detailPosition = $('detailPosition');
    const detailRole = $('detailRole');
    if (detailPosition) detailPosition.textContent = positionLabel;
    if (detailRole) detailRole.textContent = role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : 'Member';
    status('Đã lưu vị trí, phòng ban và vai trò.', 'success');
  } catch (error) {
    console.error('Lỗi cập nhật thông tin tổ chức:', error);
    status(error?.code === 'permission-denied' ? 'Không đủ quyền cập nhật thành viên.' : (error?.message || 'Không thể lưu thay đổi.'), 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Lưu thay đổi';
    }
  }
}

$('saveMemberBtn')?.addEventListener('click', saveOrganizationFields);

onAuthStateChanged(auth, user => {
  if (!user) return;
  currentUser = user;
  loadCurrentAdmin().catch(error => console.error('Không tải được quyền quản trị:', error));
});
