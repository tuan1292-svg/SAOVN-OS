import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = s => document.querySelector(s);
let uid = "";
let conversations = [];
let activeConversation = null;
let unsubscribeMessages = null;
let directoryMembers = [];

onAuthStateChanged(auth, async user => {
    if (!user) { window.location.href = "index.html"; return; }
    uid = user.uid;
    try {
        const identity = await getDoc(doc(db, "identities", uid));
        const data = identity.exists() ? identity.data() : {};
        const displayName = data.fullName || data.displayName || data.name || user.displayName || user.email?.split("@")[0] || "Thành viên";
        [$("#userIdentity"), $("#topbarIdentity")].forEach(el => { if (el) el.textContent = displayName; });
        await loadConversations();
    } catch (error) {
        console.error("Chat bootstrap error:", error);
        await loadConversations();
    }
});

async function loadConversations() {
    const list = $("#conversationList");
    try {
        const snap = await getDocs(query(collection(db, "conversations"), where("memberIds", "array-contains", uid), limit(50)));
        conversations = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => timestampMillis(b.updatedAt) - timestampMillis(a.updatedAt));
        renderConversations();
    } catch (error) {
        console.error("Lỗi tải cuộc trò chuyện:", error);
        conversations = [];
        list.innerHTML = `<div class="chat-list-empty">Không thể tải cuộc trò chuyện.<br>${escapeHTML(error?.code || "Firestore error")}</div>`;
    }
}

function renderConversations(filter = "") {
    const list = $("#conversationList");
    const needle = String(filter || "").toLowerCase();
    const rows = conversations.filter(c => !needle || String(c.title || "").toLowerCase().includes(needle) || String(c.subtitle || "").toLowerCase().includes(needle));
    if (!rows.length) { list.innerHTML = `<div class="chat-list-empty">Chưa có cuộc trò chuyện.<br>Tạo cuộc trò chuyện mới để bắt đầu.</div>`; return; }
    list.innerHTML = rows.map(c => `<button class="conversation-item ${activeConversation?.id === c.id ? "active" : ""} ${c.unreadCount?.[uid] ? "unread" : ""}" data-id="${escapeAttr(c.id)}"><div class="conversation-avatar">${initials(c.title || "Chat")}</div><div class="conversation-copy"><strong>${escapeHTML(c.title || "Cuộc trò chuyện")}</strong><span>${escapeHTML(c.subtitle || c.lastMessage || "Chưa có tin nhắn")}</span><small>${escapeHTML(c.lastMessage || "")}</small></div></button>`).join("");
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
    list.innerHTML = messages.length ? messages.map(m => { const mine = m.senderId === uid; return `<div class="message-row ${mine ? "mine" : ""}"><div><div class="message-bubble">${escapeHTML(m.text || "")}</div><div class="message-meta">${escapeHTML(m.senderName || "Thành viên")} · ${escapeHTML(m.senderPosition || "Thành viên")} · ${formatDate(m.createdAt)}</div></div></div>`; }).join("") : `<div class="chat-empty"><div>✦</div><strong>Bắt đầu cuộc trò chuyện</strong><span>Hãy gửi tin nhắn đầu tiên.</span></div>`;
}

$("#messageForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const input = $("#messageInput");
    const text = input.value.trim();
    if (!text || !activeConversation) return;
    input.value = "";
    try {
        const identity = await getDoc(doc(db, "identities", uid));
        const identityData = identity.exists() ? identity.data() : {};
        const senderName = identityData.fullName || identityData.displayName || identityData.name || "Thành viên";
        const senderPosition = identityData.position || identityData.title || "Thành viên";
        await addDoc(collection(db, "conversations", activeConversation.id, "messages"), { text, senderId: uid, senderName, senderPosition, createdAt: serverTimestamp() });
        const unreadCount = { ...(activeConversation.unreadCount || {}) };
        const recipients = (activeConversation.memberIds || []).filter(id => id !== uid);
        recipients.forEach(id => { unreadCount[id] = Number(unreadCount[id] || 0) + 1; });
        unreadCount[uid] = 0;
        await setDoc(doc(db, "conversations", activeConversation.id), { lastMessage: text, lastSenderId: uid, lastSenderName: senderName, updatedAt: serverTimestamp(), unreadCount }, { merge: true });
        await Promise.all(recipients.map(recipientId => addDoc(collection(db, "notifications", recipientId, "items"), {
            type: "CHAT",
            title: `Tin nhắn mới từ ${senderName}`,
            body: text,
            senderId: uid,
            senderName,
            recipientId,
            conversationId: activeConversation.id,
            targetUrl: "chat.html",
            read: false,
            createdAt: serverTimestamp()
        })));
        await loadConversations();
        activeConversation = conversations.find(c => c.id === activeConversation.id) || activeConversation;
        renderConversations($("#conversationSearch").value);
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error);
        input.value = text;
        alert(`Không thể hoàn tất gửi tin nhắn: ${error?.code || "Firestore error"}`);
    }
});

$("#conversationSearch")?.addEventListener("input", e => renderConversations(e.target.value));
$("#newConversation")?.addEventListener("click", openNewChatModal);
$("#memberSearch")?.addEventListener("input", e => renderMemberPicker(e.target.value));
$("#logoutButton")?.addEventListener("click", () => signOut(auth));
document.querySelectorAll("[data-close-chat-modal]").forEach(el => el.addEventListener("click", closeNewChatModal));

async function loadActiveMembershipDirectory() {
    const snap = await getDocs(query(collection(db, "memberships"), where("status", "==", "ACTIVE"), limit(100)));
    return snap.docs.map(d => { const raw = d.data() || {}; const uidFromDoc = raw.identityId || raw.userId || raw.uid || d.id.match(/^mem_(.+)_org_/)?.[1] || ""; return { id: d.id, ...raw, uid: uidFromDoc }; }).filter(m => m.uid && m.uid !== uid);
}
async function loadIdentityDirectory() {
    const snap = await getDocs(query(collection(db, "identities"), where("status", "==", "ACTIVE"), limit(100)));
    return snap.docs.map(d => ({ uid: d.id, identity: d.data() || {} })).filter(m => m.uid !== uid);
}
async function resolveDirectoryFromMemberships() {
    const memberships = await loadActiveMembershipDirectory();
    const rows = await Promise.all(memberships.map(async m => { let data = {}; try { const identity = await getDoc(doc(db, "identities", m.uid)); data = identity.exists() ? identity.data() : {}; } catch (error) { console.warn("Không đọc được identity của", m.uid, error?.code || error); } return { uid: m.uid, name: data.fullName || data.displayName || data.name || m.fullName || "Thành viên", position: data.position || data.jobTitle || m.position || "Thành viên", department: m.department || data.department || "", team: m.team || data.team || "" }; }));
    return rows.filter(m => m.uid && m.name);
}
async function resolveDirectoryFromIdentities() { const rows = await loadIdentityDirectory(); return rows.map(m => ({ uid: m.uid, name: m.identity.fullName || m.identity.displayName || m.identity.name || "Thành viên", position: m.identity.position || m.identity.jobTitle || "Thành viên", department: m.identity.department || "", team: m.identity.team || "" })).filter(m => m.name); }
async function openNewChatModal() {
    const modal = $("#newChatModal"); modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false"); $("#memberSearch").value = ""; $("#memberPicker").innerHTML = `<div class="chat-list-empty">Đang tải danh bạ…</div>`;
    try { directoryMembers = []; try { directoryMembers = await resolveDirectoryFromMemberships(); } catch (membershipError) { console.warn("Danh bạ memberships không tải được, chuyển sang identities:", membershipError?.code || membershipError); } if (!directoryMembers.length) { try { directoryMembers = await resolveDirectoryFromIdentities(); } catch (identityError) { console.error("Danh bạ identities cũng không tải được:", identityError); } } if (!directoryMembers.length) { $("#memberPicker").innerHTML = `<div class="chat-list-empty">Chưa có thành viên ACTIVE để bắt đầu trò chuyện.</div>`; return; } renderMemberPicker(); } catch (error) { console.error("Lỗi tải danh bạ chat:", error); $("#memberPicker").innerHTML = `<div class="chat-list-empty">Không thể tải danh bạ.<br>${escapeHTML(error?.code || "Firestore error")}</div>`; }
}
function renderMemberPicker(filter = "") { const list = $("#memberPicker"); const needle = String(filter || "").toLowerCase(); const rows = directoryMembers.filter(m => !needle || `${m.name} ${m.position} ${m.department} ${m.team}`.toLowerCase().includes(needle)); if (!rows.length) { list.innerHTML = `<div class="chat-list-empty">Không tìm thấy thành viên phù hợp.</div>`; return; } list.innerHTML = rows.map(m => `<button type="button" class="member-picker-item" data-member-id="${escapeAttr(m.uid)}"><span class="member-picker-avatar">${initials(m.name)}</span><span class="member-picker-copy"><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.position)}${m.department ? ` · ${escapeHTML(m.department)}` : ""}${m.team ? ` · ${escapeHTML(m.team)}` : ""}</small></span><span class="member-picker-arrow">›</span></button>`).join(""); list.querySelectorAll("[data-member-id]").forEach(b => b.addEventListener("click", () => createDirectConversation(b.dataset.memberId))); }
async function createDirectConversation(otherUid) {
    const person = directoryMembers.find(m => m.uid === otherUid); if (!person) return; const ids = [uid, otherUid].sort(); const conversationId = `dm_${ids.join("_")}`;
    try {
        const ref = doc(db, "conversations", conversationId);
        const meIdentity = await getDoc(doc(db, "identities", uid)); const me = meIdentity.exists() ? meIdentity.data() : {}; const meName = me.fullName || me.displayName || me.name || "Thành viên"; const mePosition = me.position || me.title || "Thành viên";
        await setDoc(ref, { type: "direct", memberIds: ids, memberNames: { [uid]: meName, [otherUid]: person.name }, memberPositions: { [uid]: mePosition, [otherUid]: person.position }, title: person.name, subtitle: person.position, lastMessage: "", lastSenderId: "", updatedAt: serverTimestamp(), unreadCount: { [uid]: 0, [otherUid]: 0 } }, { merge: true });
        closeNewChatModal(); await loadConversations(); await openConversation(conversationId);
    } catch (error) { console.error("Lỗi tạo cuộc trò chuyện:", error); alert(`Không thể tạo cuộc trò chuyện: ${error?.code || "Firestore error"}`); }
}
function timestampMillis(value) { if (!value) return 0; if (typeof value?.toMillis === "function") return value.toMillis(); if (typeof value?.toDate === "function") return value.toDate().getTime(); const millis = new Date(value).getTime(); return Number.isNaN(millis) ? 0 : millis; }
function closeNewChatModal() { const modal = $("#newChatModal"); modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); }
function initials(value) { return String(value).trim().split(/\s+/).slice(-2).map(x => x[0]).join("").toUpperCase().slice(0,2) || "C"; }
function formatDate(value) { if (!value) return "Vừa gửi"; const d = typeof value?.toDate === "function" ? value.toDate() : new Date(value); return Number.isNaN(d.getTime()) ? "Vừa gửi" : new Intl.DateTimeFormat("vi-VN", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" }).format(d); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function escapeAttr(value) { return escapeHTML(value); }
