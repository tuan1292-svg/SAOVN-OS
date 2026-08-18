import { loadModule, moduleSnapshot } from '../../core/module-loader.js';
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
  registerWorkPlugin({ id: 'WORK.CHAT', load: loadWorkChatPlugin, optional: true });
  return [...plugins.values()];
}

async function loadWorkChatPlugin() {
  registerWorkChat();
  return loadModule({
    id: 'WORK.CHAT',
    dependencies: ['WORK.TASK'],
    load: async () => import('./work-chat.ui.js')
  });
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
  return [...plugins.values()].map(({ id, optional }) => ({ id, optional: Boolean(optional) }));
}

export function getWorkPluginHealth() {
  return moduleSnapshot().filter(module => module.id.startsWith('WORK.'));
}

registerBuiltInWorkPlugins();
