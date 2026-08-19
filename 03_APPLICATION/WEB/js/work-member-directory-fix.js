import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from './firebase-config.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
const people = new Map();

async function load() {
  try {
    const snap = await getDocs(collection(db, 'identities'));
    snap.forEach(s => {
      const d = s.data() || {};
      const name = d.fullName || d.displayName || d.name || d.email || s.id;
      people.set(norm(name), { id: s.id, name });
      if (d.email) people.set(norm(d.email), { id: s.id, name });
    });
    enhance(document);
  } catch (error) {
    console.warn('[WORK.MEMBER_DIRECTORY_FIX] không tải được identities:', error?.code || error);
  }
}

function makeLink(person) {
  return `<a class="work-member-link" href="member-profile.html?id=${encodeURIComponent(person.id)}" data-member-directory-fix="1">${esc(person.name)}</a>`;
}

function enhance(root) {
  root.querySelectorAll?.('.assignee, .kanban-assignee').forEach(el => {
    if (el.querySelector('[data-member-directory-fix]')) return;
    const raw = el.textContent || '';
    const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
    const html = parts.map(part => {
      const clean = part.replace(/\s+·\s+.*/, '').trim();
      const person = people.get(norm(clean));
      return person ? makeLink(person) : esc(part);
    }).join(', ');
    if (html) el.innerHTML = html;
  });

  root.querySelectorAll?.('.analytics-person a').forEach(a => {
    const name = (a.textContent || '').trim();
    const person = people.get(norm(name));
    if (person) {
      a.href = `member-profile.html?id=${encodeURIComponent(person.id)}`;
      a.dataset.memberDirectoryFix = '1';
    }
  });
}

new MutationObserver(() => enhance(document)).observe(document.body, { childList: true, subtree: true });
load();
