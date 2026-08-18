import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.COMMENTS',
  parentId: 'WORK',
  dependencies: ['WORK.TASK', 'CORE.IDENTITY'],
  capabilities: ['WORK.COMMENTS.READ', 'WORK.COMMENTS.CREATE', 'WORK.COMMENTS.UPDATE', 'WORK.COMMENTS.DELETE'],
  owns: ['workTasks/{taskId}/comments'],
  legacyEntry: 'work-collab.js'
});

try {
  await import('../../../work-collab.js');
  moduleHealth('WORK.COMMENTS', 'ready');
} catch (error) {
  moduleHealth('WORK.COMMENTS', 'failed', error?.message || String(error));
  console.error('[WORK.COMMENTS] plugin failed', error);
}
