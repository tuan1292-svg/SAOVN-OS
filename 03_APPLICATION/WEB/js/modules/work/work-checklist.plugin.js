import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.CHECKLIST',
  parentId: 'WORK',
  dependencies: ['WORK.TASK'],
  capabilities: ['WORK.CHECKLIST.READ', 'WORK.CHECKLIST.CREATE', 'WORK.CHECKLIST.UPDATE', 'WORK.CHECKLIST.DELETE'],
  owns: ['workTasks/{taskId}/checklist'],
  legacyEntry: 'work-collab.js'
});

try {
  await import('../../../work-collab.js');
  moduleHealth('WORK.CHECKLIST', 'ready');
} catch (error) {
  moduleHealth('WORK.CHECKLIST', 'failed', error?.message || String(error));
  console.error('[WORK.CHECKLIST] plugin failed', error);
}
