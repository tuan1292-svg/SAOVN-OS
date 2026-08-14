import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy, limit, updateDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = (s) => document.querySelector(s);
let notifications = [];
let activeFilter = "all";
let currentUid = "";

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    currentUid = user.uid;
    try {
        const snap = await getDocs(query(collection(db, "notifications", user.uid, "items"), orderBy("createdAt", "desc"), limit(100)));
        notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const name = user.displayName || user.email?.split("@")[0] || "Thành viên";
        [$("#userIdentity"), $("#topbarIdentity")].forEach(el => { if (el) el.textContent = name; });
        render();
    } catch (error) {
        console.error("Lỗi tải notifications:", error);
        $("#notificationStatus").textContent = error?.code === "permission-denied" ? "Không đủ quyền truy cập thông báo" : "Không thể tải thông báo";
        renderEmpty("Không thể tải thông báo", "Kiểm tra Firestore Rules và thử lại.");
    }
});

function render() {
    const filtered = activeFilter === "unread" ? notifications.filter(n => n.read !== true) : notifications;
    const unread = notifications.filter(n => n.read !== true).length;
    $("#unreadBadge").textContent = unread > 99 ? "99+" : String(unread);
    $("#notificationStatus").textContent = `${notifications.length} thông báo · ${unread} chưa đọc`;
    const list = $("#notificationList");
    if (!filtered.length) { renderEmpty(activeFilter === "unread" ? "Bạn đã xem hết" : "Chưa có thông báo", activeFilter === "unread" ? "Không còn thông báo chưa đọc." : "Thông báo mới sẽ xuất hiện tại đây."); return; }
    list.innerHTML = filtered.map(notificationCard).join("");
    list.querySelectorAll("[data-read]").forEach(button => button.addEventListener("click", () => markRead(button.dataset.read)));
}

function notificationCard(n) {
    const unread = n.read !== true;
    const title = escapeHTML(n.title || "Thông báo hệ thống");
    const body = escapeHTML(n.body || n.message || "");
    const type = String(n.type || "SYSTEM").toUpperCase();
    const icon = type.includes("CHAT") ? "▢" : type.includes("WORK") ? "▤" : type.includes("MENTION") ? "@" : "♧";
    const date = formatDate(n.createdAt);
    return `<article class="notification-item ${unread ? "unread" : ""}"><div class="notification-icon">${icon}</div><div class="notification-copy"><strong>${title}</strong><p>${body}</p><time>${date}</time></div><div class="notification-actions">${unread ? `<button type="button" data-read="${escapeAttr(n.id)}">Đã đọc</button>` : `<span></span>`}</div></article>`;
}

async function markRead(id) {
    if (!currentUid || !id) return;
    try { await updateDoc(doc(db, "notifications", currentUid, "items", id), { read: true, readAt: new Date().toISOString() }); const item = notifications.find(n => n.id === id); if (item) item.read = true; render(); }
    catch (error) { console.error("Lỗi đánh dấu notification:", error); }
}

$("#markAllRead")?.addEventListener("click", async () => {
    const unread = notifications.filter(n => n.read !== true);
    if (!currentUid || !unread.length) return;
    try { const batch = writeBatch(db); unread.forEach(n => batch.update(doc(db, "notifications", currentUid, "items", n.id), { read: true, readAt: new Date().toISOString() })); await batch.commit(); notifications.forEach(n => { n.read = true; }); render(); }
    catch (error) { console.error("Lỗi đánh dấu tất cả:", error); }
});

document.querySelectorAll(".filter-tab").forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.filter; document.querySelectorAll(".filter-tab").forEach(b => b.classList.toggle("active", b === button)); render(); }));
$("#logoutButton")?.addEventListener("click", () => signOut(auth));
function renderEmpty(title, detail) { const list = $("#notificationList"); if (list) list.innerHTML = `<div class="notification-empty"><strong>${escapeHTML(title)}</strong><span>${escapeHTML(detail)}</span></div>`; }
function formatDate(value) { if (!value) return "Vừa cập nhật"; const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value); if (Number.isNaN(date.getTime())) return "Vừa cập nhật"; return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function escapeAttr(value) { return escapeHTML(value); }
