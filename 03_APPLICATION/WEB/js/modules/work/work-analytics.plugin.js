import { registerModule, moduleHealth } from '../../core/module-registry.js';

registerModule({
  id: 'WORK.ANALYTICS',
  parentId: 'WORK',
  dependencies: ['WORK.TASK', 'CORE.MEMBERSHIP'],
  capabilities: ['WORK.ANALYTICS.READ'],
  owns: ['derived Work analytics'],
  legacyEntry: 'work-analytics.js',
  optional: true
});

try {
  await import('../../../work-analytics.js');
  moduleHealth('WORK.ANALYTICS', 'ready');
} catch (error) {
  moduleHealth('WORK.ANALYTICS', 'failed', error?.message || String(error));
  console.warn('[WORK.ANALYTICS] optional plugin failed; Work core remains available', error);
}
