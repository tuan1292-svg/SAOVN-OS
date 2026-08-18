import '../../core/module-registry.js';
import '../work/work-task.plugin.js';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "../../firebase-config.js";
import { registerModule, assertDependency, moduleHealth } from "../../core/module-registry.js";

const MODULE_ID = 'WORK.CHECKLIST';
registerModule({
  id: MODULE_ID,
  parentId: 'WORK',
  status: 'ACTIVE',
  capabilities: ['READ', 'CREATE', 'UPDATE'],
  dependencies: ['WORK.TASK'],
  owns: ['workTasks/{taskId}/checklist/{itemId}']
});
assertDependency(MODULE_ID, 'WORK.TASK');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const timestamp = value => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
};
const taskSubcollection = taskId => collection(db, 'workTasks', taskId, 'checklist');

export function createChecklistPanel() {
  return `<section class="collab-panel" data-work-plugin="WORK.CHECKLIST"><div class="collab-head"><div><span class="eyebrow">TASK / CHECKLIST</span><strong>Checklist</strong></div><span data-check-progress>0 / 0</span></div><div class="check-add"><input data-check-input maxlength="160" placeholder="Thêm một việc cần làm..."><button data-add-check type="button">＋</button></div><div data-check-list><span class="loading">Đang tải...</span></div></section>`;
}

export async function mountChecklist(taskId, root) {
  if (!taskId || !root) return;
  const input = root.querySelector('[data-check-input]');
  const add = root.querySelector('[data-add-check]');
  input?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); addChecklist(taskId, root); }
  });
  add?.addEventListener('click', () => addChecklist(taskId, root));
  await loadChecklist(taskId, root);
}

async function loadChecklist(taskId, root) {
  const box = root.querySelector('[data-check-list]');
  const progress = root.querySelector('[data-check-progress]');
  try {
    const snapshot = await getDocs(taskSubcollection(taskId));
    const items = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => timestamp(a.createdAt) - timestamp(b.createdAt));
    progress.textContent = `${items.filter(item => item.done).length} / ${items.length}`;
    if (!items.length) { box.innerHTML = '<span class="loading">Chưa có mục nào. Thêm checklist đầu tiên.</span>'; moduleHealth(MODULE_ID, 'ready'); return; }
    box.innerHTML = items.map(item => `<label class="check-item"><input type="checkbox" data-check-id="${esc(item.id)}" ${item.done ? 'checked' : ''}><span class="check-mark"></span><span class="check-text ${item.done ? 'completed' : ''}">${esc(item.text)}</span></label>`).join('');
    box.querySelectorAll('[data-check-id]').forEach(control => control.addEventListener('change', async () => {
      try {
        await updateDoc(doc(db, 'workTasks', taskId, 'checklist', control.dataset.checkId), { done: control.checked, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
        await loadChecklist(taskId, root);
      } catch (error) {
        console.warn('Không thể cập nhật checklist:', error?.code || error);
        control.checked = !control.checked;
        alert('Không thể cập nhật checklist. Bạn không có quyền với công việc này.');
        moduleHealth(MODULE_ID, 'degraded', error?.code || 'update-failed');
      }
    }));
    moduleHealth(MODULE_ID, 'ready');
  } catch (error) {
    console.warn('Không tải được checklist:', error?.code || error);
    box.innerHTML = '<span class="loading">Checklist chưa có hoặc tài khoản chưa được cấp quyền cộng tác.</span>';
    moduleHealth(MODULE_ID, 'degraded', error?.code || 'read-failed');
  }
}

async function addChecklist(taskId, root) {
  const input = root.querySelector('[data-check-input]');
  const text = input?.value.trim();
  if (!text) return;
  input.disabled = true;
  try {
    await addDoc(taskSubcollection(taskId), { text, done: false, createdBy: auth.currentUser?.uid || null, createdAt: serverTimestamp() });
    input.value = '';
    await loadChecklist(taskId, root);
  } catch (error) {
    console.warn('Không thể thêm checklist:', error?.code || error);
    alert('Không thể thêm checklist. Tài khoản chưa có quyền với công việc này.');
    moduleHealth(MODULE_ID, 'degraded', error?.code || 'create-failed');
  } finally { input.disabled = false; input.focus(); }
}
