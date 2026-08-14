import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = s => document.querySelector(s);
let uid = "";
let conversations = [];
let activeConversation = null;
let unsubscribeMessages = null;

onAuthStateChanged(auth, async user => {
    if (!user) { window.location.href = "index.html"; return; }
    uid = user.uid;
    const displayName = user.displayName || user.email?.split("@")[0] || "Thành viên";
    [$("#userIdentity"), $("#topbarIdentity")].forEach(el => { if (el) el.textContent = displayName; });
    await loadConversations();
});

async function loadConversations() {
    const list = $("#conversationList");
    try {
        const snap = await getDocs(query(collection(db, "conversations"), where("memberIds", "array-contains", uid), orderBy("updatedAt", "desc"), limit(50)));
        conversations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderConversations();
    } catch (error) {
        console.error("Lỗi tải cuộc trò chuyện:", error);
        list.innerHTML = `<div class="chat-list-empty">Không thể tải cuộc trò chuyện.<br>${escapeHTML(error?.code || "Firestore error")}</div>`;
    }
}

function renderConversations(filter = "") {
    const list = $("#conversationList");
    const rows = conversations.filter(c => !filter || String(c.title || c.memberNames?.find?.(() => true) || "").toLowerCase().includes(filter.toLowerCase()));
    if (!rows.length) { list.innerHTML = `<div class="chat-list-empty">Chưa có cuộc trò chuyện.<br>Tạo cuộc trò chuyện mới để bắt đầu.</div>`; return; }
    list.innerHTML = rows.map(c => `<button class="conversation-item ${activeConversation?.id === c.id ? "active" : ""} ${c.unreadCount?.[uid] ? "unread" : ""}" data-id="${escapeAttr(c.id)}"><div class="conversation-avatar">${initials(c.title || "Chat")}</div><div class="conversation-copy"><strong>${escapeHTML(c.title || "Cuộc trò chuyện")}</strong><span>${escapeHTML(c.lastMessage || "Chưa có tin nhắn")}</span></div></button>`).join("");
    list.querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => openConversation(b.dataset.id)));
}

async function openConversation(id) {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    activeConversation = conversation;
    $("#chatEmpty").classList.add("hidden");
    $("#chatActive").classList.remove("hidden");
    $("#activeName").textContent = conversation.title || "Cuộc trò chuyện";
    $("#activePosition").textContent = conversation.subtitle || "Trao đổi công việc";
    $("#activeAvatar").textContent = initials(conversation.title || "Chat");
    renderConversations($("#conversationSearch").value);
    if (unsubscribeMessages) unsubscribeMessages();
    const messagesRef = collection(db, "conversations", id, "messages");
    unsubscribeMessages = onSnapshot(query(messagesRef, orderBy("createdAt", "asc"), limit(300)), snap => {
        const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMessages(messages);
        const box = $("#messageList"); setTimeout(() => { box.scrollTop = box.scrollHeight; }, 20);
    }, error => console.error("Lỗi realtime chat:", error));
}

function renderMessages(messages) {
    const list = $("#messageList");
    list.innerHTML = messages.length ? messages.map(m => { const mine = m.senderId === uid; return `<div class="message-row ${mine ? "mine" : ""}"><div><div class="message-bubble">${escapeHTML(m.text || "")}</div><div class="message-meta">${escapeHTML(m.senderName || "Thành viên")} · ${formatDate(m.createdAt)}</div></div></div>`; }).join("") : `<div class="chat-empty"><div>✦</div><strong>Bắt đầu cuộc trò chuyện</strong><span>Hãy gửi tin nhắn đầu tiên.</span></div>`;
}

$("#messageForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const input = $("#messageInput");
    const text = input.value.trim();
    if (!text || !activeConversation) return;
    input.value = "";
    try {
        const identity = await getDoc(doc(db, "identities", uid));
        const senderName = identity.exists() ? identity.data().fullName || "Thành viên" : "Thành viên";
        await addDoc(collection(db, "conversations", activeConversation.id, "messages"), { text, senderId: uid, senderName, createdAt: serverTimestamp() });
        await setDoc(doc(db, "conversations", activeConversation.id), { lastMessage: text, lastSenderId: uid, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) { console.error("Lỗi gửi tin nhắn:", error); input.value = text; }
});

$("#conversationSearch")?.addEventListener("input", e => renderConversations(e.target.value));
$("#newConversation")?.addEventListener("click", () => alert("Khung tạo cuộc trò chuyện mới sẽ được nối với danh bạ thành viên ở checkpoint kế tiếp."));
$("#logoutButton")?.addEventListener("click", () => signOut(auth));
function initials(value) { return String(value).trim().split(/\s+/).slice(-2).map(x => x[0]).join("").toUpperCase().slice(0,2) || "C"; }
function formatDate(value) { if (!value) return "Vừa gửi"; const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value); return Number.isNaN(d.getTime()) ? "Vừa gửi" : new Intl.DateTimeFormat("vi-VN", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" }).format(d); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function escapeAttr(value) { return escapeHTML(value); }
