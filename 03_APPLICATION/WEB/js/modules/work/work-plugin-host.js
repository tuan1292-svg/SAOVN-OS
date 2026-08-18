import { loadModule, moduleSnapshot } from '../../core/module-loader.js';
import { getWorkModuleDefinition, validateWorkModuleManifest } from './work-module-manifest.js';
import { registerWorkChat } from './work-chat.plugin.js';

const WORK_PLUGIN_HOST = 'WORK.PLUGINS';
const plugins = new Map();

export function registerWorkPlugin(definition) {
  if (!definition?.id) throw new Error(`${WORK_PLUGIN_HOST}: plugin id is required`);
  if (!definition.id.startsWith('WORK.')) throw new Error(`${WORK_PLUGIN_HOST}: plugin must belong to WORK`);
  if (plugins.has(definition.id)) return plugins.get(definition.id);
  plugins.set(definition.id, Object.freeze({ ...definition }));
  return plugins.get(definition.id);
}

export function registerBuiltInWorkPlugins() {
  validateWorkModuleManifest();
  const definition = getWorkModuleDefinition('WORK.CHAT');
  if (definition) {
    registerWorkPlugin({
      id: definition.id,
      version: definition.version,
      dependencies: definition.dependencies,
      optional: !definition.required,
      load: () => loadManifestModule(definition.id)
    });
  }
  return [...plugins.values()];
}

async function loadManifestModule(id) {
  if (id === 'WORK.CHAT') {
    registerWorkChat();
    return loadModule({
      id,
      dependencies: getWorkModuleDefinition(id)?.dependencies || [],
      load: async () => import('./work-chat.ui.js')
    });
  }
  throw new Error(`${WORK_PLUGIN_HOST}: no loader registered for ${id}`);
}

export async function loadWorkPlugin(id) {
  const plugin = plugins.get(id);
  if (!plugin) throw new Error(`${WORK_PLUGIN_HOST}: unknown plugin ${id}`);
  try {
    return await plugin.load();
  } catch (error) {
    if (plugin.optional) return { id, status: 'DISABLED', error };
    throw error;
  }
}

export function getWorkPluginList() {
  return [...plugins.values()].map(({ id, version, dependencies, optional }) => ({
    id,
    version: version || getWorkModuleDefinition(id)?.version || '0.0.0',
    dependencies: [...(dependencies || [])],
    optional: Boolean(optional)
  }));
}

export function getWorkPluginHealth() {
  return moduleSnapshot().filter(module => module.id.startsWith('WORK.'));
}

registerBuiltInWorkPlugins();
