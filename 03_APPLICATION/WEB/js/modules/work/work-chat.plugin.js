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
  status: 'PLANNED',
  dependencies: ['WORK.TASK', 'CORE.IDENTITY', 'CORE.NOTIFICATION'],
  capabilities: WORK_CHAT_CAPABILITIES,
  dataOwner: 'workTasks/{taskId}/chat',
  permissionNamespace: 'WORK.CHAT.*'
});

export function registerWorkChat() {
  if (!getModule(MODULE_ID)) registerModule(WORK_CHAT_CONTRACT);
  return getModule(MODULE_ID);
}

export function assertWorkChatDependencies() {
  assertDependency(MODULE_ID, 'WORK.TASK');
  assertDependency(MODULE_ID, 'CORE.IDENTITY');
  assertDependency(MODULE_ID, 'CORE.NOTIFICATION');
}

export function mountWorkChat({ taskId, host } = {}) {
  registerWorkChat();
  try {
    assertWorkChatDependencies();
    if (!taskId || !host) throw new Error('WORK.CHAT requires taskId and host');
    moduleHealth(MODULE_ID, 'ready', 'contract registered; UI adapter not yet enabled');
    return { id: MODULE_ID, taskId, host, status: 'READY_CONTRACT_ONLY' };
  } catch (error) {
    moduleHealth(MODULE_ID, 'failed', error?.message || String(error));
    return { id: MODULE_ID, taskId, host, status: 'FAILED', error };
  }
}
