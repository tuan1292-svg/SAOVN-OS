/**
 * WORK boundary contract.
 * Validates the module graph after legacy-compatible plugins register.
 * It does not execute business logic or change Firebase behavior.
 */

import { getModule, listModules } from '../../core/module-registry.js';

const REQUIRED_WORK_MODULES = Object.freeze([
  'WORK.TASK',
  'WORK.CHECKLIST',
  'WORK.COMMENTS',
  'WORK.MENTIONS',
  'WORK.ANALYTICS'
]);

const OPTIONAL_WORK_MODULES = Object.freeze([
  'WORK.CHAT'
]);

function validateModule(module, errors) {
  if (!module) return;
  if (module.parentId !== 'WORK') errors.push(`${module.id}: invalid parentId`);
  if (!Array.isArray(module.dependencies)) errors.push(`${module.id}: dependencies must be an array`);
  if (!Array.isArray(module.capabilities)) errors.push(`${module.id}: capabilities must be an array`);
  if (!Array.isArray(module.owns) && typeof module.dataOwner !== 'string') {
    errors.push(`${module.id}: data ownership must be declared`);
  }

  const expectedNamespace = `${module.id}.*`;
  if (module.permissionNamespace && module.permissionNamespace !== expectedNamespace) {
    errors.push(`${module.id}: invalid permission namespace`);
  }
}

export function validateWorkBoundary() {
  const modules = listModules('WORK');
  const errors = [];

  for (const id of REQUIRED_WORK_MODULES) {
    const module = getModule(id);
    if (!module) {
      errors.push(`${id}: not registered`);
      continue;
    }
    validateModule(module, errors);
  }

  for (const id of OPTIONAL_WORK_MODULES) {
    validateModule(getModule(id), errors);
  }

  const owners = new Map();
  for (const module of modules) {
    const owned = Array.isArray(module.owns)
      ? module.owns
      : (module.dataOwner ? [module.dataOwner] : []);
    for (const resource of owned) {
      const previous = owners.get(resource);
      if (previous && previous !== module.id) {
        errors.push(`resource ownership conflict: ${resource} (${previous} vs ${module.id})`);
      } else {
        owners.set(resource, module.id);
      }
    }
  }

  return Object.freeze({ ok: errors.length === 0, modules, errors });
}

export function assertWorkBoundary() {
  const report = validateWorkBoundary();
  if (!report.ok) {
    throw new Error(`[WORK.CONTRACT] boundary validation failed: ${report.errors.join('; ')}`);
  }
  return report;
}
