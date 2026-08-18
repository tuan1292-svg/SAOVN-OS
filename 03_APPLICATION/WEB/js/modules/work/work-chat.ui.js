import { createWorkChatMessage, listWorkChatMessages } from './work-chat.adapter.js';
import { registerWorkChat, assertWorkChatDependencies } from './work-chat.plugin.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export async function mountWorkChatUI({ taskId, host, currentUser }) {
  registerWorkChat();
  assertWorkChatDependencies();
  if (!taskId || !host) throw new Error('WORK.CHAT UI requires taskId and host');

  host.innerHTML = `
    <section class="work-chat" data-work-chat="${esc(taskId)}">
      <header class="work-chat__header"><strong>Trao đổi công việc</strong><span>WORK.CHAT</span></header>
      <div class="work-chat__messages" data-chat-messages><div class="work-chat__empty">Đang tải trao đổi…</div></div>
      <form class="work-chat__form" data-chat-form>
        <textarea data-chat-input rows="2" maxlength="4000" placeholder="Nhập nội dung trao đổi…"></textarea>
        <button type="submit">Gửi</button>
      </form>
      <p class="work-chat__error" data-chat-error hidden></p>
    </section>`;

  const list = host.querySelector('[data-chat-messages]');
  const form = host.querySelector('[data-chat-form]');
  const input = host.querySelector('[data-chat-input]');
  const error = host.querySelector('[data-chat-error]');

  const render = messages => {
    list.innerHTML = messages.length ? messages.map(message => `
      <article class="work-chat__message">
        <div class="work-chat__author">${esc(message.senderName || message.senderId)}</div>
        <div class="work-chat__text">${esc(message.text)}</div>
      </article>`).join('') : '<div class="work-chat__empty">Chưa có trao đổi nào.</div>';
    list.scrollTop = list.scrollHeight;
  };

  try { render(await listWorkChatMessages(taskId)); }
  catch (e) { error.hidden = false; error.textContent = `Không tải được trao đổi: ${e?.code || e?.message || 'permission-denied'}`; }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || !currentUser?.uid) return;
    form.querySelector('button').disabled = true;
    error.hidden = true;
    try {
      await createWorkChatMessage(taskId, { senderId: currentUser.uid, senderName: currentUser.displayName || currentUser.email || '' , text });
      input.value = '';
      render(await listWorkChatMessages(taskId));
    } catch (e) {
      error.hidden = false;
      error.textContent = `Không gửi được: ${e?.code || e?.message || 'unknown-error'}`;
    } finally { form.querySelector('button').disabled = false; }
  });

  return { unmount() { host.innerHTML = ''; } };
}
