import { emitWorkEvent, WORK_HOST_EVENTS } from './work-host-bridge.js';

let started = false;

function findTaskId(target) {
  const element = target instanceof Element ? target.closest('[data-detail]') : null;
  const taskId = element?.dataset?.detail?.trim();
  return taskId || null;
}

export function startWorkHostObserver() {
  if (started) return () => {};
  started = true;

  const onClick = event => {
    const taskId = findTaskId(event.target);
    if (!taskId) return;

    emitWorkEvent(WORK_HOST_EVENTS.TASK_OPENED, {
      taskId,
      source: 'legacy-work-observer'
    });
  };

  document.addEventListener('click', onClick, true);

  return () => {
    document.removeEventListener('click', onClick, true);
    started = false;
  };
}
