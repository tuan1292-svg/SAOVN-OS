// js/dashboard.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const userIdentity = document.getElementById("userIdentity");
const topbarIdentity = document.getElementById("topbarIdentity");
const welcomeIdentity = document.getElementById("welcomeIdentity");
const logoutButton = document.getElementById("logoutButton");
const currentDate = document.getElementById("currentDate");
const userRoleText = document.querySelector(".user-info span");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            updateUI("Đang tải...", "Khởi tạo dữ liệu...");
            const identityRef = doc(db, "identities", user.uid);
            let identitySnap = await getDoc(identityRef);
            if (!identitySnap.exists()) {
                await setDoc(identityRef, {
                    fullName: "Nguyễn Anh Tuấn",
                    email: user.email,
                    status: "active",
                    createdAt: new Date().toISOString()
                });
                identitySnap = await getDoc(identityRef);
            }

            const membershipRef = doc(db, "memberships", `mem_${user.uid}_org_saovn_01`);
            let membershipSnap = await getDoc(membershipRef);
            if (!membershipSnap.exists()) {
                await setDoc(membershipRef, {
                    identityId: user.uid,
                    organizationId: "org_saovn_01",
                    status: "active",
                    roles: { system: ["system_admin"], organization: ["org_member"] },
                    joinedAt: new Date().toISOString()
                });
                membershipSnap = await getDoc(membershipRef);
            }

            const fullName = identitySnap.data().fullName;
            let displayRole = "Thành viên";
            const roles = membershipSnap.data().roles;
            if (roles?.system?.includes("system_admin")) {
                displayRole = "System Administrator";
            } else if (roles?.organization) {
                displayRole = roles.organization[0].replace("_", " ").toUpperCase();
            }
            updateUI(fullName, displayRole);
            await loadWorkDashboard();
        } catch (error) {
            console.error("Lỗi kéo dữ liệu từ Firestore:", error);
            updateUI("Lỗi dữ liệu", "Vui lòng kiểm tra kết nối");
        }
    } else {
        window.location.href = "index.html";
    }
});

function updateUI(name, roleInfo) {
    if (userIdentity) userIdentity.textContent = name;
    if (topbarIdentity) topbarIdentity.textContent = name;
    if (welcomeIdentity) welcomeIdentity.textContent = name;
    if (userRoleText) userRoleText.textContent = roleInfo;
}

async function loadWorkDashboard() {
    const snap = await getDocs(collection(db, "workTasks"));
    const tasks = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    const today = new Date().toISOString().slice(0, 10);
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const done = tasks.filter(t => t.status === "DONE").length;
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "DONE").length;
    const waiting = tasks.filter(t => ["BACKLOG", "TODO", "REVIEW"].includes(t.status)).length;

    // Tiến độ tổng thể: DONE=100%, REVIEW=75%, IN_PROGRESS=50%, TODO/BACKLOG=0%.
    const score = total ? Math.round(tasks.reduce((sum, t) => sum + ({ DONE: 1, REVIEW: .75, IN_PROGRESS: .5, TODO: 0, BACKLOG: 0 }[t.status] || 0), 0) / total * 100) : 0;

    const metricCards = document.querySelectorAll(".metric-card");
    if (metricCards[0]) metricCards[0].querySelector("strong").textContent = done;
    if (metricCards[1]) metricCards[1].querySelector("strong").textContent = overdue;
    if (metricCards[2]) {
        metricCards[2].querySelector("strong").textContent = `${score}%`;
        metricCards[2].querySelector(".progress-line i").style.width = `${score}%`;
        metricCards[2].querySelector(".metric-head b").textContent = `${score}%`;
    }

    const summary = document.querySelectorAll(".work-summary > div strong");
    if (summary[0]) summary[0].textContent = String(inProgress).padStart(2, "0");
    if (summary[1]) summary[1].textContent = String(done).padStart(2, "0");
    if (summary[2]) summary[2].textContent = String(waiting).padStart(2, "0");

    const ring = document.querySelector(".work-ring");
    const ringText = ring?.querySelector("strong");
    if (ring) ring.style.background = `conic-gradient(#2587ff 0 ${score}%, #ffffff0e ${score}% 100%)`;
    if (ringText) ringText.textContent = `${score}%`;

    renderDashboardTasks(tasks);
    renderTodayTasks(tasks, today);
}

function renderDashboardTasks(tasks) {
    const list = document.querySelector("#work .task-list");
    if (!list) return;
    const statusText = { BACKLOG: "Backlog", TODO: "Chờ xử lý", IN_PROGRESS: "Đang thực hiện", REVIEW: "Đang review", DONE: "Hoàn thành" };
    const sorted = [...tasks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 5);
    list.innerHTML = sorted.length ? sorted.map(t => {
        const color = t.status === "DONE" ? "blue-dot" : t.status === "IN_PROGRESS" ? "green-dot" : t.status === "REVIEW" ? "orange-dot" : t.priority === "URGENT" ? "red-dot" : "blue-dot";
        return `<div class="task-item"><i class="task-dot ${color}"></i><div><strong>${escapeHTML(t.title || "Không tên")}</strong><span>${statusText[t.status] || "Chưa xác định"}</span></div><b>${t.status === "DONE" ? "100%" : t.status === "REVIEW" ? "75%" : t.status === "IN_PROGRESS" ? "50%" : "0%"}</b></div>`;
    }).join("") : `<div class="task-item"><i class="task-dot blue-dot"></i><div><strong>Chưa có công việc</strong><span>Hãy tạo công việc đầu tiên trong Work</span></div><b>—</b></div>`;
}

function renderTodayTasks(tasks, today) {
    const list = document.querySelector(".today-list");
    if (!list) return;
    const todayTasks = tasks.filter(t => t.dueDate === today).slice(0, 5);
    list.innerHTML = todayTasks.length ? todayTasks.map(t => `<div><i class="check">${t.status === "DONE" ? "✓" : "•"}</i><span>${escapeHTML(t.title || "Không tên")}</span><time>${t.status === "DONE" ? "Xong" : (t.assignee ? escapeHTML(t.assignee) : "Hôm nay")}</time></div>`).join("") : `<div><i class="check">✓</i><span>Không có công việc đến hạn hôm nay</span><time>—</time></div>`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => signOut(auth).catch(error => console.error("Lỗi khi đăng xuất:", error)));
}

if (currentDate) {
    currentDate.textContent = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
}

document.querySelectorAll('a[href="#work"]').forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        window.location.href = "work.html";
    });
});

document.querySelectorAll('a[href="#"]').forEach(link => link.addEventListener("click", e => e.preventDefault()));

const workReportModal = document.getElementById("workReportModal");
const openReportBtn = document.getElementById("openReportBtn");
const closeReportBtn = document.getElementById("closeReportBtn");
if (workReportModal && openReportBtn && closeReportBtn) {
    openReportBtn.addEventListener("click", e => { e.preventDefault(); workReportModal.classList.add("active"); });
    closeReportBtn.addEventListener("click", () => workReportModal.classList.remove("active"));
    workReportModal.addEventListener("click", e => { if (e.target === workReportModal) workReportModal.classList.remove("active"); });
}
