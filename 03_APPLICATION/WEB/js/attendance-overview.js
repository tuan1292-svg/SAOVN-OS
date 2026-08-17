import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const panel = document.getElementById("attendance");
const leaderboard = document.getElementById("attendanceLeaderboard");
const attendancePeriod = document.getElementById("attendancePeriod");
const attendanceScope = document.getElementById("attendanceScope");
const attendanceMeta = document.getElementById("attendanceMeta");
const PERIODS = { today: 1, week: 7, month: 30 };

prepareCompactCard();
onAuthStateChanged(auth, async (user) => { if (!user || !leaderboard) return; await loadAttendanceLeaderboard(user.uid); });
attendancePeriod?.addEventListener("change", () => auth.currentUser && loadAttendanceLeaderboard(auth.currentUser.uid));
attendanceScope?.addEventListener("change", () => auth.currentUser && loadAttendanceLeaderboard(auth.currentUser.uid));

function prepareCompactCard() {
    if (!panel) return;
    const sideStack = document.querySelector(".content-grid .side-stack");
    if (sideStack) sideStack.appendChild(panel);
    panel.classList.add("attendance-compact");
    const style = document.createElement("style");
    style.textContent = `
        .attendance-panel.attendance-compact{margin-top:0;padding:14px 15px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,#101d31c2,#070f1daa);backdrop-filter:blur(20px);box-shadow:inset 0 1px #ffffff09,0 18px 50px #00000022}
        .attendance-compact .attendance-head{display:block;margin-bottom:10px}
        .attendance-compact .attendance-head h2{font-size:14px;margin:3px 0}
        .attendance-compact .attendance-head p{font-size:10px}
        .attendance-compact .attendance-head .eyebrow{font-size:9px}
        .attendance-compact .attendance-controls{margin-top:8px}
        .attendance-compact .attendance-controls select{width:100%;padding:6px 8px;font-size:11px}
        .attendance-compact .attendance-list{gap:4px}
        .attendance-compact .attendance-row{grid-template-columns:24px minmax(0,1fr) 48px;padding:7px;gap:6px;border-radius:8px}
        .attendance-compact .attendance-rank{font-size:12px}
        .attendance-compact .attendance-person strong{font-size:11px}
        .attendance-compact .attendance-person span{font-size:9px}
        .attendance-compact .attendance-rate{text-align:right}
        .attendance-compact .attendance-rate strong{font-size:10px}
        .attendance-compact .attendance-rate span{font-size:9px}
        .attendance-compact .attendance-status{display:none}
        .attendance-compact .attendance-more{font-size:10px;padding:4px}
        .attendance-compact .attendance-meta{font-size:9px;margin-top:6px}
    `;
    document.head.appendChild(style);
}

async function loadAttendanceLeaderboard(currentUid) {
    renderLoading();
    try {
        const days = PERIODS[attendancePeriod?.value || "week"] || 7;
        const start = startOfDay(new Date(Date.now() - (days - 1) * 86400000));
        const members = await loadMembersFromIdentity();
        const attendanceSnap = await getDocs(query(collection(db, "attendanceDays"), where("date", ">=", dateKey(start))));
        const byUser = groupByUser(attendanceSnap.docs.map(d => d.data()));
        let rows = members.map(member => {
            const item = byUser[member.userId] || { accessedDays: 0, lastAccessMs: 0 };
            return { ...member, ...item, rate: Math.min(100, Math.round((item.accessedDays / days) * 100)), current: member.userId === currentUid };
        });
        const scope = attendanceScope?.value || "all";
        if (scope !== "all") rows = rows.filter(row => String(row.department || "").toLowerCase() === scope.toLowerCase() || String(row.team || "").toLowerCase() === scope.toLowerCase());
        rows.sort((a, b) => b.rate - a.rate || b.accessedDays - a.accessedDays || b.lastAccessMs - a.lastAccessMs || a.name.localeCompare(b.name, "vi"));
        renderRows(rows, days);
        if (attendanceMeta) attendanceMeta.textContent = `${rows.length} thành viên · xếp theo độ đều đặn`;
    } catch (error) {
        console.error("Attendance leaderboard error:", error);
        renderEmpty(error?.code === "permission-denied" ? "Chưa được cấp quyền xem dữ liệu điểm danh." : "Không thể tải bảng điểm danh.");
    }
}

async function loadMembersFromIdentity() {
    const snap = await getDocs(query(collection(db, "identities"), where("status", "==", "ACTIVE")));
    return snap.docs.map(item => {
        const data = item.data();
        return { userId: item.id, name: data.fullName || data.displayName || "Thành viên", department: data.departmentName || data.department || "", team: data.teamName || data.team || "" };
    });
}

function groupByUser(records) { const map = {}; records.forEach(record => { if (!record.userId) return; const item = map[record.userId] ||= { userId: record.userId, accessedDays: 0, lastAccessMs: 0 }; if (record.hasAccess) item.accessedDays++; item.lastAccessMs = Math.max(item.lastAccessMs, toMillis(record.lastAccessAt)); }); return map; }
function renderRows(rows, days) { if (!rows.length) return renderEmpty("Chưa có thành viên trong phạm vi điểm danh này."); const visible = rows.slice(0, 5); leaderboard.innerHTML = visible.map((row, index) => { const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1); return `<div class="attendance-row ${row.current ? "is-current" : ""}"><div class="attendance-rank">${medal}</div><div class="attendance-person"><strong>${escapeHTML(row.name)}</strong><span>${escapeHTML(row.department || row.team || "Thành viên")}</span></div><div class="attendance-rate"><strong>${row.accessedDays}/${days}</strong><span>${row.rate}%</span></div></div>`; }).join(""); if (rows.length > visible.length) leaderboard.insertAdjacentHTML("beforeend", `<div class="attendance-more">+ ${rows.length - visible.length} thành viên khác</div>`); }
function renderLoading() { leaderboard.innerHTML = `<div class="attendance-empty">Đang tải…</div>`; }
function renderEmpty(message) { leaderboard.innerHTML = `<div class="attendance-empty">${escapeHTML(message)}</div>`; }
function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function toMillis(value) { if (!value) return 0; if (typeof value.toMillis === "function") return value.toMillis(); if (typeof value.toDate === "function") return value.toDate().getTime(); const n = Date.parse(value); return Number.isNaN(n) ? 0 : n; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
