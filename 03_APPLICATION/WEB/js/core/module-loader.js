import { getModule, listModules, moduleHealth } from './module-registry.js';

const loaded = new Map();

function normalize(definition) {
  if (!definition?.id) throw new Error('Module loader requires a module id');
  return definition;
}

export async function loadModule(definition) {
  const module = normalize(definition);
  if (loaded.has(module.id)) return loaded.get(module.id);

  const dependencies = Array.isArray(module.dependencies) ? module.dependencies : [];
  for (const dependencyId of dependencies) {
    if (!getModule(dependencyId)) {
      moduleHealth(module.id, 'BLOCKED', `Missing dependency: ${dependencyId}`);
      throw new Error(`${module.id} cannot load: missing dependency ${dependencyId}`);
    }
  }

  try {
    const instance = await (typeof module.load === 'function' ? module.load() : module);
    loaded.set(module.id, instance || module);
    moduleHealth(module.id, 'READY');
    return loaded.get(module.id);
  } catch (error) {
    moduleHealth(module.id, 'FAILED', error?.message || String(error));
    throw error;
  }
}

export function unloadModule(id) {
  const instance = loaded.get(id);
  if (instance?.unmount) instance.unmount();
  loaded.delete(id);
  moduleHealth(id, 'UNLOADED');
}

export function isModuleLoaded(id) {
  return loaded.has(id);
}

export function moduleSnapshot() {
  return listModules().map(module => ({
    id: module.id,
    version: module.version,
    parentId: module.parentId || null,
    dependencies: [...(module.dependencies || [])],
    loaded: loaded.has(module.id),
    status: module.status || 'ACTIVE'
  }));
}
