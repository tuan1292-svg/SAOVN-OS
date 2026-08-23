import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, orderBy, limit, updateDoc, doc, writeBatch, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = (s) => document.querySelector(s);
let notifications = [];
let activeFilter = "all";
let currentUid = "";
let stopNotifications = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    currentUid = user.uid;
    try {
        const identity = await getDoc(doc(db, "identities", user.uid));
        const data = identity.exists() ? identity.data() : {};
        const name = data.fullName || data.displayName || data.name || user.displayName || user.email?.split("@")[0] || "Thành viên";
        [$("#userIdentity"), $("#topbarIdentity")].forEach(el => { if (el) el.textContent = name; });
        const ref = collection(db, "notifications", user.uid, "items");
        stopNotifications?.();
        stopNotifications = onSnapshot(query(ref, orderBy("createdAt", "desc"), limit(100)), snap => {
            notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            render();
        }, error => {
            console.error("Lỗi realtime notifications:", error);
            const status = $("#notificationStatus");
            if (status) status.textContent = error?.code === "permission-denied" ? "Không đủ quyền truy cập thông báo" : "Không thể tải thông báo";
            renderEmpty("Không thể tải thông báo", "Kiểm tra Firestore Rules và thử lại.");
        });
    } catch (error) {
        console.error("Lỗi khởi tạo notifications:", error);
        renderEmpty("Không thể tải thông báo", "Thử tải lại trang.");
    }
});

function render() {
    const filtered = activeFilter === "unread" ? notifications.filter(n => n.read !== true) : notifications;
    const unread = notifications.filter(n => n.read !== true).length;
    if ($("#unreadBadge")) $("#unreadBadge").textContent = unread > 99 ? "99+" : String(unread);
    if ($("#notificationStatus")) $("#notificationStatus").textContent = `${notifications.length} thông báo · ${unread} chưa đọc`;
    const list = $("#notificationList");
    if (!list) return;
    if (!filtered.length) { renderEmpty(activeFilter === "unread" ? "Bạn đã xem hết" : "Chưa có thông báo", activeFilter === "unread" ? "Không còn thông báo chưa đọc." : "Thông báo mới sẽ xuất hiện tại đây."); return; }
    list.innerHTML = filtered.map(notificationCard).join("");
    list.querySelectorAll("[data-read]").forEach(button => button.addEventListener("click", e => { e.stopPropagation(); markRead(button.dataset.read); }));
    list.querySelectorAll("[data-target]").forEach(card => card.addEventListener("click", () => openTarget(card.dataset.target, card.dataset.read)));
}

function notificationCard(n) {
    const unread = n.read !== true;
    const title = escapeHTML(n.title || "Thông báo hệ thống");
    const body = escapeHTML(n.body || n.message || "");
    const type = String(n.type || "SYSTEM").toUpperCase();
    const icon = type.includes("CHAT") ? "▢" : type.includes("WORK") ? "▤" : type.includes("MENTION") ? "@" : "♧";
    const date = formatDate(n.createdAt);
    const target = n.targetUrl || n.url || "";
    return `<article class="notification-item ${unread ? "unread" : ""} ${target ? "clickable" : ""}" ${target ? `data-target="${target}"` : ""} data-read="${escapeAttr(n.id)}"><div class="notification-icon">${icon}</div><div class="notification-copy"><strong>${title}</strong><p>${body}</p><time>${date}</time></div><div class="notification-actions">${unread ? `<button type="button" data-read="${escapeAttr(n.id)}">Đã đọc</button>` : `<span></span>`}</div></article>`;
}

async function markRead(id) {
    if (!currentUid || !id) return;
    try { await updateDoc(doc(db, "notifications", currentUid, "items", id), { read: true, readAt: new Date().toISOString() }); }
    catch (error) { console.error("Lỗi đánh dấu notification:", error); }
}

async function markAllRead() {
    const unread = notifications.filter(n => n.read !== true);
    if (!currentUid || !unread.length) return;
    try {
        const batch = writeBatch(db);
        unread.forEach(n => batch.update(doc(db, "notifications", currentUid, "items", n.id), { read: true, readAt: new Date().toISOString() }));
        await batch.commit();
    } catch (error) { console.error("Lỗi đánh dấu tất cả:", error); }
}

async function openTarget(target, id) {
    await markRead(id);
    if (!target) return;
    if (/^https?:\/\//i.test(target)) { window.location.href = target; return; }
    const safe = target.startsWith("/") ? target : `./${target}`;
    window.location.href = safe;
}

$("#markAllRead")?.addEventListener("click", markAllRead);
document.querySelectorAll(".filter-tab").forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.filter; document.querySelectorAll(".filter-tab").forEach(b => b.classList.toggle("active", b === button)); render(); }));
$("#logoutButton")?.addEventListener("click", () => signOut(auth));
function renderEmpty(title, detail) { const list = $("#notificationList"); if (list) list.innerHTML = `<div class="notification-empty"><strong>${escapeHTML(title)}</strong><span>${escapeHTML(detail)}</span></div>`; }
function formatDate(value) { if (!value) return "Vừa cập nhật"; const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value); if (Number.isNaN(date.getTime())) return "Vừa cập nhật"; return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function escapeAttr(value) { return escapeHTML(value); }