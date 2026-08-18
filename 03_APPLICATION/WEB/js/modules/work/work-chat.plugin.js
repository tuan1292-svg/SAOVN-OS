import { registerModule, getModule, assertDependency, moduleHealth } from '../../core/module-registry.js';

const MODULE_ID = 'WORK.CHAT';

export const WORK_CHAT_CAPABILITIES = Object.freeze([
  'WORK.CHAT.READ',
  'WORK.CHAT.CREATE',
  'WORK.CHAT.UPDATE',
  'WORK.CHAT.DELETE'
]);

export const WORK_CHAT_CONTRACT = Object.freeze({
  id: MODULE_ID,
  parentId: 'WORK',
  version: '1.0.0',
  status: 'ACTIVE',
  dependencies: ['WORK.TASK'],
  capabilities: WORK_CHAT_CAPABILITIES,
  dataOwner: 'workTasks/{taskId}/chat',
  permissionNamespace: 'WORK.CHAT.*',
  load: async () => ({ id: MODULE_ID, status: 'READY' })
});

export function registerWorkChat() {
  if (!getModule(MODULE_ID)) registerModule(WORK_CHAT_CONTRACT);
  return getModule(MODULE_ID);
}

export function assertWorkChatDependencies() {
  assertDependency(MODULE_ID, 'WORK.TASK');
}

export async function loadWorkChat() {
  registerWorkChat();
  try {
    assertWorkChatDependencies();
    const module = getModule(MODULE_ID);
    const instance = await module.load();
    moduleHealth(MODULE_ID, 'READY', 'WORK.CHAT loaded through module contract');
    return { ...module, ...instance };
  } catch (error) {
    moduleHealth(MODULE_ID, 'FAILED', error?.message || String(error));
    throw error;
  }
}

export function mountWorkChat({ taskId, host } = {}) {
  registerWorkChat();
  if (!taskId || !host) throw new Error('WORK.CHAT requires taskId and host');
  return { id: MODULE_ID, taskId, host, status: 'READY_CONTRACT_ONLY' };
}
