/**
 * WORK module manifest.
 * Single inventory for required/optional Work plugins.
 * Business logic stays inside each plugin; this file only defines boundaries.
 */

export const WORK_MODULE_MANIFEST = Object.freeze([
  { id: 'WORK.TASK', version: '1.0.0', required: true, dependencies: [], dataOwner: 'workTasks/{taskId}', permissionNamespace: 'WORK.TASK.*' },
  { id: 'WORK.CHECKLIST', version: '1.0.0', required: false, dependencies: ['WORK.TASK'], dataOwner: 'workTasks/{taskId}/checklist/{itemId}', permissionNamespace: 'WORK.CHECKLIST.*' },
  { id: 'WORK.COMMENTS', version: '1.0.0', required: false, dependencies: ['WORK.TASK'], dataOwner: 'workTasks/{taskId}/comments/{commentId}', permissionNamespace: 'WORK.COMMENTS.*' },
  { id: 'WORK.MENTIONS', version: '1.0.0', required: false, dependencies: ['WORK.TASK', 'WORK.COMMENTS', 'CORE.IDENTITY', 'CORE.NOTIFICATION'], dataOwner: 'mentionIds/mentionNames on WORK.COMMENTS records', permissionNamespace: 'WORK.MENTIONS.*' },
  { id: 'WORK.ANALYTICS', version: '1.0.0', required: false, dependencies: ['WORK.TASK', 'CORE.MEMBERSHIP'], dataOwner: 'derived Work analytics', permissionNamespace: 'WORK.ANALYTICS.*' },
  { id: 'WORK.CHAT', version: '1.0.0', required: false, dependencies: ['WORK.TASK', 'CORE.IDENTITY', 'CORE.NOTIFICATION'], dataOwner: 'workTasks/{taskId}/chat/{messageId}', permissionNamespace: 'WORK.CHAT.*' }
]);

export function getWorkModuleDefinition(id) {
  return WORK_MODULE_MANIFEST.find(module => module.id === id) || null;
}

export function validateWorkModuleManifest() {
  const ids = new Set(WORK_MODULE_MANIFEST.map(module => module.id));
  for (const module of WORK_MODULE_MANIFEST) {
    if (!module.id.startsWith('WORK.')) throw new Error(`Invalid Work module id: ${module.id}`);
    if (!module.version) throw new Error(`${module.id}: missing version`);
    if (!Array.isArray(module.dependencies)) throw new Error(`${module.id}: dependencies must be an array`);
    for (const dependency of module.dependencies) {
      if (dependency.startsWith('WORK.') && !ids.has(dependency)) throw new Error(`${module.id}: missing manifest dependency ${dependency}`);
    }
  }
  return true;
}

validateWorkModuleManifest();
