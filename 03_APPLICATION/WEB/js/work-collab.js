import { createChecklistPanel, mountChecklist } from "./modules/work/work-checklist.plugin.js";
import { createCommentsPanel, mountComments } from "./modules/work/work-comments.plugin.js";

let activeTaskId = null;

document.addEventListener('click', e => {
  const target = e.target.closest('[data-detail]');
  if (!target || e.target.closest('[data-edit]')) return;
  activeTaskId = target.dataset.detail;
  setTimeout(() => enhanceDetail(activeTaskId), 80);
});

async function enhanceDetail(taskId) {
  const body = document.getElementById('detailBody');
  if (!body || !taskId || body.querySelector('.collab-section')) return;

  const wrap = document.createElement('div');
  wrap.className = 'collab-section';
  wrap.innerHTML = `<div class="collab-grid">${createChecklistPanel()}${createCommentsPanel()}</div>`;
  body.appendChild(wrap);
  injectStyles();

  const checklistRoot = wrap.querySelector('[data-work-plugin="WORK.CHECKLIST"]');
  const commentsRoot = wrap.querySelector('[data-work-plugin="WORK.COMMENTS"]');

  await mountChecklist(taskId, checklistRoot);
  await mountComments(taskId, commentsRoot);
  window.dispatchEvent(new CustomEvent('work-detail-opened', { detail: { taskId } }));
}

function injectStyles() {
  if (document.getElementById('collabStyles')) return;
  const s = document.createElement('style');
  s.id = 'collabStyles';
  s.textContent = `.collab-section{margin-top:18px}.collab-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.collab-panel{padding:16px;border:1px solid var(--line);border-radius:13px;background:#ffffff04}.collab-head{display:flex;align-items:end;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #fff1}.collab-head strong{font-size:11px}.collab-head>span{font-size:8px;color:#718098}.check-add{display:flex;gap:7px;margin:12px 0}.check-add input,.comment-add textarea{width:100%;border:1px solid var(--line);border-radius:8px;background:#07101f;color:#eef4ff;padding:9px;font:9px inherit;outline:0}.check-add button,.comment-add button{border:1px solid #4b99ff66;border-radius:8px;background:#1673ef;color:white;min-width:38px;font-weight:800}.check-item{display:flex;align-items:center;gap:9px;padding:10px 2px;border-bottom:1px solid #fff1;cursor:pointer}.check-item input{display:none}.check-mark{width:16px;height:16px;border:1px solid #53657d;border-radius:5px;background:#07101f;flex:0 0 16px}.check-item input:checked+.check-mark{border-color:var(--green);background:#00e676;box-shadow:0 0 12px #00e67633}.check-item input:checked+.check-mark:after{content:'✓';display:block;color:#03100a;font-size:11px;text-align:center;font-weight:900}.check-text{font-size:9px;color:#b5c1d2}.check-text.completed{text-decoration:line-through;color:#647389}.comment{display:flex;gap:9px;padding:11px 0;border-bottom:1px solid #fff1}.comment-avatar{width:27px;height:27px;flex:0 0 27px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#3156b9,#8b5cf6);font-size:8px}.comment strong{font-size:9px}.comment-position{display:block;margin-top:2px;color:#8ea1bb;font-size:7px}.comment small{margin-left:7px;color:#68778e;font-size:7px}.comment p{margin-top:5px;color:#a4b0c1;font-size:9px;line-height:1.5;white-space:pre-wrap}.comment-add{display:flex;gap:7px;margin-top:12px}.comment-add button{padding:0 13px}.loading{font-size:9px}.detail-card{max-width:1050px}.comment [data-member-profile]{color:#dce9ff;text-decoration:none;border-bottom:1px solid rgba(69,151,255,.28);cursor:pointer;font-weight:800}.comment [data-member-profile]:hover{color:#61adff;border-bottom-color:#61adff}@media(max-width:800px){.collab-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
