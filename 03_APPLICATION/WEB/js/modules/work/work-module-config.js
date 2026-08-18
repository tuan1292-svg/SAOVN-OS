/** Runtime switchboard for Work modules. Defaults to safe legacy mode. */

const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  plugins: Object.freeze({
    'WORK.CHAT': false
  })
});

let config = {
  enabled: DEFAULT_CONFIG.enabled,
  plugins: { ...DEFAULT_CONFIG.plugins }
};

export function getWorkModuleConfig() {
  return {
    enabled: config.enabled,
    plugins: { ...config.plugins }
  };
}

export function setWorkModuleConfig(next = {}) {
  config = {
    enabled: Boolean(next.enabled),
    plugins: { ...config.plugins, ...(next.plugins || {}) }
  };
  return getWorkModuleConfig();
}

export function isWorkModulesEnabled() {
  return config.enabled === true;
}

export function isWorkPluginEnabled(id) {
  return isWorkModulesEnabled() && config.plugins[id] === true;
}

export const WORK_MODULE_DEFAULT_CONFIG = DEFAULT_CONFIG;
