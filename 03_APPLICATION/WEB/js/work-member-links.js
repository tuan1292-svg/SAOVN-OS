import { collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from './firebase-config.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials = value => String(value || '').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase().slice(0,2) || 'TV';
const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const profileUrl = uid => `member-profile.html?id=${encodeURIComponent(uid)}`;
const labels = {
  FOUNDER_CHAIRMAN_CEO:'Founder · Chairman · CEO',
  INTERN:'Thực tập sinh',
  COLLABORATOR:'Cộng tác viên',
  STAFF:'Nhân viên',
  SPECIALIST:'Chuyên viên',
  SENIOR_SPECIALIST:'Chuyên viên cao cấp',
  TEAM_LEAD:'Trưởng nhóm',
  MANAGER:'Quản lý',
  DEPARTMENT_HEAD:'Trưởng phòng',
  DIRECTOR:'Giám đốc',
  OTHER:'Khác'
};

let peopleByName = new Map();
let peopleByUid = new Map();
let profileModal = null;
let previousBodyOverflow = '';

async function loadPeople() {
  try {
    const identitySnap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    const memberships = new Map();
    try {
      const membershipSnap = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
      membershipSnap.forEach(s => {
        const d = s.data() || {};
        const uid = d.identityId || d.userId || d.uid || s.id.match(/^mem_(.+)_org_/)?.[1];
        if (uid) memberships.set(uid, d);
      });
    } catch (error) {
      console.warn('Work member links: memberships unavailable, using identities.', error?.code || error);
    }

    identitySnap.docs.forEach(s => {
      const d = s.data() || {};
      const m = memberships.get(s.id) || {};
      const name = d.fullName || d.displayName || d.name || d.email || s.id;
      const person = {
        uid: s.id,
        name,
        identity: d,
        membership: m,
        position: labels[m.position || d.position || d.jobTitle] || m.position || d.position || d.jobTitle || 'Nhân viên',
        department: m.department || d.department || 'Chưa phân phòng ban',
        team: m.team || d.team || 'Chưa phân Team',
        email: d.email || m.email || 'Chưa cập nhật',
        phone: d.phone || d.phoneNumber || d.mobile || d.mobileNumber || m.phone || m.phoneNumber || m.mobile || m.mobileNumber || 'Chưa cập nhật',
        managerName: m.managerName || d.managerName || 'Chưa cập nhật',
        role: m.roles?.system ? Object.keys(m.roles.system).find(k => m.roles.system[k]) || 'MEMBER' : m.role || 'MEMBER',
        status: m.status || d.status || 'ACTIVE'
      };
      peopleByName.set(normalize(name), person);
      peopleByUid.set(s.id, person);
    });
  } catch (error) {
    console.warn('Work member links bootstrap skipped:', error?.code || error);
  }
}

function linkFor(person) {
  return `<a class="work-member-link" href="${profileUrl(person.uid)}" data-member-profile="${esc(person.uid)}">${esc(person.name)}</a>`;
}

function enhanceAssigneeText(root) {
  if (!root) return;
  root.querySelectorAll('.assignee, .kanban-assignee').forEach(el => {
    if (el.dataset.memberLinksReady === '1') return;
    const raw = el.textContent || '';
    const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
    if (!parts.length) return;
    el.innerHTML = parts.map(part => {
      const name = part.split(' · ')[0].trim();
      const person = peopleByName.get(normalize(name));
      return person ? linkFor(person) : esc(name);
    }).join(', ');
    el.dataset.memberLinksReady = '1';
  });
}

function enhanceDetail(root) {
  if (!root) return;
  const summary = root.querySelector('.detail-summary');
  if (!summary || summary.dataset.memberLinksReady === '1') return;
  const first = summary.querySelector('div:first-child strong');
  if (!first) return;
  const raw = first.textContent || '';
  const names = raw.split(',').map(x => x.trim()).filter(Boolean);
  if (!names.length || raw === 'Chưa giao') return;
  first.innerHTML = names.map(name => {
    const person = peopleByName.get(normalize(name));
    return person ? linkFor(person) : esc(name);
  }).join(', ');
  first.classList.add('work-member-names');
  summary.dataset.memberLinksReady = '1';
}

function enhanceComments(root) {
  if (!root) return;
  root.querySelectorAll('.comment').forEach(comment => {
    if (comment.dataset.memberLinksReady === '1') return;
    const nameEl = comment.querySelector('strong');
    if (!nameEl) return;
    const rawName = nameEl.textContent?.trim();
    const person = peopleByName.get(normalize(rawName));
    if (!person) return;
    nameEl.outerHTML = linkFor(person);
    comment.dataset.memberLinksReady = '1';
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
  profileModal.addEventListener('click', event => {
    if (event.target.closest('[data-profile-close]')) closeProfileModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && profileModal?.classList.contains('open')) closeProfileModal();
  });
  injectProfileStyles();
  return profileModal;
}

async function openProfileModal(uid) {
  const modal = ensureProfileModal();
  const content = modal.querySelector('#memberProfileContent');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  content.innerHTML = '<div class="member-profile-loading">Đang tải hồ sơ…</div>';

  let person = peopleByUid.get(uid);
  if (!person) {
    try {
      const snap = await getDoc(doc(db, 'identities', uid));
      if (snap.exists()) {
        const d = snap.data() || {};
        person = { uid, name:d.fullName || d.displayName || d.name || d.email || 'Thành viên', identity:d, membership:{}, position:labels[d.position || d.jobTitle] || d.position || d.jobTitle || 'Nhân viên', department:d.department || 'Chưa phân phòng ban', team:d.team || 'Chưa phân Team', email:d.email || 'Chưa cập nhật', phone:d.phone || d.phoneNumber || d.mobile || d.mobileNumber || 'Chưa cập nhật', managerName:d.managerName || 'Chưa cập nhật', role:'MEMBER', status:d.status || 'ACTIVE' };
        peopleByUid.set(uid, person);
      }
    } catch (error) {
      console.warn('Không tải được hồ sơ thành viên:', error?.code || error);
    }
  }

  if (!person) {
    content.innerHTML = '<div class="member-profile-error">Không tìm thấy hồ sơ thành viên.</div>';
    return;
  }

  const roleLabel = labels[String(person.role || '').toUpperCase()] || person.role || 'Thành viên';
  content.innerHTML = `<div class="member-profile-hero"><div class="member-profile-avatar">${esc(initials(person.name))}</div><div class="member-profile-heading"><span class="member-profile-eyebrow">THÀNH VIÊN SAOVN</span><h2 id="memberProfileName">${esc(person.name)}</h2><p>${esc(person.position)}</p><span class="member-profile-status">${esc(person.status === 'ACTIVE' ? 'Đang hoạt động' : person.status)}</span></div></div><div class="member-profile-grid"><div><span>VAI TRÒ</span><strong>${esc(roleLabel)}</strong></div><div><span>PHÒNG BAN</span><strong>${esc(person.department)}</strong></div><div><span>TEAM</span><strong>${esc(person.team)}</strong></div><div><span>EMAIL</span><strong>${esc(person.email)}</strong></div><div><span>SỐ ĐIỆN THOẠI</span><strong>${esc(person.phone)}</strong></div><div><span>QUẢN LÝ TRỰC TIẾP</span><strong>${esc(person.managerName)}</strong></div></div><div class="member-profile-actions"><a class="member-profile-chat" href="chat.html?user=${encodeURIComponent(person.uid)}">💬 Nhắn tin</a><a class="member-profile-work" href="work.html">▣ Công việc</a></div>`;
}

function closeProfileModal() {
  if (!profileModal) return;
  profileModal.classList.remove('open');
  profileModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousBodyOverflow;
}

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
  const s = document.createElement('style');
  s.id = 'memberProfileModalStyles';
  s.textContent = `
.work-member-link{color:#dce9ff;text-decoration:none;font-weight:800;cursor:pointer;border-bottom:1px solid rgba(69,151,255,.28);transition:color .16s ease,border-color .16s ease}.work-member-link:hover{color:#61adff;border-bottom-color:#61adff}.comment .work-member-link{font-size:inherit}.member-profile-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.member-profile-modal.open{display:flex}.member-profile-backdrop{position:absolute;inset:0;background:rgba(2,6,17,.54);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.member-profile-dialog{position:relative;z-index:1;width:min(680px,94vw);max-height:min(720px,88vh);overflow:auto;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:28px;background:linear-gradient(145deg,rgba(13,25,45,.82),rgba(5,12,25,.76));box-shadow:0 35px 110px rgba(0,0,0,.55),0 0 60px rgba(37,135,255,.08);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px)}.member-profile-close{position:absolute;right:16px;top:14px;width:36px;height:36px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.04);color:#aebbd0;font-size:24px;line-height:1;cursor:pointer}.member-profile-close:hover{background:rgba(255,255,255,.09);color:#fff}.member-profile-content{min-width:0}.member-profile-hero{display:flex;align-items:center;gap:18px;padding-right:42px}.member-profile-avatar{width:78px;height:78px;flex:0 0 78px;display:grid;place-items:center;border-radius:22px;background:linear-gradient(145deg,#1b55a8,#7257d9);color:#fff;font-size:23px;font-weight:900;box-shadow:0 12px 30px rgba(37,135,255,.18)}.member-profile-heading{min-width:0}.member-profile-eyebrow{display:block;margin-bottom:7px;color:#7188a7;font-size:7px;letter-spacing:.16em;font-weight:800}.member-profile-heading h2{margin:0;color:#edf4ff;font-size:24px;line-height:1.18;overflow-wrap:anywhere}.member-profile-heading p{margin:6px 0 0;color:#94a7c2;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.member-profile-status{display:inline-flex;margin-top:10px;padding:5px 9px;border:1px solid rgba(0,230,118,.12);border-radius:999px;background:rgba(0,230,118,.08);color:#56efa0;font-size:7px}.member-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:24px}.member-profile-grid>div{min-width:0;padding:14px 15px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.member-profile-grid span{display:block;margin-bottom:7px;color:#667791;font-size:7px;letter-spacing:.11em}.member-profile-grid strong{display:block;color:#dce6f6;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.member-profile-actions{display:flex;gap:9px;margin-top:18px}.member-profile-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;box-sizing:border-box;border-radius:10px;text-decoration:none;font-size:9px;font-weight:800}.member-profile-chat{background:#1673ef;color:#fff;border:1px solid #2587ff55}.member-profile-work{background:rgba(255,255,255,.04);color:#dce6f6;border:1px solid rgba(255,255,255,.1)}.member-profile-loading,.member-profile-error{padding:50px 20px;text-align:center;color:#91a2bb;font-size:10px}@media(max-width:560px){.member-profile-modal{padding:12px}.member-profile-dialog{width:100%;max-height:92vh;padding:20px;border-radius:19px}.member-profile-hero{gap:12px;padding-right:35px}.member-profile-avatar{width:58px;height:58px;flex-basis:58px;border-radius:17px;font-size:17px}.member-profile-heading h2{font-size:18px}.member-profile-heading p{font-size:9px}.member-profile-grid{grid-template-columns:1fr;margin-top:18px}.member-profile-actions{flex-direction:column}.member-profile-actions a{width:100%}}
`;
  document.head.appendChild(s);
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-member-profile]');
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  openProfileModal(target.dataset.memberProfile);
});

loadPeople().then(observe);