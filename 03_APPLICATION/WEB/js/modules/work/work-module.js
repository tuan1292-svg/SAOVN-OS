import { moduleHealth, listModules } from '../../core/module-registry.js';
import { assertWorkBoundary } from './work-module-contract.js';
import { runWorkRegressionChecks } from './work-regression.js';
import { isWorkModuleEnabled } from './work-module-manifest.js';

// Core Work plugins are bootstrapped in dependency order. Optional plugins are
// activated only when their manifest switch is true.
const plugins = [
  ['WORK.TASK', './work-task.plugin.js'],
  ['WORK.CHECKLIST', './work-checklist.plugin.js'],
  ['WORK.COMMENTS', './work-comments.plugin.js'],
  ['WORK.MENTIONS', './work-mentions.plugin.js'],
  ['WORK.ANALYTICS', './work-analytics.plugin.js'],
  ['WORK.CHAT', './work-chat.plugin.js']
];

for (const [id, plugin] of plugins) {
  if (!isWorkModuleEnabled(id)) continue;
  try {
    await import(plugin);
  } catch (error) {
    console.error(`[WORK] plugin bootstrap failed: ${id}`, error);
  }
}

try {
  await import('../../../work-collab.js');
} catch (error) {
  console.error('[WORK] detail composition failed', error);
}

const compatibility = [
  '../../../work-member-links.js',
  '../../../work-deep-link.js',
  '../../../permissions.js',
  '../../../work-assignee-migration.js',
  '../../../work-member-firebase-fix.js'
];

for (const entry of compatibility) {
  try {
    await import(entry);
  } catch (error) {
    console.warn(`[WORK] compatibility adapter failed: ${entry}`, error);
  }
}

try {
  const boundary = assertWorkBoundary();
  const regression = runWorkRegressionChecks();
  const modules = listModules('WORK');

  if (!regression.ok) {
    moduleHealth('WORK', 'failed', regression.errors.join('; '));
    console.error('[WORK] regression gate failed', regression.errors);
  } else {
    console.info('[SAOVN-OS] Work plugin registry ready', modules.map(m => `${m.id}:${m.status || 'registered'}`));
    moduleHealth('WORK', 'ready', `${modules.length} child plugins registered; boundary=${boundary.ok}; regression=${regression.ok}`);
  }
} catch (error) {
  moduleHealth('WORK', 'failed', error?.message || String(error));
  console.error('[WORK] boundary/regression gate failed', error);
}
