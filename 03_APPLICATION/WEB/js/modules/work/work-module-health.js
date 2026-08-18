import { getWorkPluginHealth, getWorkPluginList } from './work-plugin-host.js';
import { getWorkModuleConfig } from './work-module-config.js';

const REQUIRED_KEYS = ['id', 'version', 'dependencies', 'optional'];

export function runWorkModuleHealthCheck() {
  const config = getWorkModuleConfig();
  const plugins = getWorkPluginList();
  const health = getWorkPluginHealth();
  const errors = [];

  for (const plugin of plugins) {
    for (const key of REQUIRED_KEYS) {
      if (!(key in plugin)) errors.push(`${plugin.id}: missing ${key}`);
    }
    if (!plugin.id.startsWith('WORK.')) errors.push(`${plugin.id}: invalid namespace`);
  }

  const healthById = new Map(health.map(item => [item.id, item]));
  for (const plugin of plugins) {
    const state = healthById.get(plugin.id);
    if (state?.status === 'FAILED' && !plugin.optional) {
      errors.push(`${plugin.id}: required plugin failed`);
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    config,
    plugins,
    health,
    errors
  });
}

export function assertWorkModuleHealth() {
  const report = runWorkModuleHealthCheck();
  if (!report.ok) {
    throw new Error(`[WORK.MODULES] health check failed: ${report.errors.join('; ')}`);
  }
  return report;
}
