import './permissions.js';
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getPermissions, PERMISSIONS } from './permissions.js';
import { listModules } from './core/module-registry.js';

const policyRef = doc(db, 'systemConfig', 'runtime');
const statusEl = document.getElementById('status');
const modulesEl = document.getElementById('modules');
const saveBtn = document.getElementById('save');
const reloadBtn = document.getElementById('reload');

const fallback = {
  version: 1,
  modules: {
    dashboard: { enabled: true }, work: { enabled: true }, departments: { enabled: true }, members: { enabled: true },
    chat: { enabled: true }, notifications: { enabled: true }, projects: { enabled: true }
  }
};

let policy = null;

function setStatus(text) { statusEl.textContent = text; }
function moduleEnabled(id) { return policy?.modules?.[id]?.enabled !== false; }

function render() {
  const modules = listModules();
  modulesEl.innerHTML = modules.map(module => `
    <div class="row">
      <div><strong>${module.label || module.id}</strong><small>${module.id} · ${module.version || '0.0.0'}</small></div>
      <button class="switch ${moduleEnabled(module.id) ? 'on' : ''}" type="button" data-module="${module.id}" aria-label="${moduleEnabled(module.id) ? 'Tắt' : 'Bật'} ${module.label || module.id}"></button>
    </div>`).join('');

  modulesEl.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.module;
    policy.modules ||= {};
    policy.modules[id] = { ...(policy.modules[id] || {}), enabled: !moduleEnabled(id) };
    render();
  }));
}

async function load() {
  setStatus('Đang tải policy…');
  const permissions = await getPermissions();
  if (!permissions.hasPermission?.(PERMISSIONS.SYSTEM_MANAGE) && !permissions.permissions?.has(PERMISSIONS.SYSTEM_MANAGE)) {
    window.location.replace('dashboard.html');
    return;
  }
  const snap = await getDoc(policyRef);
  policy = snap.exists() ? { ...fallback, ...snap.data() } : structuredClone(fallback);
  render();
  setStatus(snap.exists() ? `Policy v${policy.version || 1}` : 'Đang dùng baseline');
}

saveBtn.addEventListener('click', async () => {
  try {
    saveBtn.disabled = true;
    setStatus('Đang lưu…');
    await setDoc(policyRef, { ...policy, updatedAt: serverTimestamp() }, { merge: true });
    setStatus(`Đã lưu policy v${policy.version || 1}`);
  } catch (error) {
    console.error('[SAOVN][CONTROL_PLANE]', error);
    setStatus(error?.code === 'permission-denied' ? 'Firebase từ chối quyền ghi policy' : 'Lưu policy thất bại');
  } finally {
    saveBtn.disabled = false;
  }
});

reloadBtn.addEventListener('click', () => load().catch(error => { console.error(error); setStatus('Không tải được policy'); }));

onAuthStateChanged(auth, user => {
  if (!user) window.location.replace('index.html');
});

load().catch(error => { console.error('[SAOVN][CONTROL_PLANE]', error); setStatus('Không tải được Control Plane'); });
