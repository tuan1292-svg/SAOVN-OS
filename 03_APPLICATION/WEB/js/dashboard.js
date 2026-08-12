// js/dashboard.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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
                    roles: {
                        system: ["system_admin"],
                        organization: ["org_member"]
                    },
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

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        signOut(auth).catch((error) => console.error("Lỗi khi đăng xuất:", error));
    });
}

if (currentDate) {
    currentDate.textContent = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    }).format(new Date());
}

// Điều hướng thật từ Dashboard → Work Module
// Các mục hiện đang dùng #work sẽ mở thẳng Work thay vì chỉ cuộn trong Dashboard.
document.querySelectorAll('a[href="#work"]').forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        window.location.href = "work.html";
    });
});

// Các nút placeholder '#' chưa có module riêng thì không làm trang nhảy lên đầu.
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener("click", e => e.preventDefault());
});

// ----------------------------------------------------------------
// Glassmorphism Report Modal
// ----------------------------------------------------------------
const workReportModal = document.getElementById("workReportModal");
const openReportBtn = document.getElementById("openReportBtn");
const closeReportBtn = document.getElementById("closeReportBtn");

if (workReportModal && openReportBtn && closeReportBtn) {
    openReportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        workReportModal.classList.add("active");
    });

    closeReportBtn.addEventListener("click", () => {
        workReportModal.classList.remove("active");
    });

    workReportModal.addEventListener("click", (e) => {
        if (e.target === workReportModal) {
            workReportModal.classList.remove("active");
        }
    });
}