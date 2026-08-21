import { auth } from './firebase-config.js';

const clean = value => String(value ?? '').trim();
const teamList = document.getElementById('teamList');

function openMember(uid) {
  if (!uid) return;
  const url = new URL('members.html', location.href);
  url.searchParams.set('memberId', uid);
  location.href = url.toString();
}

function wireLegacyTeamMembers() {
  if (!teamList) return;
  teamList.querySelectorAll('.team-members > span').forEach(span => {
    if (span.dataset.memberLink === '1') return;
    const name = clean(span.querySelector('b')?.textContent);
    if (!name) return;
    const uid = clean(span.dataset.memberId || span.getAttribute('data-member-id'));
    if (!uid) return;
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

auth.onAuthStateChanged(user => {
  if (!user || !teamList) return;
  wireLegacyTeamMembers();
  new MutationObserver(wireLegacyTeamMembers).observe(teamList, { childList: true, subtree: true });
});
