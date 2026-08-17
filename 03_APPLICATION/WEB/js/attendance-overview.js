import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const leaderboard = document.getElementById("attendanceLeaderboard");
const attendancePeriod = document.getElementById("attendancePeriod");
const attendanceScope = document.getElementById("attendanceScope");
const attendanceMeta = document.getElementById("attendanceMeta");

const PERIODS = { today: 1, week: 7, month: 30 };

onAuthStateChanged(auth, async (user) => {
    if (!user || !leaderboard) return;
    await loadAttendanceLeaderboard(user.uid);
});

attendancePeriod?.addEventListener("change", () => {
    const user = auth.currentUser;
    if (user) loadAttendanceLeaderboard(user.uid);
});

attendanceScope?.addEventListener("change", () => {
    const user = auth.currentUser;
    if (user) loadAttendanceLeaderboard(user.uid);
});

async function loadAttendanceLeaderboard(currentUid) {
    renderLoading();
    try {
        const days = PERIODS[attendancePeriod?.value || "week"] || 7;
        const start = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
        const attendanceSnap = await getDocs(query(
            collection(db, "attendanceDays"),
            where("date", ">=", dateKey(start))
        ));
        const records = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const grouped = groupByUser(records);
        const rows = Object.values(grouped).map(item => {
            const rate = Math.round((item.accessedDays / days) * 100);
            return { ...item, rate, current: item.userId === currentUid };
        }).sort((a, b) => b.rate - a.rate || b.lastAccessMs - a.lastAccessMs || a.name.localeCompare(b.name, "vi"));

        if (!rows.length) {
            renderEmpty("Chưa có dữ liệu điểm danh trong khoảng thời gian này.");
            return;
        }
        renderRows(rows, days);
        if (attendanceMeta) attendanceMeta.textContent = `${rows.length} thành viên · tính theo mức độ truy cập hệ thống`;
    } catch (error) {
        console.error("Attendance leaderboard error:", error);
        renderEmpty(error?.code === "permission-denied" ? "Chưa được cấp quyền xem bảng điểm danh." : "Không thể tải bảng điểm danh.");
    }
}

function groupByUser(records) {
    const map = {};
    records.forEach(record => {
        const userId = record.userId;
        if (!userId) return;
        const item = map[userId] ||= { userId, name: record.fullName || record.displayName || "Thành viên", department: record.departmentName || "", accessedDays: 0, lastAccessMs: 0, active: false };
        if (record.hasAccess) item.accessedDays++;
        const last = toMillis(record.lastAccessAt);
        item.lastAccessMs = Math.max(item.lastAccessMs, last);
        item.active = item.active || record.status === "ACTIVE";
        if (!item.name || item.name === "Thành viên") item.name = record.fullName || record.displayName || item.name;
    });
    return map;
}

function renderRows(rows, days) {
    leaderboard.innerHTML = rows.map((row, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1);
        const status = row.active ? "Đang hoạt động" : "Đã rời";
        const statusClass = row.active ? "is-active" : "is-away";
        return `<div class="attendance-row ${row.current ? "is-current" : ""}">
            <div class="attendance-rank">${medal}</div>
            <div class="attendance-person"><strong>${escapeHTML(row.name)}</strong><span>${escapeHTML(row.department || "Thành viên")}</span></div>
            <div class="attendance-rate"><strong>${row.accessedDays}/${days}</strong><span>${row.rate}%</span></div>
            <div class="attendance-status ${statusClass}"><i></i>${status}</div>
        </div>`;
    }).join("");
}

function renderLoading() {
    leaderboard.innerHTML = `<div class="attendance-empty">Đang tải bảng điểm danh…</div>`;
}
function renderEmpty(message) {
    leaderboard.innerHTML = `<div class="attendance-empty">${escapeHTML(message)}</div>`;
}
function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function toMillis(value) { if (!value) return 0; if (typeof value.toMillis === "function") return value.toMillis(); if (typeof value.toDate === "function") return value.toDate().getTime(); const n = Date.parse(value); return Number.isNaN(n) ? 0 : n; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
