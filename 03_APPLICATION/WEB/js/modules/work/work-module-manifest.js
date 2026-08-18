/**
 * WORK module manifest.
 * This is the single inventory for optional/required Work plugins.
 * It describes boundaries; it does not contain business logic.
 */

export const WORK_MODULE_MANIFEST = Object.freeze([
  {
    id: 'WORK.TASK',
    version: '1.0.0',
    required: true,
    dependencies: [],
    dataOwner: 'workTasks/{taskId}',
    permissionNamespace: 'WORK.TASK.*'
  },
  {
    id: 'WORK.CHECKLIST',
    version: '1.0.0',
    required: false,
    dependencies: ['WORK.TASK'],
    dataOwner: 'workTasks/{taskId}/checklist',
    permissionNamespace: 'WORK.CHECKLIST.*'
  },
  {
    id: 'WORK.COMMENTS',
    version: '1.0.0',
    required: false,
    dependencies: ['WORK.TASK'],
    dataOwner: 'workTasks/{taskId}/comments',
    permissionNamespace: 'WORK.COMMENTS.*'
  },
  {
    id: 'WORK.MENTIONS',
    version: '1.0.0',
    required: false,
    dependencies: ['WORK.TASK'],
    dataOwner: 'workTasks/{taskId}',
    permissionNamespace: 'WORK.MENTIONS.*'
  },
  {
    id: 'WORK.ANALYTICS',
    version: '1.0.0',
    required: false,
    dependencies: ['WORK.TASK'],
    dataOwner: 'workTasks/{taskId}',
    permissionNamespace: 'WORK.ANALYTICS.*'
  },
  {
    id: 'WORK.CHAT',
    version: '1.0.0',
    required: false,
    dependencies: ['WORK.TASK'],
    dataOwner: 'workTasks/{taskId}/chat',
    permissionNamespace: 'WORK.CHAT.*'
  }
]);

export function getWorkModuleDefinition(id) {
  return WORK_MODULE_MANIFEST.find(module => module.id === id) || null;
}

export function validateWorkModuleManifest() {
  const ids = new Set();
  for (const module of WORK_MODULE_MANIFEST) {
    if (!module.id.startsWith('WORK.')) throw new Error(`Invalid Work module id: ${module.id}`);
    if (ids.has(module.id)) throw new Error(`Duplicate Work module: ${module.id}`);
    ids.add(module.id);
    for (const dependency of module.dependencies) {
      if (!ids.has(dependency) && !WORK_MODULE_MANIFEST.some(item => item.id === dependency)) {
        throw new Error(`${module.id}: missing manifest dependency ${dependency}`);
      }
    }
  }
  return true;
}

validateWorkModuleManifest();
