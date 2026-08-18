const registry = new Map();

export function registerModule(definition) {
  if (!definition?.id) throw new Error('Module registration requires id');
  if (registry.has(definition.id)) throw new Error(`Duplicate module id: ${definition.id}`);
  registry.set(definition.id, Object.freeze({
    version: '1.0.0',
    status: 'ACTIVE',
    dependencies: [],
    capabilities: [],
    ...definition
  }));
  return registry.get(definition.id);
}

export function getModule(id) {
  return registry.get(id) || null;
}

export function listModules(parentId = null) {
  return [...registry.values()].filter(m => parentId == null || m.parentId === parentId);
}

export function assertDependency(moduleId, dependencyId) {
  const module = getModule(moduleId);
  if (!module) throw new Error(`Unknown module: ${moduleId}`);
  if (!module.dependencies.includes(dependencyId)) {
    throw new Error(`${moduleId} cannot consume undeclared dependency ${dependencyId}`);
  }
}

export function moduleHealth(id, state = 'ready', detail = '') {
  window.dispatchEvent(new CustomEvent('saovn-module-health', {
    detail: { id, state, detail, at: Date.now() }
  }));
}

window.SAOVN_MODULES = { get: getModule, list: listModules };
