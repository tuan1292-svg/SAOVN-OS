import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let people = [];
let peopleByName = new Map();

async function loadPeople() {
  try {
    const identitySnap = await getDocs(query(collection(db, 'identities'), where('status', '==', 'ACTIVE')));
    let memberships = new Map();
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
    people = identitySnap.docs.map(s => {
      const d = s.data() || {}, m = memberships.get(s.id) || {};
      return {
        uid: s.id,
        name: d.fullName || d.displayName || d.name || d.email || s.id,
        position: m.position || d.position || d.jobTitle || 'STAFF',
        department: m.department || d.department || '',
        team: m.team || d.team || ''
      };
    });
    people.forEach(p => peopleByName.set(normalize(p.name), p));
  } catch (error) {
    console.warn('Work member links bootstrap skipped:', error?.code || error);
  }
}

function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function profileUrl(uid) { return `member-profile.html?id=${encodeURIComponent(uid)}`; }
function linkFor(person) { return `<a class="work-member-link" href="${profileUrl(person.uid)}" data-member-profile="${esc(person.uid)}">${esc(person.name)}</a>`; }

function enhanceAssigneeText(root) {
  if (!root) return;
  root.querySelectorAll('.assignee, .kanban-assignee').forEach(el => {
    if (el.dataset.memberLinksReady === '1') return;
    const raw = el.textContent || '';
    const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
    if (!parts.length) return;
    const html = parts.map(part => {
      const name = part.split(' · ')[0].trim();
      const person = peopleByName.get(normalize(name));
      if (!person) return esc(part);
      const suffix = part.slice(name.length);
      return `${linkFor(person)}${esc(suffix)}`;
    }).join(', ');
    el.innerHTML = html;
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

function observe() {
  const observer = new MutationObserver(() => {
    enhanceAssigneeText(document);
    enhanceDetail(document.getElementById('detailBody'));
  });
  observer.observe(document.body, { childList:true, subtree:true });
  enhanceAssigneeText(document);
}

loadPeople().then(observe);
