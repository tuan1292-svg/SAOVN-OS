// js/dashboard.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const userIdentity = document.getElementById("userIdentity");
const topbarIdentity = document.getElementById("topbarIdentity");
const welcomeIdentity = document.getElementById("welcomeIdentity");
const logoutButton = document.getElementById("logoutButton");
const currentDate = document.getElementById("currentDate");
const userRoleText = document.querySelector(".user-info span");

function isPrivilegedMembership(membership) {
    const roles = membership?.roles || {};
    const systemRoles = Array.isArray(roles.system) ? roles.system : [];
    const organizationRoles = Array.isArray(roles.organization) ? roles.organization : [];
    return systemRoles.includes("system_admin") || systemRoles.includes("admin") ||
        organizationRoles.some(role => ["org_admin", "organization_admin", "admin", "manager", "org_manager"].includes(role));
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            updateUI("Đang tải...", "Khởi tạo dữ liệu...");

            const identityRef = doc(db, "identities", user.uid);
            let identitySnap = await getDoc(identityRef);
            if (!identitySnap.exists()) {
                // Chỉ tự tạo identity cho chính tài khoản đang đăng nhập.
                // Firestore Rules cho phép thao tác này; membership không tự tạo ở đây.
                await setDoc(identityRef, {
                    fullName: user.displayName || user.email?.split("@")[0] || "Thành viên",
                    email: user.email || "",
                    status: "ACTIVE",
                    createdAt: new Date().toISOString()
                }, { merge: true });
                identitySnap = await getDoc(identityRef);
            }

            const membershipRef = doc(db, "memberships", `mem_${user.uid}_org_saovn_01`);
            const membershipSnap = await getDoc(membershipRef);
            if (!membershipSnap.exists()) {
                throw new Error("Không tìm thấy Membership của tài khoản. Hãy kiểm tra tài khoản đã được cấp quyền trong SAOVN-OS.");
            }

            const membership = membershipSnap.data();
            const fullName = identitySnap.data().fullName || user.email || "Thành viên";
            let displayRole = "Thành viên";
            const roles = membership.roles || {};
            if (roles?.system?.includes("system_admin")) {
                displayRole = "System Administrator";
            } else if (roles?.organization?.length) {
                const roleMap = {
                    org_admin: "Organization Administrator",
                    organization_admin: "Organization Administrator",
                    admin: "Administrator",
                    org_manager: "Organization Manager",
                    manager: "Manager",
                    member: "Thành viên"
                };
                displayRole = roleMap[roles.organization[0]] || roles.organization[0].replaceAll("_", " ");
            }
            updateUI(fullName, displayRole);
            await loadWorkDashboard(user.uid, isPrivilegedMembership(membership));
        } catch (error) {
            console.error("Lỗi kéo dữ liệu từ Firestore:", error);
            updateUI("Lỗi dữ liệu", error?.code === "permission-denied" ? "Không đủ quyền truy cập Firestore" : "Vui lòng kiểm tra kết nối");
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

async function loadWorkDashboard(uid, privileged) {
    let taskDocs = [];

    if (privileged) {
        // Admin/Manager được xem toàn bộ Work của workspace.
        const snap = await getDocs(collection(db, "workTasks"));
        taskDocs = snap.docs;
    } else {
        // Member không được query toàn bộ workTasks vì Rules giới hạn theo assignment.
        // Tách thành các query phù hợp với Security Rules rồi gộp kết quả.
        const [assignedSnap, createdSnap, legacyAssignedSnap] = await Promise.all([
            getDocs(query(collection(db, "workTasks"), where("assigneeIds", "array-contains", uid))),
            getDocs(query(collection(db, "workTasks"), where("createdBy", "==", uid))),
            getDocs(query(collection(db, "workTasks"), where("assigneeId", "==", uid)))
        ]);
        const unique = new Map();
        [...assignedSnap.docs, ...createdSnap.docs, ...legacyAssignedSnap.docs].forEach(item => unique.set(item.id, item));
        taskDocs = [...unique.values()];
    }

    const tasks = taskDocs.map(item => ({ id: item.id, ...item.data() }));
    const today = new Date().toISOString().slice(0, 10);
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const done = tasks.filter(t => t.status === "DONE").length;
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "DONE").length;
    const waiting = tasks.filter(t => ["BACKLOG", "TODO", "REVIEW"].includes(t.status)).length;

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
