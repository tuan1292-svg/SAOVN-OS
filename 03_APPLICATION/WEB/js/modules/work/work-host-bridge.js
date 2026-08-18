/**
 * Compatibility boundary between legacy Work host code and isolated plugins.
 *
 * The legacy host only needs to emit/observe these events. Plugins subscribe
 * through this bridge and must not patch legacy Work internals.
 */

const EVENT_PREFIX = 'saovn:work:';

function eventName(name) {
  return `${EVENT_PREFIX}${name}`;
}

export function emitWorkEvent(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(eventName(name), { detail }));
}

export function onWorkEvent(name, handler, options = {}) {
  const type = eventName(name);
  const listener = event => handler(event.detail || {}, event);
  document.addEventListener(type, listener, options);
  return () => document.removeEventListener(type, listener, options);
}

export function createWorkPluginBridge(pluginId) {
  if (!pluginId || !pluginId.startsWith('WORK.')) {
    throw new Error('Work plugin bridge requires a WORK.* plugin id');
  }

  return Object.freeze({
    pluginId,
    emit(name, detail) {
      emitWorkEvent(name, { ...detail, sourceModule: pluginId });
    },
    on(name, handler, options) {
      return onWorkEvent(name, handler, options);
    }
  });
}

export const WORK_HOST_EVENTS = Object.freeze({
  TASK_OPENED: 'task-opened',
  TASK_CLOSED: 'task-closed',
  TASK_CREATED: 'task-created',
  TASK_UPDATED: 'task-updated'
});
