import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.MENTIONS',
  parentId: 'WORK',
  dependencies: ['WORK.TASK', 'WORK.COMMENTS', 'CORE.IDENTITY', 'CORE.NOTIFICATION'],
  capabilities: ['WORK.MENTIONS.RESOLVE', 'WORK.MENTIONS.CREATE'],
  owns: ['workTasks/{taskId}/mentions'],
  legacyEntry: 'work-mentions.js'
});

try {
  await import('../../../work-mentions.js');
  moduleHealth('WORK.MENTIONS', 'ready');
} catch (error) {
  moduleHealth('WORK.MENTIONS', 'failed', error?.message || String(error));
  console.error('[WORK.MENTIONS] plugin failed', error);
}
