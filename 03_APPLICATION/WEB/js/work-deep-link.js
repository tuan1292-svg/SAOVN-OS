const taskId = new URLSearchParams(location.search).get('task');
let opened = false;
if (taskId) {
  const tryOpen = () => {
    if (opened) return;
    const target = document.querySelector(`[data-detail="${CSS.escape(taskId)}"]`);
    if (!target) return;
    opened = true;
    target.click();
  };
  const observer = new MutationObserver(tryOpen);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(tryOpen,300));
  setTimeout(()=>{ tryOpen(); observer.disconnect(); },5000);
}
