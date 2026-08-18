import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { db } from '../../firebase-config.js';
import { getModule, assertDependency } from '../../core/module-registry.js';
import { registerWorkChat, assertWorkChatDependencies } from './work-chat.plugin.js';

const MODULE_ID = 'WORK.CHAT';

function taskChatRef(taskId) {
  if (!taskId) throw new Error('WORK.CHAT requires taskId');
  return collection(db, 'workTasks', taskId, 'chat');
}

function assertReady() {
  registerWorkChat();
  assertWorkChatDependencies();
  const module = getModule(MODULE_ID);
  if (!module) throw new Error('WORK.CHAT is not registered');
}

export async function listWorkChatMessages(taskId, maxMessages = 100) {
  assertReady();
  const snap = await getDocs(query(taskChatRef(taskId), orderBy('createdAt', 'asc'), limit(maxMessages)));
  return snap.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function createWorkChatMessage(taskId, { senderId, senderName = '', text = '', mentions = [] } = {}) {
  assertReady();
  if (!senderId) throw new Error('WORK.CHAT message requires senderId');
  const cleanText = String(text || '').trim();
  if (!cleanText) throw new Error('WORK.CHAT message cannot be empty');
  const payload = {
    taskId,
    senderId,
    senderName,
    text: cleanText,
    mentions: Array.isArray(mentions) ? mentions : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const created = await addDoc(taskChatRef(taskId), payload);
  return { id: created.id, ...payload };
}

export async function updateWorkChatMessage(taskId, messageId, { text } = {}) {
  assertReady();
  const cleanText = String(text || '').trim();
  if (!cleanText) throw new Error('WORK.CHAT message cannot be empty');
  await updateDoc(doc(db, 'workTasks', taskId, 'chat', messageId), { text: cleanText, updatedAt: serverTimestamp() });
  return { id: messageId, taskId, text: cleanText };
}

export async function deleteWorkChatMessage(taskId, messageId) {
  assertReady();
  await deleteDoc(doc(db, 'workTasks', taskId, 'chat', messageId));
  return { id: messageId, taskId, deleted: true };
}
