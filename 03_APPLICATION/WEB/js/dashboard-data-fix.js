import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = s => document.querySelector(s);

onAuthStateChanged(auth, async user => {
    if (!user) return;
    try {
        const identitySnap = await getDoc(doc(db, "identities", user.uid));
        const membershipSnap = await getDoc(doc(db, "memberships", `mem_${user.uid}_org_saovn_01`));
        const identity = identitySnap.exists() ? identitySnap.data() : {};
        const membership = membershipSnap.exists() ? membershipSnap.data() : {};
        const name = identity.fullName || identity.displayName || identity.name || user.displayName || user.email?.split("@")[0] || "Thành viên";
        const role = displayRole(membership);
        $("#userIdentity") && ($("#userIdentity").textContent = name);
        $("#topbarIdentity") && ($("#topbarIdentity").textContent = name);
        document.querySelector(".user-info span") && (document.querySelector(".user-info span").textContent = role);

        const tasks = await loadMemberTasks(user.uid);
        renderDashboard(tasks);
    } catch (error) {
        console.error("Dashboard data fix error:", error);
        const note = $(".risk-note");
        if (note) note.innerHTML = `<span>!</span> Không thể tải dữ liệu Work: ${escapeHTML(error?.code || "Firestore error")}`;
    }
});

async function safeQuery(factory) {
    try { return await factory(); }
    catch (error) { console.warn("Dashboard task query skipped:", error?.code || error); return null; }
}

async function loadMemberTasks(uid) {
    const map = new Map();
    const queries = [
        () => getDocs(query(collection(db, "workTasks"), where("assigneeIds", "array-contains", uid), limit(100))),
        () => getDocs(query(collection(db, "workTasks"), where("createdBy", "==", uid), limit(100))),
        () => getDocs(query(collection(db, "workTasks"), where("assigneeId", "==", uid), limit(100)))
    ];
    for (const make of queries) {
        const snap = await safeQuery(make);
        snap?.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
    }
    return [...map.values()];
}

function renderDashboard(tasks) {
    const today = dateKey(new Date());
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "DONE").length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const waiting = tasks.filter(t => ["BACKLOG", "TODO", "REVIEW"].includes(t.status)).length;
    const overdue = tasks.filter(t => toDateKey(t.dueDate) && toDateKey(t.dueDate) < today && t.status !== "DONE").length;
    const score = total ? Math.round(tasks.reduce((sum, t) => sum + progress(t), 0) / total) : 0;

    const cards = document.querySelectorAll(".metric-card");
    if (cards[0]) cards[0].querySelector("strong").textContent = done;
    if (cards[1]) cards[1].querySelector("strong").textContent = overdue;
    if (cards[2]) {
        cards[2].querySelector("strong").textContent = `${score}%`;
        cards[2].querySelector(".metric-head b").textContent = `${score}%`;
        cards[2].querySelector(".progress-line i").style.width = `${score}%`;
    }

    const summary = document.querySelectorAll(".work-summary > div strong");
    if (summary[0]) summary[0].textContent = String(inProgress).padStart(2, "0");
    if (summary[1]) summary[1].textContent = String(done).padStart(2, "0");
    if (summary[2]) summary[2].textContent = String(waiting).padStart(2, "0");
    const ring = document.querySelector(".work-ring");
    if (ring) ring.style.background = `conic-gradient(#2587ff 0 ${score}%, #ffffff0e ${score}% 100%)`;
    if (ring?.querySelector("strong")) ring.querySelector("strong").textContent = `${score}%`;

    const report = document.querySelector(".report-card .report-copy");
    if (report) {
        const p = report.querySelector("p:not(.eyebrow)");
        if (p) p.textContent = `Đang theo dõi ${total} công việc được giao hoặc do bạn tạo. Tiến độ hiện tại ${score}%, ${done} công việc đã hoàn thành và ${overdue} công việc quá hạn.`;
        const ul = report.querySelector("ul");
        if (ul) ul.innerHTML = `<li>Đang thực hiện: ${inProgress}.</li><li>Chờ xử lý/review: ${waiting}.</li><li>Quá hạn: ${overdue}.</li>`;
    }

    const list = $("#work .task-list");
    if (list) {
        const sorted = [...tasks].sort((a,b) => (toDateKey(a.dueDate)||"9999").localeCompare(toDateKey(b.dueDate)||"9999")).slice(0,5);
        list.innerHTML = sorted.length ? sorted.map(t => `<div class="task-item"><i class="task-dot ${t.status === "DONE" ? "blue-dot" : t.status === "IN_PROGRESS" ? "green-dot" : t.priority === "URGENT" ? "red-dot" : "blue-dot"}"></i><div><strong>${escapeHTML(t.title || "Không tên")}</strong><span>${escapeHTML(statusText(t.status))}</span></div><b>${progress(t)}%</b></div>`).join("") : emptyTask();
    }

    const todayList = document.querySelector(".today-list");
    if (todayList) {
        const todayTasks = tasks.filter(t => toDateKey(t.dueDate) === today).slice(0,5);
        todayList.innerHTML = todayTasks.length ? todayTasks.map(t => `<div><i class="check">${t.status === "DONE" ? "✓" : "•"}</i><span>${escapeHTML(t.title || "Không tên")}</span><time>${t.status === "DONE" ? "Xong" : "Hôm nay"}</time></div>`).join("") : `<div><i class="check">✓</i><span>Không có công việc đến hạn hôm nay</span><time>—</time></div>`;
    }

    const risk = document.querySelector(".risk-note");
    if (risk) risk.innerHTML = `<span>!</span> ${overdue} công việc quá hạn trong phạm vi hiện tại.`;
}

function displayRole(m) {
    const roles = m?.roles || {};
    const system = Array.isArray(roles.system) ? roles.system : [];
    const org = Array.isArray(roles.organization) ? roles.organization : [];
    if (system.includes("system_admin")) return "System Administrator";
    const r = org[0] || "member";
    return ({admin:"Administrator",org_admin:"Organization Administrator",organization_admin:"Organization Administrator",manager:"Manager",org_manager:"Organization Manager",member:"Thành viên"}[r] || String(r).replaceAll("_", " "));
}
function progress(t) { return ({DONE:100,REVIEW:75,IN_PROGRESS:50,TODO:0,BACKLOG:0}[t.status] ?? Number(t.progress) || 0); }
function dateKey(v) { const d = v instanceof Date ? v : new Date(v); if (Number.isNaN(d.getTime())) return ""; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function toDateKey(v) { if (!v) return ""; if (typeof v?.toDate === "function") return dateKey(v.toDate()); return dateKey(v); }
function statusText(v) { return ({BACKLOG:"Backlog",TODO:"Chờ xử lý",IN_PROGRESS:"Đang thực hiện",REVIEW:"Đang review",DONE:"Hoàn thành"}[v] || "Chưa xác định"); }
function emptyTask() { return `<div class="task-item"><i class="task-dot blue-dot"></i><div><strong>Chưa có công việc</strong><span>Công việc được giao sẽ xuất hiện tại đây</span></div><b>—</b></div>`; }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
