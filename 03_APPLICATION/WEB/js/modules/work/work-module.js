import { moduleHealth, listModules } from '../../core/module-registry.js';
import { assertWorkBoundary } from './work-module-contract.js';

// Child plugins are bootstrapped in dependency order. Each plugin owns its
// registration and runtime health; a failed optional child must not abort Work.
const plugins = [
  './work-task.plugin.js',
  './work-checklist.plugin.js',
  './work-comments.plugin.js',
  './work-mentions.plugin.js',
  './work-analytics.plugin.js'
];

for (const plugin of plugins) {
  try {
    await import(plugin);
  } catch (error) {
    console.error(`[WORK] plugin bootstrap failed: ${plugin}`, error);
  }
}

// Composition adapter: this owns the Work detail mounting surface only.
try {
  await import('../../../work-collab.js');
} catch (error) {
  console.error('[WORK] detail composition failed', error);
}

// Compatibility adapters remain outside child plugin ownership during migration.
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
  const modules = listModules('WORK');
  console.info('[SAOVN-OS] Work plugin registry ready', modules.map(m => `${m.id}:${m.status || 'registered'}`));
  moduleHealth('WORK', 'ready', `${modules.length} child plugins registered; boundary=${boundary.ok}`);
} catch (error) {
  moduleHealth('WORK', 'failed', error?.message || String(error));
  console.error('[WORK] boundary contract failed', error);
}
