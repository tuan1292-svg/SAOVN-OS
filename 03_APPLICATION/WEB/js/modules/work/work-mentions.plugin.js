import { collection, getDoc, doc, serverTimestamp, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { auth, db } from '../../firebase-config.js';
import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.MENTIONS',
  parentId: 'WORK',
  dependencies: ['WORK.TASK', 'WORK.COMMENTS', 'CORE.IDENTITY', 'CORE.NOTIFICATION'],
  capabilities: ['WORK.MENTIONS.RESOLVE', 'WORK.MENTIONS.CREATE'],
  owns: ['mention resolution', 'WORK_MENTION notification event'],
  legacyEntry: 'work-mentions.js'
});

const memberRef = uid => doc(db, 'memberships', `mem_${uid}_org_saovn_01`);
const taskRef = id => doc(db, 'workTasks', id);

async function loadPerson(uid) {
  try {
    const snap = await getDoc(doc(db, 'identities', uid));
    if (snap.exists()) {
      const d = snap.data() || {};
      return { uid, name: d.fullName || d.displayName || d.name || d.email || 'Thành viên', position: d.position || d.jobTitle || 'Nhân viên' };
    }
  } catch (error) { if (error?.code !== 'permission-denied') console.warn('[WORK.MENTIONS] identity skipped', error); }
  try {
    const snap = await getDoc(memberRef(uid));
    if (snap.exists()) {
      const d = snap.data() || {};
      return { uid, name: d.fullName || d.displayName || d.name || d.email || 'Thành viên', position: d.position || d.jobTitle || 'Nhân viên' };
    }
  } catch (error) { if (error?.code !== 'permission-denied') console.warn('[WORK.MENTIONS] membership skipped', error); }
  return null;
}

export async function resolveEligiblePeople(taskId) {
  const snap = await getDoc(taskRef(taskId));
  if (!snap.exists()) return [];
  const task = snap.data() || {};
  const ids = new Set(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  if (task.assigneeId) ids.add(task.assigneeId);
  if (task.createdBy) ids.add(task.createdBy);
  ids.delete(auth.currentUser?.uid);
  const result = [];
  for (const uid of ids) { const person = await loadPerson(uid); if (person) result.push(person); }
  return result;
}

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'); }

export function parseMentions(text, eligiblePeople) {
  const people = Array.isArray(eligiblePeople) ? eligiblePeople : [];
  const allPattern = /(?:^|\s)@(tất cả thành viên|tat ca thanh vien|tất cả|tat ca|all)(?=\s|$|[,.!?;:])/i;
  if (allPattern.test(text)) return [...people];
  return people.filter(person => new RegExp(`@${escapeRegExp(person.name)}(?=\\s|$|[,.!?;:])`, 'i').test(text));
}

export async function notifyMentions(mentions, { senderName, taskId, taskTitle }) {
  await Promise.allSettled((mentions || []).map(person => addDoc(collection(db, 'notifications', person.uid, 'items'), {
    type: 'WORK_MENTION', title: 'Bạn đang được nhắc đến trong Work',
    body: `${senderName} đã nhắc đến bạn trong “${taskTitle || 'Công việc'}”.`,
    senderId: auth.currentUser?.uid || null, recipientId: person.uid, taskId,
    targetUrl: `work.html?task=${encodeURIComponent(taskId)}`, read: false, createdAt: serverTimestamp()
  })));
}

moduleHealth('WORK.MENTIONS', 'ready');
