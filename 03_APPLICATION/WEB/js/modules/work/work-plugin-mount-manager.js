import { onWorkEvent } from './work-host-bridge.js';
import { loadWorkPlugin } from './work-plugin-host.js';

const mounted = new Map();
let started = false;
let unsubscribe = null;

async function mountForTask(taskId, host) {
  if (!taskId || !host || mounted.has(taskId)) return;

  try {
    const plugin = await loadWorkPlugin('WORK.CHAT');
    if (!plugin) return;
    mounted.set(taskId, { taskId, host, plugin, mountedAt: Date.now() });
  } catch (error) {
    console.warn('[WORK.PLUGINS] Optional plugin mount skipped:', error);
  }
}

export function startWorkPluginMountManager() {
  if (started) return unsubscribe;
  started = true;
  unsubscribe = onWorkEvent('task-opened', ({ taskId, host }) => {
    if (taskId && host) void mountForTask(taskId, host);
  });
  return unsubscribe;
}

export function stopWorkPluginMountManager() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  started = false;
  mounted.clear();
}

export function getMountedWorkPlugins() {
  return [...mounted.values()].map(item => ({ taskId: item.taskId, mountedAt: item.mountedAt }));
}
