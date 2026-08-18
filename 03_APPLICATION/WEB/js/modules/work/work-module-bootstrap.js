import { startWorkPluginMountManager } from './work-plugin-mount-manager.js';
import { getWorkPluginList, loadWorkPlugin } from './work-plugin-host.js';
import { isWorkModulesEnabled, isWorkPluginEnabled } from './work-module-config.js';

let booted = false;
let stopMountManager = null;

export async function bootWorkModules() {
  if (!isWorkModulesEnabled()) {
    return { booted: false, disabled: true, plugins: getWorkPluginList() };
  }

  if (booted) return { booted: true, plugins: getWorkPluginList() };

  stopMountManager = startWorkPluginMountManager();
  booted = true;

  if (isWorkPluginEnabled('WORK.CHAT')) {
    try {
      await loadWorkPlugin('WORK.CHAT');
    } catch (error) {
      console.warn('[WORK.MODULES] Optional WORK.CHAT disabled:', error);
    }
  }

  return {
    booted: true,
    plugins: getWorkPluginList()
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
