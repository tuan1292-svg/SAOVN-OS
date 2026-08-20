import { auth, db } from './firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const clean = value => String(value ?? '').trim();
const key = value => clean(value).toLocaleLowerCase('vi');
const teamList = document.getElementById('teamList');
let directory = new Map();

async function loadDirectory() {
  const map = new Map();
  try {
    const identities = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    identities.docs.forEach(snapshot => {
      const data = snapshot.data() || {};
      const name = clean(data.fullName || data.displayName || data.name || data.email);
      if (name) map.set(key(name), snapshot.id);
    });
  } catch (error) {
    console.warn('[TEAM-MEMBER-LINKS] identity directory skipped:', error?.code || error);
  }

  try {
    const memberships = await getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')));
    memberships.docs.forEach(snapshot => {
      const data = snapshot.data() || {};
      const uid = clean(data.identityId || data.userId || data.uid || snapshot.id.match(/^mem_(.+)_org_/)?.[1]);
      const name = clean(data.fullName || data.displayName || data.name || data.email);
      if (uid && name && !map.has(key(name))) map.set(key(name), uid);
    });
  } catch (error) {
    console.warn('[TEAM-MEMBER-LINKS] membership directory skipped:', error?.code || error);
  }

  directory = map;
}

function wireLegacyTeamMembers() {
  if (!teamList) return;

  // Canonical Team buttons are owned by department-workspace-members.js.
  // This adapter only repairs legacy <span> output from the old renderer.
  teamList.querySelectorAll('.team-members > span').forEach(span => {
    if (span.dataset.memberLink === '1') return;
    const name = clean(span.querySelector('b')?.textContent);
    const uid = directory.get(key(name));
    if (!uid) return;

    span.dataset.memberLink = '1';
    span.dataset.memberId = uid;
    span.classList.add('member-link');
    span.tabIndex = 0;
    span.setAttribute('role', 'button');
    span.setAttribute('aria-label', `Mở hồ sơ ${name}`);
  });
}

async function bootstrap() {
  if (!teamList) return;
  await loadDirectory();
  wireLegacyTeamMembers();
  new MutationObserver(wireLegacyTeamMembers).observe(teamList, { childList: true, subtree: true });
}

auth.onAuthStateChanged(user => { if (user) bootstrap(); });
