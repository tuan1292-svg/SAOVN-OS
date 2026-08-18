/**
 * WORK boundary contract.
 * This validates the module graph after legacy-compatible plugins register.
 * It does not execute business logic and does not change Firebase behavior.
 */

import { getModule, listModules } from '../../core/module-registry.js';

const REQUIRED_WORK_MODULES = Object.freeze([
  'WORK.TASK',
  'WORK.CHECKLIST',
  'WORK.COMMENTS',
  'WORK.MENTIONS',
  'WORK.ANALYTICS'
]);

export function validateWorkBoundary() {
  const modules = listModules('WORK');
  const errors = [];

  for (const id of REQUIRED_WORK_MODULES) {
    const module = getModule(id);
    if (!module) {
      errors.push(`${id}: not registered`);
      continue;
    }

    if (module.parentId !== 'WORK') errors.push(`${id}: invalid parentId`);
    if (!Array.isArray(module.dependencies)) errors.push(`${id}: dependencies must be an array`);
    if (!Array.isArray(module.capabilities)) errors.push(`${id}: capabilities must be an array`);
    if (!Array.isArray(module.owns)) errors.push(`${id}: owns must be an array`);
  }

  const owners = new Map();
  for (const module of modules) {
    for (const resource of module.owns || []) {
      const previous = owners.get(resource);
      if (previous && previous !== module.id) {
        errors.push(`resource ownership conflict: ${resource} (${previous} vs ${module.id})`);
      } else {
        owners.set(resource, module.id);
      }
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    modules,
    errors
  });
}

export function assertWorkBoundary() {
  const report = validateWorkBoundary();
  if (!report.ok) {
    throw new Error(`[WORK.CONTRACT] boundary validation failed: ${report.errors.join('; ')}`);
  }
  return report;
}
