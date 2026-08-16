import { collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from './firebase-config.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const initials = value => String(value || 'TV').trim().split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase().slice(0, 2) || 'TV';
const POSITION_LABELS = {
  FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO', INTERN:'Thực tập sinh', COLLABORATOR:'Cộng tác viên', STAFF:'Nhân viên',
  SPECIALIST:'Chuyên viên', SENIOR_SPECIALIST:'Chuyên viên cao cấp', TEAM_LEAD:'Trưởng nhóm', MANAGER:'Quản lý',
  DEPARTMENT_HEAD:'Trưởng phòng', DIRECTOR:'Giám đốc', OTHER:'Khác'
};

const peopleByUid = new Map();
const peopleByName = new Map();
const membershipToUid = new Map();
let profileModal = null;
let previousBodyOverflow = '';

function roleValues(data = {}) {
  const roles = data.roles || {};
  const values = [];
  if (Array.isArray(roles.system)) values.push(...roles.system);
  else if (roles.system && typeof roles.system === 'object') values.push(...Object.keys(roles.system).filter(k => roles.system[k]));
  if (Array.isArray(roles.organization)) values.push(...roles.organization);
  else if (roles.organization && typeof roles.organization === 'object') values.push(...Object.keys(roles.organization).filter(k => roles.organization[k]));
  if (Array.isArray(data.role)) values.push(...data.role);
  else if (data.role) values.push(data.role);
  return values.map(v => String(v).toUpperCase());
}

function isAdminMembership(data = {}) {
  return roleValues(data).some(v => v === 'ADMIN' || v === 'SYSTEM_ADMIN' || v === 'ORG_ADMIN' || v.includes('ADMIN'));
}

function membershipUid(id, data = {}) {
  return data.identityId || data.userId || data.uid || String(id || '').match(/^mem_(.+)_org_/)?.[1] || null;
}

function addAlias(alias, person) {
  const key = normalize(alias);
  if (key) peopleByName.set(key, person);
}

function buildPerson(uid, identity = {}, membership = {}) {
  const name = identity.fullName || identity.displayName || identity.name || membership.fullName || membership.displayName || membership.name || identity.email || membership.email || uid;
  const positionRaw = membership.position || identity.position || identity.jobTitle || (isAdminMembership(membership) ? 'FOUNDER_CHAIRMAN_CEO' : 'STAFF');
  const person = {
    uid,
    name,
    identity,
    membership,
    position: POSITION_LABELS[String(positionRaw).toUpperCase()] || positionRaw || 'Nhân viên',
    department: membership.department || identity.department || 'Chưa phân phòng ban',
    team: membership.team || identity.team || 'Chưa phân Team',
    email: identity.email || membership.email || 'Chưa cập nhật',
    phone: identity.phone || identity.phoneNumber || identity.mobile || identity.mobileNumber || membership.phone || membership.phoneNumber || membership.mobile || membership.mobileNumber || 'Chưa cập nhật',
    managerName: membership.managerName || identity.managerName || 'Chưa cập nhật',
    role: isAdminMembership(membership) ? 'ADMIN' : (membership.role || 'MEMBER'),
    status: membership.status || identity.status || 'ACTIVE'
  };

  peopleByUid.set(uid, person);
  [name, identity.fullName, identity.displayName, identity.name, membership.fullName, membership.displayName, membership.name, identity.email, membership.email].filter(Boolean).forEach(alias => addAlias(alias, person));
  if (isAdminMembership(membership) || String(positionRaw).toUpperCase() === 'FOUNDER_CHAIRMAN_CEO') addAlias('Admin', person);
  return person;
}

async function loadPeople() {
  let identitySnap;
  try {
    identitySnap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
  } catch (error) {
    identitySnap = await getDocs(collection(db, 'identities'));
  }

  let membershipSnap = null;
  try {
    membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
  } catch (error) {
    try { membershipSnap = await getDocs(collection(db, 'memberships')); } catch (_) { membershipSnap = null; }
  }

  const memberships = new Map();
  membershipSnap?.forEach(s => {
    const data = s.data() || {};
    const uid = membershipUid(s.id, data);
    if (!uid) return;
    memberships.set(uid, { id: s.id, ...data });
    membershipToUid.set(s.id, uid);
  });

  identitySnap.docs.forEach(s => buildPerson(s.id, s.data() || {}, memberships.get(s.id) || {}));
}

function resolveUid(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (peopleByUid.has(raw)) return raw;
  if (membershipToUid.has(raw)) return membershipToUid.get(raw);
  const match = raw.match(/^mem_(.+)_org_/);
  if (match) return match[1];
  return peopleByName.get(normalize(raw))?.uid || null;
}

function linkFor(person) {
  return `<a class="work-member-link" href="#" data-member-profile="${esc(person.uid)}">${esc(person.name)}</a>`;
}

function linkByName(name) {
  const clean = String(name || '').replace(/\s+·\s+.*/, '').trim();
  const person = peopleByName.get(normalize(clean));
  return person ? linkFor(person) : esc(name);
}

function enhanceAssigneeText(root = document) {
  root.querySelectorAll?.('.assignee, .kanban-assignee').forEach(el => {
    if (el.dataset.memberLinksReady === '1' || el.querySelector('[data-member-profile]')) return;
    const raw = el.textContent || '';
    if (!raw.trim() || raw.trim() === 'Chưa giao') return;
    const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
    el.innerHTML = parts.map(part => linkByName(part)).join(', ');
    el.dataset.memberLinksReady = '1';
  });
}

function enhanceDetail(root) {
  const summary = root?.querySelector?.('.detail-summary');
  if (!summary || summary.dataset.memberLinksReady === '1') return;
  const first = summary.querySelector('div:first-child strong');
  if (!first) return;
  const raw = first.textContent || '';
  if (!raw.trim() || raw.trim() === 'Chưa giao') return;
  first.innerHTML = raw.split(',').map(x => linkByName(x.trim())).join(', ');
  first.classList.add('work-member-names');
  summary.dataset.memberLinksReady = '1';
}

function enhanceComments(root = document) {
  root.querySelectorAll?.('.comment').forEach(comment => {
    if (comment.dataset.memberLinksReady === '1') return;
    const nameEl = comment.querySelector('strong[data-member-profile]');
    if (nameEl) {
      const uid = resolveUid(nameEl.dataset.memberProfile);
      if (uid) nameEl.dataset.memberProfile = uid;
      nameEl.classList.add('work-member-link');
      comment.dataset.memberLinksReady = '1';
      return;
    }
    const oldName = comment.querySelector('strong');
    const person = peopleByName.get(normalize(oldName?.textContent));
    if (oldName && person) {
      oldName.outerHTML = linkFor(person);
      comment.dataset.memberLinksReady = '1';
    }
  });
}

function ensureProfileModal() {
  if (profileModal) return profileModal;
  profileModal = document.createElement('div');
  profileModal.id = 'memberProfileModal';
  profileModal.className = 'member-profile-modal';
  profileModal.setAttribute('aria-hidden', 'true');
  profileModal.innerHTML = `<div class="member-profile-backdrop" data-profile-close></div><section class="member-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="memberProfileName"><button class="member-profile-close" type="button" data-profile-close aria-label="Đóng">×</button><div id="memberProfileContent" class="member-profile-content"><div class="member-profile-loading">Đang tải hồ sơ…</div></div></section>`;
  document.body.appendChild(profileModal);
  profileModal.addEventListener('click', event => { if (event.target.closest('[data-profile-close]')) closeProfileModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && profileModal?.classList.contains('open')) closeProfileModal(); });
  injectProfileStyles();
  return profileModal;
}

async function openProfileModal(rawId) {
  const modal = ensureProfileModal();
  const content = modal.querySelector('#memberProfileContent');
  const uid = resolveUid(rawId);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  content.innerHTML = '<div class="member-profile-loading">Đang tải hồ sơ…</div>';

  let person = uid ? peopleByUid.get(uid) : null;
  if (!person && uid) {
    try {
      const snap = await getDoc(doc(db, 'identities', uid));
      if (snap.exists()) person = buildPerson(uid, snap.data() || {}, {});
    } catch (error) {
      console.warn('Không tải được hồ sơ thành viên:', error?.code || error);
    }
  }

  if (!person && rawId) {
    const fallbackName = String(rawId).trim();
    person = peopleByName.get(normalize(fallbackName)) || null;
  }

  if (!person) {
    content.innerHTML = '<div class="member-profile-error">Không tìm thấy hồ sơ thành viên.</div>';
    return;
  }

  const roleLabel = POSITION_LABELS[String(person.role || '').toUpperCase()] || (person.role === 'ADMIN' ? 'Quản trị tổ chức' : 'Thành viên');
  content.innerHTML = `<div class="member-profile-hero"><div class="member-profile-avatar">${esc(initials(person.name))}</div><div class="member-profile-heading"><span class="member-profile-eyebrow">THÀNH VIÊN SAOVN</span><h2 id="memberProfileName">${esc(person.name)}</h2><p>${esc(person.position)}</p><span class="member-profile-status">${esc(person.status === 'ACTIVE' ? 'Đang hoạt động' : person.status)}</span></div></div><div class="member-profile-grid"><div><span>VAI TRÒ</span><strong>${esc(roleLabel)}</strong></div><div><span>PHÒNG BAN</span><strong>${esc(person.department)}</strong></div><div><span>TEAM</span><strong>${esc(person.team)}</strong></div><div><span>EMAIL</span><strong>${esc(person.email)}</strong></div><div><span>SỐ ĐIỆN THOẠI</span><strong>${esc(person.phone)}</strong></div><div><span>QUẢN LÝ TRỰC TIẾP</span><strong>${esc(person.managerName)}</strong></div></div><div class="member-profile-actions"><a class="member-profile-chat" href="chat.html?user=${encodeURIComponent(person.uid)}">💬 Nhắn tin</a><a class="member-profile-work" href="work.html">▣ Công việc</a></div>`;
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.classList.remove('open');
  profileModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousBodyOverflow;
}

document.addEventListener('click', event => {
  const target = event.target.closest?.('[data-member-profile]');
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  openProfileModal(target.dataset.memberProfile);
});

function observe() {
  const observer = new MutationObserver(() => {
    enhanceAssigneeText(document);
    enhanceDetail(document.getElementById('detailBody'));
    enhanceComments(document.getElementById('detailBody') || document);
  });
  observer.observe(document.body, { childList:true, subtree:true });
  enhanceAssigneeText(document);
  enhanceComments(document);
}

function injectProfileStyles() {
  if (document.getElementById('memberProfileModalStyles')) return;
  const style = document.createElement('style');
  style.id = 'memberProfileModalStyles';
  style.textContent = `.work-member-link{color:#dce9ff!important;text-decoration:none!important;font-weight:800;cursor:pointer;border-bottom:1px solid rgba(69,151,255,.28);transition:color .16s ease,border-color .16s ease}.work-member-link:hover{color:#61adff!important;border-bottom-color:#61adff}.comment .work-member-link{font-size:inherit}.member-profile-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.member-profile-modal.open{display:flex}.member-profile-backdrop{position:absolute;inset:0;background:rgba(2,6,17,.54);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.member-profile-dialog{position:relative;z-index:1;width:min(680px,94vw);max-height:min(720px,88vh);overflow:auto;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:28px;background:linear-gradient(145deg,rgba(13,25,45,.82),rgba(5,12,25,.76));box-shadow:0 35px 110px rgba(0,0,0,.55),0 0 60px rgba(37,135,255,.08);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px)}.member-profile-close{position:absolute;right:16px;top:14px;width:36px;height:36px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.04);color:#aebbd0;font-size:24px;line-height:1;cursor:pointer}.member-profile-hero{display:flex;align-items:center;gap:18px;padding-right:42px}.member-profile-avatar{width:78px;height:78px;flex:0 0 78px;display:grid;place-items:center;border-radius:22px;background:linear-gradient(145deg,#1b55a8,#7257d9);color:#fff;font-size:23px;font-weight:900}.member-profile-heading{min-width:0}.member-profile-eyebrow{display:block;margin-bottom:7px;color:#7188a7;font-size:7px;letter-spacing:.16em;font-weight:800}.member-profile-heading h2{margin:0;color:#edf4ff;font-size:24px;line-height:1.18;overflow-wrap:anywhere}.member-profile-heading p{margin:6px 0 0;color:#94a7c2;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.member-profile-status{display:inline-flex;margin-top:10px;padding:5px 9px;border:1px solid rgba(0,230,118,.12);border-radius:999px;background:rgba(0,230,118,.08);color:#56efa0;font-size:7px}.member-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:24px}.member-profile-grid>div{min-width:0;padding:14px 15px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.member-profile-grid span{display:block;margin-bottom:7px;color:#667791;font-size:7px;letter-spacing:.11em}.member-profile-grid strong{display:block;color:#dce6f6;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.member-profile-actions{display:flex;gap:9px;margin-top:18px}.member-profile-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;box-sizing:border-box;border-radius:10px;text-decoration:none;font-size:9px;font-weight:800}.member-profile-chat{background:#1673ef;color:#fff;border:1px solid #2587ff55}.member-profile-work{background:rgba(255,255,255,.04);color:#dce6f6;border:1px solid rgba(255,255,255,.1)}.member-profile-loading,.member-profile-error{padding:50px 20px;text-align:center;color:#91a2bb;font-size:10px}@media(max-width:560px){.member-profile-dialog{padding:20px;border-radius:20px}.member-profile-hero{align-items:flex-start}.member-profile-avatar{width:62px;height:62px;flex-basis:62px;border-radius:18px}.member-profile-heading h2{font-size:19px}.member-profile-grid{grid-template-columns:1fr}.member-profile-actions{flex-wrap:wrap}.member-profile-actions a{flex:1;min-width:130px}}`;
  document.head.appendChild(style);
}

loadPeople().then(() => {
  ensureProfileModal();
  observe();
});
