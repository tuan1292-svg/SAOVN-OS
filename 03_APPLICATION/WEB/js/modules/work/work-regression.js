import { getModule, listModules } from '../../core/module-registry.js';
import { validateWorkBoundary } from './work-module-contract.js';

const EXPECTED = Object.freeze([
  'WORK.TASK',
  'WORK.CHECKLIST',
  'WORK.COMMENTS',
  'WORK.MENTIONS',
  'WORK.ANALYTICS'
]);

export function runWorkRegressionChecks() {
  const boundary = validateWorkBoundary();
  const errors = [...boundary.errors];
  const modules = listModules('WORK');

  for (const id of EXPECTED) {
    const module = getModule(id);
    if (!module) continue;
    if (module.parentId !== 'WORK') errors.push(`${id}: parent boundary changed`);
    if (!module.owns?.length) errors.push(`${id}: no owned data declared`);
  }

  return Object.freeze({
    ok: errors.length === 0,
    checkedAt: Date.now(),
    modules,
    errors
  });
}

export function assertWorkRegression() {
  const report = runWorkRegressionChecks();
  if (!report.ok) throw new Error(`[WORK.REGRESSION] failed: ${report.errors.join('; ')}`);
  return report;
}
