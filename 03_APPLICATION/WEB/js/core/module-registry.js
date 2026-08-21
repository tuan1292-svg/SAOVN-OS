/* SAOVN-OS Core — Module Registry
 * Business modules register metadata, not private UI state.
 */

const registry = new Map();

function validateManifest(manifest) {
  if (!manifest?.id) throw new Error('Module manifest requires id');
  if (!Array.isArray(manifest.dependencies)) manifest.dependencies = [];
  if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
  if (!Array.isArray(manifest.routes)) manifest.routes = [];
  if (!Array.isArray(manifest.navigation)) manifest.navigation = [];
  if (!Array.isArray(manifest.events)) manifest.events = [];
  return Object.freeze({ ...manifest });
}

export function registerModule(manifest) {
  const normalized = validateManifest({ ...manifest });
  if (registry.has(normalized.id)) throw new Error(`Module already registered: ${normalized.id}`);
  registry.set(normalized.id, normalized);
  return normalized;
}

export function getModule(id) { return registry.get(id) || null; }
export function listModules() { return [...registry.values()]; }
export function hasModule(id) { return registry.has(id); }

export function enabledModules(runtime) {
  return listModules().filter(module => runtime?.moduleEnabled?.(module.id) !== false);
}

export function moduleHealth() {
  return listModules().map(module => ({ id: module.id, version: module.version || '0.0.0', status: 'registered' }));
}

window.SAOVNModuleRegistry = { registerModule, getModule, listModules, hasModule, enabledModules, moduleHealth };
