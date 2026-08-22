/* SAOVN-OS Core — Access Context
 * Shared read facade for Experience Plane modules.
 * It never grants permissions and never replaces backend Rules.
 */

export function createAccessContext({ identityContext = {}, policy = {}, capabilityResolver = null, moduleRegistry = null } = {}) {
  const capabilities = capabilityResolver?.resolve
    ? capabilityResolver.resolve(identityContext, policy)
    : new Set();

  const can = capability => capabilities instanceof Set
    ? capabilities.has(String(capability || '').trim())
    : Array.isArray(capabilities) && capabilities.includes(String(capability || '').trim());

  const moduleEnabled = id => {
    if (!moduleRegistry?.getModule) return false;
    const module = moduleRegistry.getModule(id);
    if (!module) return false;
    return moduleRegistry.canLoadModule ? moduleRegistry.canLoadModule(id, { moduleEnabled: value => policy?.modules?.[value]?.enabled !== false }) : true;
  };

  return Object.freeze({
    identity: identityContext.identity || null,
    membership: identityContext.membership || null,
    scope: identityContext.scope || null,
    capabilities,
    can,
    moduleEnabled
  });
}

window.SAOVNAccessContext = Object.freeze({ createAccessContext });
