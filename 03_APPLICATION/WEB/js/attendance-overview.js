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
        const members = await loadMembers();
        const attendanceSnap = await getDocs(query(collection(db, "attendanceDays"), where("date", ">=", dateKey(start))));
        const records = attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const byUser = groupByUser(records);
        let rows = members.map(member => {
            const item = byUser[member.userId] || { accessedDays: 0, lastAccessMs: 0, active: false };
            return { ...member, ...item, rate: Math.min(100, Math.round((item.accessedDays / days) * 100)), current: member.userId === currentUid };
        });
        const scope = attendanceScope?.value || "all";
        if (scope !== "all") rows = rows.filter(row => String(row.department || "").toLowerCase() === scope.toLowerCase() || String(row.team || "").toLowerCase() === scope.toLowerCase());
        rows.sort((a, b) => b.rate - a.rate || b.accessedDays - a.accessedDays || b.lastAccessMs - a.lastAccessMs || a.name.localeCompare(b.name, "vi"));
        renderRows(rows, days);
        if (attendanceMeta) attendanceMeta.textContent = `${rows.length} thành viên · xếp theo độ đều đặn truy cập hệ thống`;
    } catch (error) {
        console.error("Attendance leaderboard error:", error);
        renderEmpty(error?.code === "permission-denied" ? "Chưa được cấp quyền xem dữ liệu điểm danh. Vui lòng triển khai Firestore Rules mới." : "Không thể tải bảng điểm danh.");
    }
}

async function loadMembers() {
    const members = [];
    try {
        const membershipsSnap = await getDocs(query(collection(db, "memberships"), where("status", "==", "ACTIVE")));
        for (const membershipDoc of membershipsSnap.docs) {
            const membership = membershipDoc.data();
            const userId = membership.userId || membership.uid || membership.memberId || membership.identityId;
            if (!userId) continue;
            members.push(await buildMember(userId, membership));
        }
    } catch (error) {
        console.warn("Attendance memberships query skipped; using identity fallback:", error?.code || error);
        try {
            const identitiesSnap = await getDocs(query(collection(db, "identities"), where("status", "==", "ACTIVE")));
            identitiesSnap.docs.forEach(identityDoc => {
                const identity = identityDoc.data();
                members.push({ userId: identityDoc.id, name: identity.fullName || identity.displayName || "Thành viên", department: identity.departmentName || identity.department || "", team: identity.teamName || identity.team || "" });
            });
        } catch (identityError) {
            console.warn("Attendance identity fallback skipped:", identityError?.code || identityError);
        }
    }
    return dedupeMembers(members);
}

async function buildMember(userId, membership) {
    let identity = {};
    try {
        const identitySnap = await getDoc(doc(db, "identities", userId));
        if (identitySnap.exists()) identity = identitySnap.data();
    } catch (error) { console.warn("Attendance identity lookup skipped:", userId, error?.code || error); }
    return { userId, name: identity.fullName || identity.displayName || membership.fullName || membership.displayName || membership.name || "Thành viên", department: membership.departmentName || membership.department || identity.departmentName || identity.department || "", team: membership.teamName || membership.team || identity.teamName || identity.team || "" };
}

function dedupeMembers(members) { const map = new Map(); members.forEach(member => { if (member.userId && !map.has(member.userId)) map.set(member.userId, member); }); return [...map.values()]; }
function groupByUser(records) { const map = {}; records.forEach(record => { if (!record.userId) return; const item = map[record.userId] ||= { userId: record.userId, accessedDays: 0, lastAccessMs: 0, active: false }; if (record.hasAccess) item.accessedDays++; item.lastAccessMs = Math.max(item.lastAccessMs, toMillis(record.lastAccessAt)); item.active = item.active || record.status === "ACTIVE"; }); return map; }
function renderRows(rows, days) { if (!rows.length) return renderEmpty("Chưa có thành viên trong phạm vi điểm danh này."); const visible = rows.slice(0, 7); leaderboard.innerHTML = visible.map((row, index) => { const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : String(index + 1); const status = row.active ? "Đang hoạt động" : row.accessedDays ? "Đã rời" : "Chưa truy cập"; const statusClass = row.active ? "is-active" : row.accessedDays ? "is-away" : "is-missing"; return `<div class="attendance-row ${row.current ? "is-current" : ""}"><div class="attendance-rank">${medal}</div><div class="attendance-person"><strong>${escapeHTML(row.name)}</strong><span>${escapeHTML(row.department || row.team || "Thành viên")}</span></div><div class="attendance-rate"><strong>${row.accessedDays}/${days}</strong><span>${row.rate}%</span></div><div class="attendance-status ${statusClass}"><i></i>${status}</div></div>`; }).join(""); if (rows.length > visible.length) { leaderboard.insertAdjacentHTML("beforeend", `<div class="attendance-more">+ ${rows.length - visible.length} thành viên khác</div>`); } }
function renderLoading() { leaderboard.innerHTML = `<div class="attendance-empty">Đang tải…</div>`; }
function renderEmpty(message) { leaderboard.innerHTML = `<div class="attendance-empty">${escapeHTML(message)}</div>`; }
function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function toMillis(value) { if (!value) return 0; if (typeof value.toMillis === "function") return value.toMillis(); if (typeof value.toDate === "function") return value.toDate().getTime(); const n = Date.parse(value); return Number.isNaN(n) ? 0 : n; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
