const params = new URLSearchParams(location.search);
const taskId = String(params.get('task') || '').trim();
let opened = false;
let attempts = 0;

if (taskId) {
  const tryOpen = () => {
    if (opened) return true;
    attempts += 1;
    const target = document.querySelector(`[data-detail="${CSS.escape(taskId)}"]`);
    if (!target) return false;
    opened = true;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  };

  const observer = new MutationObserver(() => {
    if (tryOpen()) observer.disconnect();
  });

  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    tryOpen();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  const timer = setInterval(() => {
    if (tryOpen() || attempts >= 50) {
      clearInterval(timer);
      observer.disconnect();
    }
  }, 100);
}
