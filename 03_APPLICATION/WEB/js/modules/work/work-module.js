import { moduleHealth, listModules } from '../../core/module-registry.js';

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

// Compatibility adapters remain outside child plugin ownership during migration.
// They are intentionally loaded only after the plugin boundary has been bootstrapped.
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

const modules = listModules('WORK');
console.info('[SAOVN-OS] Work plugin registry ready', modules.map(m => m.id));
moduleHealth('WORK', 'ready', `${modules.length} child plugins registered`);
