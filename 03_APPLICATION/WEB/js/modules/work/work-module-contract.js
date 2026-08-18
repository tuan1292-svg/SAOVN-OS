/**
 * WORK boundary contract.
 * Validates registered modules without executing business logic.
 */

import { getModule, listModules } from '../../core/module-registry.js';
import { WORK_MODULE_MANIFEST } from './work-module-manifest.js';

export function validateWorkBoundary() {
  const modules = listModules('WORK');
  const errors = [];
  const manifestById = new Map(WORK_MODULE_MANIFEST.map(item => [item.id, item]));

  for (const definition of WORK_MODULE_MANIFEST) {
    const module = getModule(definition.id);
    if (!module) {
      if (definition.required) errors.push(`${definition.id}: required module not registered`);
      continue;
    }
    if (module.parentId !== 'WORK') errors.push(`${definition.id}: invalid parentId`);
    if (!Array.isArray(module.dependencies)) errors.push(`${definition.id}: dependencies must be an array`);
    if (!Array.isArray(module.capabilities)) errors.push(`${definition.id}: capabilities must be an array`);
    if (!Array.isArray(module.owns)) errors.push(`${definition.id}: owns must be an array`);
    for (const dependency of definition.dependencies) {
      if (dependency.startsWith('WORK.') && !manifestById.has(dependency)) {
        errors.push(`${definition.id}: dependency ${dependency} is not in the manifest`);
      }
    }
  }

  const owners = new Map();
  for (const module of modules) {
    for (const resource of module.owns || []) {
      const previous = owners.get(resource);
      if (previous && previous !== module.id) errors.push(`resource ownership conflict: ${resource} (${previous} vs ${module.id})`);
      else owners.set(resource, module.id);
    }
  }

  return Object.freeze({ ok: errors.length === 0, modules, errors });
}

export function assertWorkBoundary() {
  const report = validateWorkBoundary();
  if (!report.ok) throw new Error(`[WORK.CONTRACT] boundary validation failed: ${report.errors.join('; ')}`);
  return report;
}
