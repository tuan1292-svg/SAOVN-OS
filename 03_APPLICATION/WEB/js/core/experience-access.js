/* SAOVN-OS Core — Experience Access
 * Single read-only access facade for the shared Experience Plane.
 * UI/modules consume this facade; it does not replace backend security.
 */

import { getRuntimeContext } from './policy-engine.js';
import { getModule, canLoadModule } from './module-registry.js';

function runtime() {
  return getRuntimeContext?.() || window.SAOVNRuntimeContext || null;
}

export function getExperienceAccess() {
  const ctx = runtime();
  return Object.freeze({
    user: ctx?.user || null,
    identity: ctx?.identity || null,
    membership: ctx?.membership || null,
    organization: ctx?.organization || null,
    scope: ctx?.scope || null,
    role: ctx?.role || null,
    capabilities: Object.freeze({ ...(ctx?.capabilities || {}) }),
    can: (capability, target) => typeof ctx?.can === 'function' ? Boolean(ctx.can(capability, target)) : false,
    moduleEnabled: id => typeof ctx?.moduleEnabled === 'function' ? ctx.moduleEnabled(id) : false,
    canLoadModule: id => canLoadModule(id, ctx),
    module: id => getModule(id)
  });
}

export function requireCapability(capability, target) {
  return getExperienceAccess().can(capability, target);
}

window.SAOVNExperienceAccess = Object.freeze({ getExperienceAccess, requireCapability });
