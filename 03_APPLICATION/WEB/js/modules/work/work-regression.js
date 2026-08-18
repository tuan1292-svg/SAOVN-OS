import { getModule, listModules } from '../../core/module-registry.js';
import { validateWorkBoundary } from './work-module-contract.js';

const REQUIRED = Object.freeze([
  'WORK.TASK',
  'WORK.CHECKLIST',
  'WORK.COMMENTS',
  'WORK.MENTIONS',
  'WORK.ANALYTICS'
]);

const OPTIONAL = Object.freeze(['WORK.CHAT']);

export function runWorkRegressionChecks() {
  const boundary = validateWorkBoundary();
  const errors = [...boundary.errors];
  const modules = listModules('WORK');

  for (const id of REQUIRED) {
    const module = getModule(id);
    if (!module) continue;
    if (module.parentId !== 'WORK') errors.push(`${id}: parent boundary changed`);
    if (!module.owns?.length) errors.push(`${id}: no owned data declared`);
  }

  for (const id of OPTIONAL) {
    const module = getModule(id);
    if (!module) continue;
    if (module.parentId !== 'WORK') errors.push(`${id}: parent boundary changed`);
    if (!module.owns?.length && typeof module.dataOwner !== 'string') errors.push(`${id}: no owned data declared`);
  }

  const permissionNamespaces = new Map();
  for (const module of modules) {
    const namespace = module.permissionNamespace || `${module.id}.*`;
    const previous = permissionNamespaces.get(namespace);
    if (previous && previous !== module.id) errors.push(`permission namespace conflict: ${namespace}`);
    permissionNamespaces.set(namespace, module.id);
  }

  return Object.freeze({ ok: errors.length === 0, checkedAt: Date.now(), modules, errors });
}

export function assertWorkRegression() {
  const report = runWorkRegressionChecks();
  if (!report.ok) throw new Error(`[WORK.REGRESSION] failed: ${report.errors.join('; ')}`);
  return report;
}
