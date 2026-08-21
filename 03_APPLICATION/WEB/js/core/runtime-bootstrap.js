/* SAOVN-OS Core — Runtime Bootstrap
 * Initializes the shared application context once and exposes it to modules.
 */

import { getPermissions } from '../permissions.js';
import { buildRuntimeContext } from './policy-engine.js';

let runtimePromise;
let runtime = null;

export async function bootstrapRuntime() {
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    const permissions = await getPermissions();
    runtime = permissions.context || buildRuntimeContext({
      user: null,
      membership: {},
      policy: {}
    });
    window.SAOVNRuntime = runtime;
    window.dispatchEvent(new CustomEvent('saovn:runtime-ready', { detail: runtime }));
    return runtime;
  })().catch(error => {
    runtimePromise = null;
    console.error('[SAOVN][RUNTIME] bootstrap failed', error);
    throw error;
  });

  return runtimePromise;
}

export function getRuntime() { return runtime; }

if (typeof window !== 'undefined') bootstrapRuntime().catch(() => {});
