import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const leaderboard = document.getElementById("attendanceLeaderboard");
const attendancePeriod = document.getElementById("attendancePeriod");
const attendanceScope = document.getElementById("attendanceScope");
const attendanceMeta = document.getElementById("attendanceMeta");
const PERIODS = { today: 1, week: 7, month: 30 };

onAuthStateChanged(auth, async (user) => { if (!user || !leaderboard) return; await loadAttendanceLeaderboard(user.uid); });
attendancePeriod?.addEventListener("change", () => auth.currentUser && loadAttendanceLeaderboard(auth.currentUser.uid));
attendanceScope?.addEventListener("change", () => auth.currentUser && loadAttendanceLeaderboard(auth.currentUser.uid));

async function loadAttendanceLeaderboard(currentUid) {
    renderLoading();
    try {
        const days = PERIODS[attendancePeriod?.value || "week"] || 7;
        const start = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
        const membershipsSnap = await getDocs(query(collection(db, "memberships"), where("status", "==", "ACTIVE")));
        const members = [];
        for (const membershipDoc of membershipsSnap.docs) {
            const membership = membershipDoc.data();
            const userId = membership.userId || membership.uid || membership.memberId || membership.identityId;
            if (!userId) continue;
            const identitySnap = await getDoc(doc(db, "identities", userId));
            const identity = identitySnap.exists() ? identitySnap.data() : {};
            members.push({ userId, name: identity.fullName || identity.displayName || membership.fullName || membership.displayName || membership.name || "Thành viên", department: membership.departmentName || membership.department || "", team: membership.teamName || membership.team || "" });
        }
        const attendanceSnap = await getDocs(query(collection(db, "attendanceDays"), where("date", ">=", dateKey(start))));
        const records = attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const byUser = groupByUser(records);
        let rows = members.map(member => { const item = byUser[member.userId] || { accessedDays: 0, lastAccessMs: 0, active: false }; return { ...member, ...item, rate: Math.round((item.accessedDays / days) * 100), current: member.userId === currentUid }; });
        const scope = attendanceScope?.value || "all";
        if (scope !== "all") rows = rows.filter(row => String(row.department || "").toLowerCase() === scope.toLowerCase() || String(row.team || "").toLowerCase() === scope.toLowerCase());
        rows.sort((a, b) => b.rate - a.rate || b.accessedDays - a.accessedDays || b.lastAccessMs - a.lastAccessMs || a.name.localeCompare(b.name, "vi"));
        renderRows(rows, days);
        if (attendanceMeta) attendanceMeta.textContent = `${rows.length} thành viên · xếp theo độ đều đặn truy cập hệ thống`;
    } catch (error) { console.error("Attendance leaderboard error:", error); renderEmpty(error?.code === "permission-denied" ? "Chưa được cấp quyền xem bảng điểm danh của tập thể." : "Không thể tải bảng điểm danh."); }
}

function groupByUser(records) { const map = {}; records.forEach(record => { if (!record.userId) return; const item = map[record.userId] ||= { userId: record.userId, accessedDays: 0, lastAccessMs: 0, active: false }; if (record.hasAccess) item.accessedDays++; item.lastAccessMs = Math.max(item.lastAccessMs, toMillis(record.lastAccessAt)); item.active = item.active || record.status === "ACTIVE"; }); return map; }
function renderRows(rows, days) { if (!rows.length) return renderEmpty("Chưa có thành viên trong phạm vi điểm danh này."); leaderboard.innerHTML = rows.map((row, index) => { const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1); const status = row.active ? "Đang hoạt động" : row.accessedDays ? "Đã rời" : "Chưa truy cập"; const statusClass = row.active ? "is-active" : row.accessedDays ? "is-away" : "is-missing"; return `<div class="attendance-row ${row.current ? "is-current" : ""}"><div class="attendance-rank">${medal}</div><div class="attendance-person"><strong>${escapeHTML(row.name)}</strong><span>${escapeHTML(row.department || row.team || "Thành viên")}</span></div><div class="attendance-rate"><strong>${row.accessedDays}/${days}</strong><span>${row.rate}%</span></div><div class="attendance-status ${statusClass}"><i></i>${status}</div></div>`; }).join(""); }
function renderLoading() { leaderboard.innerHTML = `<div class="attendance-empty">Đang tải bảng thành tích điểm danh…</div>`; }
function renderEmpty(message) { leaderboard.innerHTML = `<div class="attendance-empty">${escapeHTML(message)}</div>`; }
function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function toMillis(value) { if (!value) return 0; if (typeof value.toMillis === "function") return value.toMillis(); if (typeof value.toDate === "function") return value.toDate().getTime(); const n = Date.parse(value); return Number.isNaN(n) ? 0 : n; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
