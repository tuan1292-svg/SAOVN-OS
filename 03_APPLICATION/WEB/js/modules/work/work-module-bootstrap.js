import { startWorkPluginMountManager } from './work-plugin-mount-manager.js';
import { getWorkPluginList, loadWorkPlugin } from './work-plugin-host.js';
import { isWorkModulesEnabled, isWorkPluginEnabled } from './work-module-config.js';
import { runWorkModuleHealthCheck } from './work-module-health.js';

let booted = false;
let stopMountManager = null;

export async function bootWorkModules() {
  if (!isWorkModulesEnabled()) {
    return { booted: false, disabled: true, plugins: getWorkPluginList() };
  }

  if (booted) return { booted: true, plugins: getWorkPluginList() };

  const healthBeforeBoot = runWorkModuleHealthCheck();
  if (!healthBeforeBoot.ok) {
    console.error('[WORK.MODULES] Health gate blocked bootstrap:', healthBeforeBoot.errors);
    return { booted: false, blocked: true, health: healthBeforeBoot };
  }

  stopMountManager = startWorkPluginMountManager();

  if (isWorkPluginEnabled('WORK.CHAT')) {
    try {
      await loadWorkPlugin('WORK.CHAT');
    } catch (error) {
      console.warn('[WORK.MODULES] Optional WORK.CHAT disabled:', error);
    }
  }

  booted = true;
  return {
    booted: true,
    plugins: getWorkPluginList(),
    health: runWorkModuleHealthCheck()
  };
}

export function shutdownWorkModules() {
  if (stopMountManager) stopMountManager();
  stopMountManager = null;
  booted = false;
}

export function isWorkModulesBooted() {
  return booted;
}
