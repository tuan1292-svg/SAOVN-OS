import { auth } from './firebase-config.js';

const clean = value => String(value ?? '').trim();
const teamList = document.getElementById('teamList');

function openMember(uid) {
  if (!uid) return;
  const url = new URL('members.html', location.href);
  url.searchParams.set('memberId', uid);
  location.href = url.toString();
}

async function loadDirectoryIndex() {
  const { db } = await import('./firebase-config.js');
  const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js');
  const index = new Map();
  try {
    const [identities, memberships] = await Promise.all([
      getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE'))),
      getDocs(query(collection(db, 'memberships'), where('status', '==', 'ACTIVE')))
    ]);
    identities.forEach(s => {
      const d = s.data() || {};
      const name = clean(d.fullName || d.displayName || d.name || d.email);
      if (name) index.set(name.toLowerCase(), s.id);
    });
    memberships.forEach(s => {
      const d = s.data() || {};
      const uid = d.userId || d.identityId || d.uid || '';
      if (!uid) return;
      const name = clean(d.fullName || d.displayName || d.name || '');
      if (name) index.set(name.toLowerCase(), uid);
    });
  } catch (error) {
    console.warn('Team member directory link lookup skipped:', error?.code || error);
  }
  return index;
}

async function wireLegacyTeamMembers(index) {
  if (!teamList) return;
  teamList.querySelectorAll('.team-members > span').forEach(span => {
    if (span.dataset.memberLink === '1') return;
    const name = clean(span.querySelector('b')?.textContent);
    if (!name) return;
    const uid = clean(span.dataset.memberId || span.getAttribute('data-member-id')) || index?.get(name.toLowerCase()) || '';
    if (!uid) return;
    span.dataset.memberId = uid;
    span.dataset.memberLink = '1';
    span.classList.add('member-link');
    span.tabIndex = 0;
    span.setAttribute('role', 'button');
    span.setAttribute('aria-label', `Mở hồ sơ ${name}`);
    span.addEventListener('click', event => { event.preventDefault(); openMember(uid); });
    span.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openMember(uid); }
    });
  });
}

auth.onAuthStateChanged(async user => {
  if (!user || !teamList) return;
  const index = await loadDirectoryIndex();
  await wireLegacyTeamMembers(index);
  new MutationObserver(() => wireLegacyTeamMembers(index)).observe(teamList, { childList: true, subtree: true });
});
