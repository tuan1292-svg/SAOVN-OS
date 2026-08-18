import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.TASK',
  parentId: 'WORK',
  dependencies: ['CORE.AUTH', 'CORE.IDENTITY', 'CORE.MEMBERSHIP', 'CORE.PERMISSION'],
  capabilities: ['WORK.TASK.READ', 'WORK.TASK.CREATE', 'WORK.TASK.UPDATE', 'WORK.TASK.DELETE'],
  owns: ['workTasks'],
  entry: './../../../work-v3.js'
});

try {
  await import('../../../work-v3.js');
  moduleHealth('WORK.TASK', 'ready');
} catch (error) {
  moduleHealth('WORK.TASK', 'failed', error?.message || String(error));
  console.error('[WORK.TASK] plugin failed', error);
}
