import { startWorkPluginMountManager } from './work-plugin-mount-manager.js';
import { getWorkPluginList } from './work-plugin-host.js';

let booted = false;
let stopMountManager = null;

export function bootWorkModules() {
  if (booted) return { booted: true, plugins: getWorkPluginList() };

  stopMountManager = startWorkPluginMountManager();
  booted = true;

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
